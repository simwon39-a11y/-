import { getServerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function LoginPage() {
    const user = await getServerUser();

    // 이미 로그인된 사용자라면 대시보드로 바로 보냅니다.
    if (user) {
        redirect('/dashboard');
    }

    return <LoginForm />;
}
