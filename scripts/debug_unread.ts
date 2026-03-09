import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUnread() {
    const users = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    console.log('--- User Timestamps ---');
    for (const user of users) {
        console.log(`User: ${user.name} (${user.id})`);
        console.log(`- lastNoticeViewAt: ${user.lastNoticeViewAt}`);
        console.log(`- lastResourceViewAt: ${user.lastResourceViewAt}`);
        console.log(`- lastFreeViewAt: ${user.lastFreeViewAt}`);
    }

    const posts = await prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, category: true, createdAt: true }
    });

    console.log('\n--- Recent Posts ---');
    for (const post of posts) {
        console.log(`Post: ${post.title} (${post.category})`);
        console.log(`- createdAt: ${post.createdAt}`);
    }

    // Check counts for all fetched users
    for (const user of users) {
        const unreadNotices = await prisma.post.count({
            where: {
                category: 'NOTICE',
                createdAt: { gt: user.lastNoticeViewAt }
            }
        });
        console.log(`\nUnread Notices for ${user.name}: ${unreadNotices}`);

        const unreadFrees = await prisma.post.count({
            where: {
                category: 'FREE',
                createdAt: { gt: user.lastFreeViewAt }
            }
        });
        console.log(`Unread Frees for ${user.name}: ${unreadFrees}`);
    }
}

checkUnread()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
