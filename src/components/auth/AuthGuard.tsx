'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({
  children,
  requireAdmin = false,
}: AuthGuardProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.replace('/login');
    } else if (requireAdmin && user.role !== 'admin' && user.role !== 'owner') {
      router.replace('/');
    }
  }, [isInitialized, user, requireAdmin, router]);

  if (!isInitialized) {
    return <LoadingSpinner size={48} className="mx-auto mt-20" />;
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && user.role !== 'admin' && user.role !== 'owner') {
    return null;
  }

  return <>{children}</>;
}
