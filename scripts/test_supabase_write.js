
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseWrite() {
    console.log('Testing Supabase SDK Write...');

    // 1. Get a user
    const { data: users, error: userError } = await supabase
        .from('User')
        .select('id')
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error('Error fetching user:', userError);
        return;
    }
    const userId = users[0].id;

    // 2. Create a post
    const { data: post, error: postError } = await supabase
        .from('Post')
        .insert([
            {
                title: 'Test Post from Supabase SDK',
                content: 'This is a test post content via Supabase SDK.',
                category: 'FREE',
                authorId: userId
            }
        ])
        .select()
        .single();

    if (postError) {
        console.error('Error creating post:', postError);
        return;
    }
    console.log('Post created successfully with Supabase SDK:', post.id);

    // 3. Delete the test post
    const { error: deleteError } = await supabase
        .from('Post')
        .delete()
        .eq('id', post.id);

    if (deleteError) {
        console.error('Error deleting post:', deleteError);
    } else {
        console.log('Test post deleted successfully.');
    }
}

testSupabaseWrite().catch(console.error);
