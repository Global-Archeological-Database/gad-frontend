'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#FDFAF5] border-b border-[#D4C5A9]">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Left: Logo + Name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#B8860B]">GAD</span>
          <span className="text-sm text-[#1A1208] hidden sm:inline">
            Global Archaeological Database
          </span>
        </Link>

        {/* Right: Auth-dependent content */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/submit">
                <Button variant="outline" size="sm" className="text-[#B8860B] border-[#D4C5A9] cursor-pointer">
                  Submit Artifact
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-[#1A1208] hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  {user.display_name || user.email}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#FDFAF5] border-[#D4C5A9]">
                  <DropdownMenuLabel className="text-[#1A1208]">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#D4C5A9]" />
                  <DropdownMenuItem
                    className="text-[#1A1208] cursor-pointer"
                    onClick={() => router.push('/dashboard')}
                  >
                    Dashboard
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem
                      className="text-[#1A1208] cursor-pointer"
                      onClick={() => router.push('/admin')}
                    >
                      Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#D4C5A9]" />
                  <DropdownMenuItem
                    className="text-[#1A1208] cursor-pointer"
                    onClick={handleLogout}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/submit">
                <Button variant="outline" size="sm" className="text-[#B8860B] border-[#D4C5A9] cursor-pointer">
                  Submit Artifact
                </Button>
              </Link>
              <Link href="/login" className="text-sm text-[#1A1208] hover:text-[#B8860B] transition-colors">
                Login
              </Link>
              <Link href="/register">
                <Button variant="outline" size="sm" className="text-[#B8860B] border-[#D4C5A9] cursor-pointer">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
