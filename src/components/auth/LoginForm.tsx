'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFirebaseError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      // Set user in store immediately so the UI updates before the redirect
      const firebaseUser = credential.user;
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
      router.push('/');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setFirebaseError('Invalid email or password');
          break;
        case 'auth/too-many-requests':
          setFirebaseError('Too many attempts. Please try again later.');
          break;
        case 'auth/user-disabled':
          setFirebaseError('This account has been disabled.');
          break;
        default:
          setFirebaseError(error.message || 'An unexpected error occurred');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {firebaseError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {firebaseError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
          aria-invalid={errors.email ? true : undefined}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          {...register('password')}
          aria-invalid={errors.password ? true : undefined}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full cursor-pointer"
        style={{ backgroundColor: '#B8860B', color: '#fff' }}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size={16} />
            Signing in…
          </span>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}
