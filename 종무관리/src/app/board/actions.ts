'use server';

import db from '@/lib/db';

import { PostCategory } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sendGlobalPushNotification } from '@/lib/push';

/**
 * 특정 카테고리의 모든 게시물을 가져옵니다. (최소 정보만: ID, 제목, 카테고리, 작성자, 날짜)
 */
export async function getPostsByCategoryAction(category: PostCategory, limit: number = 15, skip: number = 0) {
    const start = performance.now();
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
            .from('Post')
            .select(`
                id,
                title,
                category,
                createdAt,
                author:User (
                    name,
                    buddhistName
                )
            `)
            .eq('category', category)
            .order('createdAt', { ascending: false })
            .range(skip, skip + limit - 1);

        if (error) throw error;

        const end = performance.now();
        console.log(`[PERF-SDK] getPostsByCategory(${category}): ${Math.round(end - start)}ms`);
        return data as any[];
    } catch (error) {
        console.error(`[PERF ERROR-SDK] getPostsByCategory:`, error);
        throw error;
    }
}

/**
 * 특정 ID의 게시물 상세 정보(본문, 사진, 댓글)를 가져옵니다.
 */
export async function getPostDetailAction(id: number) {
    const start = performance.now();
    try {
        const { supabase } = await import('@/lib/supabase');
        // 상세 정보와 모든 관계(이미지, 작성자, 댓글+댓글작성자)를 한 번의 HTTP 요청으로 가져옵니다.
        const { data, error } = await supabase
            .from('Post')
            .select(`
                *,
                images:PostImage(*),
                author:User(name, buddhistName, temple),
                comments:Comment(
                    *,
                    author:User(name, buddhistName)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // 댓글 정렬 (PostgREST에서 중첩 정렬이 복잡하므로 메모리에서 수행)
        if (data.comments) {
            data.comments.sort((a: any, b: any) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        }

        const end = performance.now();
        console.log(`[PERF-SDK] getPostDetail(${id}): ${Math.round(end - start)}ms`);
        return data;
    } catch (error) {
        console.error(`[PERF ERROR-SDK] getPostDetail:`, error);
        throw error;
    }
}

/**
 * 새 게시물을 작성합니다. (공지, 자료, 자유 게시판 공통)
 */
export async function createPostAction(formData: FormData) {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as PostCategory;
    const authorId = Number(formData.get('authorId'));
    const files = formData.getAll('images') as File[];

    if (!title || !content || !category || !authorId) {
        return { success: false, message: '모든 항목을 올바르게 입력해 주세요.' };
    }

    try {
        // 1. 게시물 정보 저장
        const post = await db.post.create({
            data: {
                title,
                content,
                category,
                authorId
            }
        });

        // 2. 사진이 있으면 저장
        if (files && files.length > 0) {
            const { supabase } = await import('@/lib/supabase');
            for (const file of files) {
                if (file.size === 0) continue;

                const fileName = `${Date.now()}_${file.name}`;
                const { data, error } = await supabase.storage
                    .from('images')
                    .upload(fileName, file);

                if (error) {
                    console.error('Supabase upload error:', error);
                    continue;
                }

                // Public URL 가져오기 (버킷이 public으로 설정되어 있어야 함)
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);

                await db.postImage.create({
                    data: {
                        url: publicUrl,
                        postId: post.id
                    }
                });
            }
        }

        revalidatePath('/board');
        revalidatePath('/dashboard');
        revalidatePath('/admin/notices/manage');

        // 새 글 알림을 모든 사용자에게 보냅니다. (작성자 제외 가능)
        const categoryName = category === 'NOTICE' ? '공지사항' :
            category === 'RESOURCE' ? '불교 자료' : '자유게시판';

        // 백그라운드에서 실행되도록 기다리지 않고 보냅니다.
        await sendGlobalPushNotification(
            `새로운 ${categoryName}이 등록되었습니다.`,
            title,
            '/board',
            authorId
        );


        return { success: true };

    } catch (error) {
        console.error('게시물 등록 중 오류:', error);
        return { success: false, message: '등록 중 문제가 발생했습니다.' };
    }
}

/**
 * 답글(댓글)을 등록합니다.
 */
export async function createCommentAction(postId: number, authorId: number, text: string) {
    if (!text) return { success: false, message: '내용을 입력해 주세요.' };

    try {
        const comment = await db.comment.create({
            data: {
                text,
                postId,
                authorId
            },
            include: { post: true }
        });

        // 댓글 알림을 모든 사용자에게 보냅니다.
        await sendGlobalPushNotification(
            `새로운 답글이 등록되었습니다.`,
            `${comment.post.title}: ${text}`,
            '/board',
            authorId
        );


        return { success: true };

    } catch (error) {
        return { success: false, message: '댓글 등록 중 오류가 발생했습니다.' };
    }
}

/**
 * 게시물을 삭제합니다.
 */
export async function deletePostAction(id: number) {
    try {
        await db.post.delete({
            where: { id }
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: '삭제 중 오류가 발생했습니다.' };
    }
}
/**
 * 게시물을 수정합니다.
 */
export async function updatePostAction(id: number, title: string, content: string) {
    try {
        await db.post.update({
            where: { id },
            data: {
                title,
                content
            }
        });

        revalidatePath('/board');
        revalidatePath('/dashboard');
        revalidatePath(`/admin/notices/edit/${id}`);
        revalidatePath('/admin/notices/manage');

        return { success: true };
    } catch (error) {
        console.error('게시물 수정 중 오류:', error);
        return { success: false, message: '수정 중 문제가 발생했습니다.' };
    }
}
