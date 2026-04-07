import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const postCount = await prisma.post.count();
    const userCount = await prisma.user.count();
    const posts = await prisma.post.findMany({ take: 5, include: { author: true } });

    console.log('--- DB STATUS ---');
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Posts: ${postCount}`);
    console.log('Sample Posts:', JSON.stringify(posts, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
