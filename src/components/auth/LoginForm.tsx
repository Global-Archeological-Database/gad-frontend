'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  Loader2Icon,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    setAuthError(null);
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
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      switch (error.code) {
        case 'auth/user-not-found':
          setAuthError('No account found with this email address.');
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setAuthError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setAuthError('Too many attempts. Please wait a few minutes.');
          break;
        case 'auth/user-disabled':
          setAuthError('This account has been disabled.');
          break;
        default:
          setAuthError(error.message || 'An unexpected error occurred');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {authError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-destructive/8 border border-destructive/20 text-sm"
        >
          <AlertCircleIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-destructive">{authError}</p>
        </motion.div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
          className={cn(
            'h-10 border-secondary/60 bg-white',
            'focus:border-primary/60 focus:ring-2 focus:ring-primary/10',
            'transition-all duration-200',
            'placeholder:text-muted-foreground/60',
            errors.email && 'border-destructive/60 focus:ring-destructive/10'
          )}
        />
        {errors.email && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircleIcon className="h-3 w-3 shrink-0" />
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            {...register('password')}
            className={cn(
              'h-10 border-secondary/60 bg-white pr-10',
              'focus:border-primary/60 focus:ring-2 focus:ring-primary/10',
              'transition-all duration-200',
              'placeholder:text-muted-foreground/60',
              errors.password && 'border-destructive/60 focus:ring-destructive/10'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircleIcon className="h-3 w-3 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 shadow-warm-sm hover:shadow-golden transition-all duration-200 active:scale-[0.98] font-medium"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
}
