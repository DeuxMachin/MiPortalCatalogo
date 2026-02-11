'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/features/auth';
import LoginForm from '@/src/features/auth/ui/LoginForm';

export default function LoginPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/catalog');
        }
    }, [isAuthenticated, router]);

    if (isAuthenticated) return null;

    return <LoginForm />;
}
