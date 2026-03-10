import { getServerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPostsByCategoryAction } from '@/app/board/actions';
import { getUnreadCounts } from '@/lib/unread';
import DashboardClient from './DashboardClient';


export const dynamic = 'force-dynamic';

export default async function DashboardPage() {


    const user = await getServerUser();

    // 로그인이 안 되어 있으면 로그인 페이지로 보냅니다.
    if (!user) {
        redirect('/login');
    }

    // 서버 사이드에서 최신 데이터들을 최소한으로 가져옵니다. (상세 서술 및 댓글 제외)
    const [notices, resources, frees] = await Promise.all([
        getPostsByCategoryAction('NOTICE', 1, false),
        getPostsByCategoryAction('RESOURCE', 1, false),
        getPostsByCategoryAction('FREE', 1, false)
    ]);

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        process.env.VAPID_PUBLIC_KEY ||
        'BJRBZ0FKFSixD5QLvuhB-9L3W11mDrUFqbpK3srg_Oyxq7f8ORFimfGbD0UiCX9fCPEwez-By3I3_RacJIGVFj4';


    return (
        <DashboardClient
            initialUser={user}
            initialNotices={notices}
            initialResources={resources}
            initialFrees={frees}
            initialUnreadDetails={null}
            vapidPublicKey={vapidPublicKey}
        />
    );


}

