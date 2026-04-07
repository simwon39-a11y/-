import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const images = await prisma.postImage.findMany({ include: { post: true } });
    console.log('--- PostImage Table ---');
    console.log(`Total Images: ${images.length}`);
    images.forEach(img => {
        console.log(`ID: ${img.id}, PostID: ${img.postId}, URL: ${img.url}, Post: ${img.post?.title}`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
