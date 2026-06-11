'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

const quotes = [
  { text: 'The past is a foreign country: they do things differently there.', author: 'L.P. Hartley' },
  { text: 'Archaeology is the search for fact, not truth.', author: 'Indiana Jones' },
  { text: 'Every artifact is a message from the past.', author: 'Anonymous' },
  { text: 'We are not inheriting the earth from our ancestors; we are borrowing it from our children.', author: 'Native American Proverb' },
];

export default function LoginPage() {
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIdx((prev) => (prev + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT — Atmospheric panel */}
      <div className="hidden lg:flex flex-col bg-[#1A1A2E] relative overflow-hidden">
        {/* Subtle background pattern — SVG artifact outlines */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="artifacts" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                {/* Amphora */}
                <path d="M40 20 Q40 10 50 10 L55 10 Q65 10 65 20 L70 40 Q70 50 60 55 L60 60 Q60 65 65 70 L65 75 Q65 80 55 80 L50 80 Q40 80 40 75 L40 70 Q45 65 45 60 L45 55 Q35 50 35 40 Z" fill="white" />
                {/* Column */}
                <rect x="85" y="15" width="6" height="55" rx="2" fill="white" />
                <rect x="82" y="10" width="12" height="8" rx="2" fill="white" />
                {/* Coin */}
                <circle cx="25" cy="100" r="12" fill="none" stroke="white" strokeWidth="1.5" />
                <circle cx="25" cy="100" r="6" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#artifacts)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="mb-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-[#B8860B] flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">⚱</span>
              </div>
              <span className="font-display text-2xl font-bold text-white">
                GAD
              </span>
            </div>

            <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
              The World's Archaeological Heritage, Open to All
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              A global, open-access database of archaeological artifacts
              — built by researchers, for researchers.
            </p>
          </div>

          {/* Rotating archaeology quote at bottom */}
          <blockquote className="mt-auto">
            <p className="text-white/50 text-sm italic leading-relaxed mb-2 transition-opacity duration-500">
              &ldquo;{quotes[currentQuoteIdx].text}&rdquo;
            </p>
            <cite className="text-white/30 text-xs not-italic">
              — {quotes[currentQuoteIdx].author}
            </cite>
          </blockquote>
        </div>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex flex-col bg-background">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#B8860B] via-[#C4971A] to-[#B8860B]/50" />

        {/* Form content centered */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            {/* Mobile logo (only on mobile) */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-[#B8860B] flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">⚱</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                GAD
              </span>
            </div>

            {/* Form heading */}
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Sign in to access your artifacts and submit new finds.
            </p>

            {/* The form */}
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>

            {/* Switch auth mode */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
