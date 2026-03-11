const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const posts = await prisma.post.findMany({
        take: 5,
        include: {
            author: true
        }
    });

    console.log('Sample Posts with Authors:');
    posts.forEach(p => {
        console.log(`Post Title: ${p.title}`);
        console.log(`Author Name: ${p.author.name}`);
        console.log(`Author Buddhist Name: ${p.author.buddhistName}`);
        console.log('---');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
