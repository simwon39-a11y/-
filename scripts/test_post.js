
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing post creation (JS)...');
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('No user found to associate post with.');
            return;
        }

        const post = await prisma.post.create({
            data: {
                title: 'Test Post from Script JS',
                content: 'This is a test post content.',
                category: 'FREE',
                authorId: user.id
            }
        });
        console.log('Post created successfully:', post.id);

        // Delete the test post
        await prisma.post.delete({
            where: { id: post.id }
        });
        console.log('Test post deleted successfully.');
    } catch (error) {
        console.error('Error during post creation:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
