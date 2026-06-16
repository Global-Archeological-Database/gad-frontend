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
  SheetTrigger,
} from '@/components/ui/sheet';
import { GADLogo } from '@/components/ui/GADLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  MapIcon,
  Grid3X3Icon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  ShieldIcon,
  PlusCircleIcon,
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
        aria-current={isActive ? 'page' : undefined}
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

// ─── Amphora SVG icon (kept for backward compat, prefer GADLogo) ────────────

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

// ─── MobileNavItem sub-component ─────────────────────────────────────────────

function MobileNavItem({
  href,
  icon,
  label,
  primary = false,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
        "transition-all duration-200",
        isActive && "bg-primary/10 text-primary",
        primary && !isActive && "bg-primary/5 text-primary border border-primary/20",
        !isActive && !primary && "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="h-4 w-4 shrink-0">{icon}</span>
      {label}
    </Link>
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
          {(user.role === 'admin' || user.role === 'owner') && (
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <ShieldIcon className="w-4 h-4 mr-2" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {/* Theme toggle in dropdown */}
          <div className="px-2 py-1.5">
            <ThemeToggle />
          </div>
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
        <Link href="/" className="group">
          <GADLogo size="sm" variant="full" />
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
          {/* Submit Artifact — only when authenticated, desktop only, hidden on submit page */}
          {user && pathname !== '/submit' && (
            <Link href="/submit" className="hidden md:inline-flex">
              <Button variant="default" size="sm">
                Submit Artifact
              </Button>
            </Link>
          )}

          {/* Theme toggle — desktop */}
          <div className="hidden md:flex items-center">
            <ThemeToggle />
          </div>

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
              className="w-72 bg-background border-r border-secondary/20 flex flex-col"
            >
              {/* Top: Logo */}
              <div className="p-4 border-b border-secondary/40">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                >
                  <GADLogo size="md" variant="full" />
                </Link>
              </div>

              {/* Primary navigation */}
              <nav className="p-4 space-y-1">
                <MobileNavItem
                  href="/"
                  icon={<MapIcon className="h-4 w-4" />}
                  label="Map"
                  onClick={() => setMobileOpen(false)}
                />
                <MobileNavItem
                  href="/artifacts"
                  icon={<Grid3X3Icon className="h-4 w-4" />}
                  label="Collection"
                  onClick={() => setMobileOpen(false)}
                />
              </nav>

              {/* Authenticated navigation */}
              {user && (
                <>
                  <div className="px-4 py-2 border-t border-secondary/40">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Your Account
                    </p>
                    <div className="space-y-1">
                      <MobileNavItem
                        href="/submit"
                        icon={<PlusCircleIcon className="h-4 w-4" />}
                        label="Submit Artifact"
                        primary
                        onClick={() => setMobileOpen(false)}
                      />
                      <MobileNavItem
                        href="/dashboard"
                        icon={<LayoutDashboardIcon className="h-4 w-4" />}
                        label="Dashboard"
                        onClick={() => setMobileOpen(false)}
                      />
                      {(user.role === 'admin' || user.role === 'owner') && (
                        <MobileNavItem
                          href="/admin"
                          icon={<ShieldIcon className="h-4 w-4" />}
                          label="Admin Panel"
                          onClick={() => setMobileOpen(false)}
                        />
                      )}
                    </div>
                  </div>

                  {/* User info + sign out */}
                  <div className="mt-auto p-4 border-t border-secondary/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">
                          {(user.display_name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.display_name || 'Your Account'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">
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
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        aria-label="Sign out"
                      >
                        <LogOutIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Unauthenticated */}
              {!user && (
                <div className="mt-auto p-4 border-t border-secondary/40 space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button variant="default" className="w-full bg-primary hover:bg-primary/90">
                      Create Account
                    </Button>
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
