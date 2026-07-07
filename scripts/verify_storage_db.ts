import { PrismaClient } from '@prisma/client';

// Custom JSON serializer that handles BigInt
function serialize(obj: any) {
    return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    , 2);
}

async function main() {
    const prisma = new PrismaClient();
    console.log('--- Direct Database storage.buckets Check ---');
    try {
        const buckets = await prisma.$queryRawUnsafe(`
            SELECT * FROM storage.buckets;
        `);
        console.log('Buckets in DB:', serialize(buckets));

        const policies = await prisma.$queryRawUnsafe(`
            SELECT schemaname, tablename, policyname, permissive, cmd 
            FROM pg_policies 
            WHERE schemaname = 'storage';
        `);
        console.log('Storage Policies in DB:', serialize(policies));

    } catch (e: any) {
        console.error('Failed to query storage metadata from DB:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
