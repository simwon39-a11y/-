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
    console.log('--- Testing image upload to "images" bucket ---');
    
    // Create a 1x1 pixel transparent PNG buffer
    const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(dummyPngBase64, 'base64');
    const fileName = `test_${Date.now()}.png`;

    const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, { contentType: 'image/png' });

    if (error) {
        console.error('Upload Failed:', error.message);
    } else {
        console.log('Upload Succeeded!', data);
        // Clean up
        const { error: removeError } = await supabase.storage.from('images').remove([fileName]);
        if (removeError) {
            console.error('Cleanup Failed:', removeError.message);
        } else {
            console.log('Cleanup Succeeded!');
        }
    }
}

main().catch(e => console.error(e));
