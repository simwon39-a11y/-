import { PrismaClient } from '@prisma/client';

async function testConnection() {
    console.log('--- DB 연결 및 쿼리 속도 정밀 진단 시작 ---');
    const prisma = new PrismaClient();

    try {
        // 1. 단순 연결 및 기초 쿼리 테스트
        const s1 = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        console.log(`[1] 순수 DB 연결 및 단순 쿼리(SELECT 1) 소요 시간: ${Date.now() - s1}ms`);

        // 2. 카운트 쿼리 테스트 (인덱스 성능 확인)
        const s2 = Date.now();
        const postCount = await prisma.post.count();
        console.log(`[2] 전체 게시글 수 조회 소요 시간: ${Date.now() - s2}ms (데이터 건수: ${postCount})`);

        // 3. 복합 쿼리 테스트 (상세 보기 유사)
        const s3 = Date.now();
        const latestPost = await prisma.post.findFirst({
            include: { author: true, images: true, _count: { select: { comments: true } } }
        });
        console.log(`[3] 복합 정보(Join 포함) 조회 소요 시간: ${Date.now() - s3}ms`);

    } catch (error) {
        console.error('진단 중 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
