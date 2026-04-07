import fetch from 'node-fetch';

async function main() {
    const url = 'https://dqvxrvtauxawwxeyzdtx.supabase.co/storage/v1/object/public/images/1773722828151_KakaoTalk_20260219_111924393.jpg';
    console.log(`--- Testing URL Access: ${url} ---`);
    try {
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);
        if (response.ok) {
            console.log('Image is public and accessible! ✅');
        } else {
            console.log('Image is NOT accessible! ❌');
        }
    } catch (e: any) {
        console.error('Fetch error:', e.message);
    }
}

main().catch(console.error);
