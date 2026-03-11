
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugUnread() {
    console.log('--- Unread Count Debug ---');

    // 1. Get first user
    const { data: user, error: userError } = await supabase
        .from('User')
        .select('*')
        .limit(1)
        .single();

    if (userError || !user) {
        console.error('Error fetching user:', userError);
        return;
    }

    console.log(`User: ${user.name} (${user.id})`);
    console.log(`lastNoticeViewAt: ${user.lastNoticeViewAt}`);
    console.log(`lastResourceViewAt: ${user.lastResourceViewAt}`);
    console.log(`lastFreeViewAt: ${user.lastFreeViewAt}`);

    // 2. Count posts newer than view times
    const [n, r, f] = await Promise.all([
        supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'NOTICE').gt('createdAt', user.lastNoticeViewAt),
        supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'RESOURCE').gt('createdAt', user.lastResourceViewAt),
        supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'FREE').gt('createdAt', user.lastFreeViewAt)
    ]);

    console.log(`Unread Notices: ${n.count}`);
    console.log(`Unread Resources: ${r.count}`);
    console.log(`Unread Frees: ${f.count}`);

    // 3. Get latest posts for comparison
    const { data: latestPosts } = await supabase
        .from('Post')
        .select('title, category, createdAt')
        .order('createdAt', { ascending: false })
        .limit(5);

    console.log('\nLatest 5 Posts:');
    latestPosts.forEach(p => {
        console.log(`- [${p.category}] ${p.title} (${p.createdAt})`);
    });
}

debugUnread().catch(console.error);
