import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    console.log('--- Creating Supabase Storage Policies via Raw SQL ---');
    try {
        // 1. Enable RLS on storage.objects (if not already enabled)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        `);
        console.log('Row Level Security enabled on storage.objects.');

        // 2. Drop existing policies on storage.objects to avoid conflicts
        const policiesToDrop = [
            'Allow public select',
            'Allow public insert',
            'Allow public update',
            'Allow public delete'
        ];
        
        for (const policy of policiesToDrop) {
            try {
                await prisma.$executeRawUnsafe(`
                    DROP POLICY IF EXISTS "${policy}" ON storage.objects;
                `);
            } catch (err: any) {
                console.log(`Failed to drop policy ${policy}:`, err.message);
            }
        }

        // 3. Create SELECT policy: Allow anyone to view images
        await prisma.$executeRawUnsafe(`
            CREATE POLICY "Allow public select" ON storage.objects
            FOR SELECT
            TO public
            USING (bucket_id = 'images');
        `);
        console.log('Created SELECT policy.');

        // 4. Create INSERT policy: Allow anyone to upload images
        await prisma.$executeRawUnsafe(`
            CREATE POLICY "Allow public insert" ON storage.objects
            FOR INSERT
            TO public
            WITH CHECK (bucket_id = 'images');
        `);
        console.log('Created INSERT policy.');

        // 5. Create DELETE policy: Allow anyone to delete images (for cleanup/edit)
        await prisma.$executeRawUnsafe(`
            CREATE POLICY "Allow public delete" ON storage.objects
            FOR DELETE
            TO public
            USING (bucket_id = 'images');
        `);
        console.log('Created DELETE policy.');

        // 6. Create UPDATE policy: Allow anyone to update images
        await prisma.$executeRawUnsafe(`
            CREATE POLICY "Allow public update" ON storage.objects
            FOR UPDATE
            TO public
            USING (bucket_id = 'images')
            WITH CHECK (bucket_id = 'images');
        `);
        console.log('Created UPDATE policy.');

        console.log('--- Policies created successfully! ---');

    } catch (e: any) {
        console.error('Failed to create storage policies:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
