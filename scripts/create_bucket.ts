import { createClient } from '@supabase/supabase-js'
import fs from 'fs';
import path from 'path';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
            }
        });
    }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('--- Attempting to create "images" bucket ---');
    const { data, error } = await supabase.storage.createBucket('images', {
        public: true, // Make it public so anyone can view images
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
    });

    if (error) {
        console.error('Error creating bucket:', error.message);
        console.log('\n[권한 에러 발생 시] Supabase 대시보드에서 직접 "images" 버킷을 생성해야 합니다.');
    } else {
        console.log('Bucket "images" created successfully!', data);
    }
}

main().catch(e => console.error(e));
