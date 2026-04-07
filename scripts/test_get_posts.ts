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
    console.log('--- Testing getPostsByCategoryAction select ---');
    const { data, error } = await supabase
        .from('Post')
        .select(`
            id,
            title,
            category,
            createdAt,
            author:User (
                name,
                buddhistName
            ),
            images:PostImage (
                url
            )
        `)
        .eq('id', 58) // Use the ID of the post with image we found earlier
        .single();

    if (error) {
        console.error('Error fetching post:', error.message);
    } else {
        console.log('Post Data:', JSON.stringify(data, null, 2));
    }
}

main().catch(console.error);
