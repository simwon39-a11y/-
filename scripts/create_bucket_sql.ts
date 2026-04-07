import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Attempting to create bucket via raw SQL ---');
    try {
        // storage.buckets 테이블에 직접 인서트 시도
        // id 와 name 은 동일하게 설정하고, public=true 로 설정합니다.
        await prisma.$executeRawUnsafe(`
            INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
            VALUES ('images', 'images', true, 5242880, '{"image/*"}')
            ON CONFLICT (id) DO NOTHING;
        `);
        console.log('Bucket "images" created successfully via SQL! 🚀');
    } catch (e: any) {
        if (e.message.includes('file_size_limit')) {
            // 필드가 다를 수 있으므로 최소한의 필드로 재시도
            try {
                await prisma.$executeRawUnsafe(`
                     INSERT INTO storage.buckets (id, name, public) 
                     VALUES ('images', 'images', true)
                     ON CONFLICT (id) DO NOTHING;
                 `);
                console.log('Bucket "images" created successfully (minimal fields) via SQL! 🚀');
            } catch (retryError: any) {
                console.error('SQL insert failed (retry):', retryError.message);
            }
        } else {
            console.error('SQL insert failed:', e.message);
        }
    }
}

main()
    .catch(e => console.error('Outside error:', e))
    .finally(async () => await prisma.$disconnect());
