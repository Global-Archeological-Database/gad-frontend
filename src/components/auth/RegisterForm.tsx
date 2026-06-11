'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api';
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
  CheckIcon,
} from 'lucide-react';

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

const requirements = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
];

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
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

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      // Register the user profile in the backend
      await authApi.register(data.displayName);
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      switch (error.code) {
        case 'auth/email-already-in-use':
          setAuthError('An account with this email already exists.');
          break;
        case 'auth/weak-password':
          setAuthError('Password is too weak. Please choose a stronger one.');
          break;
        case 'auth/invalid-email':
          setAuthError('Invalid email address.');
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
        <Label htmlFor="displayName" className="text-sm font-medium text-foreground">
          Display Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Your name"
          autoComplete="name"
          {...register('displayName')}
          className={cn(
            'h-10 border-secondary/60 bg-white',
            'focus:border-primary/60 focus:ring-2 focus:ring-primary/10',
            'transition-all duration-200',
            'placeholder:text-muted-foreground/60',
            errors.displayName && 'border-destructive/60 focus:ring-destructive/10',
          )}
        />
        {errors.displayName && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircleIcon className="h-3 w-3 shrink-0" />
            {errors.displayName.message}
          </p>
        )}
      </div>

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
            errors.email && 'border-destructive/60 focus:ring-destructive/10',
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
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...register('password')}
            className={cn(
              'h-10 border-secondary/60 bg-white pr-10',
              'focus:border-primary/60 focus:ring-2 focus:ring-primary/10',
              'transition-all duration-200',
              'placeholder:text-muted-foreground/60',
              errors.password && 'border-destructive/60 focus:ring-destructive/10',
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
        {passwordValue.length > 0 && (
          <ul className="space-y-1 mt-2">
            {requirements.map((req) => (
              <li key={req.label} className="flex items-center gap-2 text-xs">
                <motion.div
                  animate={{
                    backgroundColor: req.test(passwordValue) ? '#16a34a' : '#D4C5A9',
                  }}
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                >
                  {req.test(passwordValue) && (
                    <CheckIcon className="h-2 w-2 text-white" />
                  )}
                </motion.div>
                <span
                  className={
                    req.test(passwordValue)
                      ? 'text-green-700'
                      : 'text-muted-foreground'
                  }
                >
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        )}
        {errors.password && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircleIcon className="h-3 w-3 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={cn(
              'h-10 border-secondary/60 bg-white pr-10',
              'focus:border-primary/60 focus:ring-2 focus:ring-primary/10',
              'transition-all duration-200',
              'placeholder:text-muted-foreground/60',
              errors.confirmPassword && 'border-destructive/60 focus:ring-destructive/10',
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircleIcon className="h-3 w-3 shrink-0" />
            {errors.confirmPassword.message}
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
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  );
}
