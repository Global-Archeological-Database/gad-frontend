'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  MapIcon,
  Grid3X3Icon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  ShieldIcon,
} from 'lucide-react';

// ─── NavLink sub-component ───────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <span className="group">
      <Link
        href={href}
        className={cn(
          'relative text-sm font-medium py-1 transition-colors duration-200 inline-flex items-center gap-1.5',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {icon}
        {label}
        <span
          className={cn(
            'absolute bottom-0 left-0 h-0.5 bg-primary transition-transform duration-200 ease-out-quart',
            isActive
              ? 'w-full scale-x-100'
              : 'w-full scale-x-0 group-hover:scale-x-100',
          )}
        />
      </Link>
    </span>
  );
}

// ─── Nav link config ─────────────────────────────────────────────────────────

const navLinks = [
  {
    href: '/',
    label: 'Map',
    icon: <MapIcon className="w-3.5 h-3.5" />,
  },
  {
    href: '/artifacts',
    label: 'Artifacts',
    icon: <Grid3X3Icon className="w-3.5 h-3.5" />,
  },
];

// ─── Amphora SVG icon ────────────────────────────────────────────────────────

function AmphoraIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3c-2 0-4 1.5-4 4 0 1.5 1 3 2 3.5V11c0 1-1 2-1 3v2c0 1.5 1 3 3 3s3-1.5 3-3v-2c0-1-1-2-1-3V10.5c1-.5 2-2 2-3.5 0-2.5-2-4-4-4z" />
      <path d="M8 8c0 1.5.5 2 1.5 2.5" />
      <path d="M16 8c0 1.5-.5 2-1.5 2.5" />
    </svg>
  );
}

// ─── Main Header component ───────────────────────────────────────────────────

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Scroll listener
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    // If not on homepage, always show scrolled styles
    if (pathname !== '/') {
      setScrolled(true);
      return;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, handleScroll]);

  const headerClass = cn(
    'sticky top-0 z-50 w-full h-16 md:h-16 transition-all duration-300 ease-out-quart',
    scrolled
      ? 'bg-background/88 backdrop-blur-[12px] saturate-[1.2] border-b border-secondary/60 shadow-warm-sm'
      : 'bg-transparent',
  );

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  // ── Auth section: loading skeleton ──────────────────────────────────────
  const renderAuthSection = () => {
    if (!isInitialized) {
      return (
        <Skeleton className="w-9 h-9 rounded-full bg-muted animate-pulse" />
      );
    }

    if (!user) {
      return (
        <>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="default" size="sm">
              Register
            </Button>
          </Link>
        </>
      );
    }

    // Authenticated user dropdown
    const displayName = user.display_name || user.email;
    const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-display text-sm font-bold text-white ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200 shadow-warm-sm hover:shadow-golden cursor-pointer outline-none">
          {initial}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {/* User info header */}
          <div className="px-1.5 py-2">
            <p className="text-sm font-medium text-foreground truncate">
              {user.display_name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <LayoutDashboardIcon className="w-4 h-4 mr-2" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          {user.role === 'admin' && (
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <ShieldIcon className="w-4 h-4 mr-2" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleSignOut}
          >
            <LogOutIcon className="w-4 h-4 mr-2" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className={headerClass}>
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* ── Left: Logo ─────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary transition-shadow duration-200 group-hover:shadow-golden">
            <AmphoraIcon className="text-white" />
          </span>
          <span className="font-display text-lg font-bold text-foreground">
            GAD
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            Global Archaeological Database
          </span>
        </Link>

        {/* ── Center: Desktop Nav Links ─────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
            />
          ))}
        </nav>

        {/* ── Right: Auth + Submit + Mobile Hamburger ───────────────── */}
        <div className="flex items-center gap-2">
          {/* Submit Artifact — only when authenticated, desktop only */}
          {user && (
            <Link href="/submit" className="hidden md:inline-flex">
              <Button variant="default" size="sm">
                Submit Artifact
              </Button>
            </Link>
          )}

          {/* Auth section — desktop only */}
          <div className="hidden md:flex items-center gap-1">
            {renderAuthSection()}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 cursor-pointer" aria-label="Toggle navigation menu">
              {mobileOpen ? (
                <XIcon className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-background border-r border-secondary/20"
            >
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-3">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary shadow-golden">
                      <AmphoraIcon className="text-white" />
                    </span>
                  </Link>
                  <div>
                    <span className="font-display text-lg font-bold text-foreground block">
                      GAD
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Global Archaeological Database
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile nav links */}
              <nav className="flex flex-col gap-1 px-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors duration-200',
                        isActive
                          ? 'text-primary bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-secondary/20 my-4" />

              {/* Mobile: Submit Artifact */}
              {user && (
                <div className="px-2 mb-4">
                  <Link
                    href="/submit"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button variant="default" className="w-full">
                      Submit Artifact
                    </Button>
                  </Link>
                </div>
              )}

              <div className="border-t border-secondary/20 my-4" />

              {/* Mobile: Auth section */}
              <div className="px-2 space-y-2">
                {!isInitialized ? (
                  <Skeleton className="w-full h-10 rounded-lg bg-muted animate-pulse" />
                ) : !user ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button variant="ghost" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button variant="default" className="w-full">
                        Register
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-display text-sm font-bold text-white">
                        {user.display_name
                          ? user.display_name.charAt(0).toUpperCase()
                          : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.display_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleSignOut();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-200 cursor-pointer"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
