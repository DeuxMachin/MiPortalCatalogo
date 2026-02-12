'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/features/auth';
import LoginForm from '@/src/features/auth/ui/LoginForm';

export default function LoginPage() {
    const { isAuthenticated, isInitialising } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isInitialising && isAuthenticated) {
            router.replace('/catalog');
        }
    }, [isAuthenticated, isInitialising, router]);

    if (isInitialising || isAuthenticated) return null;

    return <LoginForm />;
}
