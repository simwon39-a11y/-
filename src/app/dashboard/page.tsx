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

    // 서버 사이드에서 초기 데이터를 한꺼번에 가져옵니다. (병렬 처리)
    const [unreadDetails, notices, resources, frees] = await Promise.all([
        getUnreadCounts(user.id),
        getPostsByCategoryAction('NOTICE', 1),
        getPostsByCategoryAction('RESOURCE', 1),
        getPostsByCategoryAction('FREE', 1)
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
            initialUnreadDetails={unreadDetails.details}
            initialPushStatus={(unreadDetails.pushCount ?? 0) > 0}
            vapidPublicKey={vapidPublicKey}
        />
    );
}

