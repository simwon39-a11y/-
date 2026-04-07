import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- PushSubscription Integrity Check ---');
    const subscriptions = await prisma.pushSubscription.findMany();
    console.log(`Total Subscriptions in DB: ${subscriptions.length}`);

    let validCount = 0;
    let orphanedCount = 0;

    for (const sub of subscriptions) {
        const user = await prisma.user.findUnique({ where: { id: sub.userId } });
        if (user) {
            validCount++;
        } else {
            orphanedCount++;
        }
    }

    console.log(`Valid Subscriptions (with user): ${validCount}`);
    console.log(`Orphaned Subscriptions (No user matches): ${orphanedCount}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
