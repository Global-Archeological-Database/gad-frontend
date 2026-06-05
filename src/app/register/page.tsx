'use client';

import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: '#FDFAF5' }}
    >
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: '#B8860B' }}
          >
            GAD
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Global Archaeological Database
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl bg-white p-8"
          style={{
            border: '1px solid #D4C5A9',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          }}
        >
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Create Account
          </h2>
          <RegisterForm />
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium underline-offset-2 hover:underline"
              style={{ color: '#B8860B' }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
