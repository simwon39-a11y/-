import { PrismaClient } from '@prisma/client';

async function testConnection(url: string, label: string) {
    console.log(`\n--- Testing ${label} ---`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    });

    try {
        const userCount = await prisma.user.count();
        console.log(`SUCCESS! User Count: ${userCount}`);
        const postCount = await prisma.post.count();
        console.log(`Post Count: ${postCount}`);
        
        const latestUsers = await prisma.user.findMany({
            take: 3,
            select: { id: true, name: true, phone: true }
        });
        console.log('Latest 3 Users:', latestUsers);
        return true;
    } catch (err: any) {
        console.error(`FAILED: ${err.message.substring(0, 200)}`);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    // Passwords to try
    const pwds = ['!simwon338833', 'quddlf338833'];
    // Projects to test: dqvxrvtauxawwxeyzdtx
    const proj = 'dqvxrvtauxawwxeyzdtx';
    
    // We will try direct connection and pooled connection
    for (const pwd of pwds) {
        const escapedPwd = encodeURIComponent(pwd);
        
        // 1. Direct connection
        const directUrl = `postgresql://postgres.${proj}:${escapedPwd}@db.${proj}.supabase.co:5432/postgres`;
        await testConnection(directUrl, `Direct Connection with password: ${pwd}`);
        
        // 2. Pooled connection (session)
        const pooledUrl = `postgresql://postgres.${proj}:${escapedPwd}@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`;
        await testConnection(pooledUrl, `Pooled (6543) with password: ${pwd}`);
        
        // 3. Pooled connection (transaction)
        const pooledUrl5432 = `postgresql://postgres.${proj}:${escapedPwd}@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres`;
        await testConnection(pooledUrl5432, `Pooled (5432) with password: ${pwd}`);
    }
}

main();
