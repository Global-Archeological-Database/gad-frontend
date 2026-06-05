'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch the full user profile from the backend
          const profile = await authApi.getProfile();
          setUser(profile);
        } catch {
          // If the backend profile fetch fails (e.g. network error),
          // still mark as initialized with a minimal user object
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            display_name: firebaseUser.displayName ?? '',
            profile_picture_url: firebaseUser.photoURL,
            role: 'user',
            created_at: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
            settings: {
              show_name_publicly: true,
              theme: 'light',
            },
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      setInitialized(true);
    });

    return unsubscribe;
  }, [setUser, setLoading, setInitialized]);

  return <>{children}</>;
}
