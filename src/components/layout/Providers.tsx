'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { queryClient } from '@/lib/queryClient';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setInitialized]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
