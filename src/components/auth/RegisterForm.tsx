'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters')
      .max(50, 'Display name must be at most 50 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: standardSchemaResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setFirebaseError(null);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      // Register the user profile in the backend
      await authApi.register(data.displayName);
      router.push('/');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      switch (error.code) {
        case 'auth/email-already-in-use':
          setFirebaseError('An account with this email already exists');
          break;
        case 'auth/weak-password':
          setFirebaseError('Password is too weak');
          break;
        case 'auth/invalid-email':
          setFirebaseError('Invalid email address');
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
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Your name"
          autoComplete="name"
          {...register('displayName')}
          aria-invalid={errors.displayName ? true : undefined}
        />
        {errors.displayName && (
          <p className="text-sm text-red-600">{errors.displayName.message}</p>
        )}
      </div>

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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          {...register('password')}
          aria-invalid={errors.password ? true : undefined}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          aria-invalid={errors.confirmPassword ? true : undefined}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
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
            Creating account…
          </span>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
}
