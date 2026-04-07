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
    console.log('--- Testing upload to "images" bucket ---');
    const dummyContent = 'Hello World';
    const fileName = `test_${Date.now()}.txt`;

    // Convert string to file-like object or Buffer
    const buffer = Buffer.from(dummyContent);

    const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, { contentType: 'text/plain' });

    if (error) {
        console.error('Upload Failed:', error.message);
    } else {
        console.log('Upload Succeeded!', data);
        // Clean up
        await supabase.storage.from('images').remove([fileName]);
    }
}

main().catch(e => console.error(e));
