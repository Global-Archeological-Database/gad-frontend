import Image from 'next/image';
import { cn } from '@/lib/utils';

interface GADLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon-only' | 'text-only';
  className?: string;
  /** Optional custom logo image URL (from admin settings) */
  logoSrc?: string | null;
  /** Optional custom site name (from admin settings) */
  siteName?: string;
}

const sizes = {
  sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
  md: { icon: 'w-9 h-9', text: 'text-xl', sub: 'text-[10px]' },
  lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
};

/**
 * GADLogo — canonical logo component.
 *
 * Renders the amphora icon (SVG), the "GAD" wordmark, and optionally
 * the "Archaeological Database" subtitle.
 * If `logoSrc` is provided, it renders the custom uploaded logo image instead
 * of the default amphora SVG icon.
 *
 * @example
 *   <GADLogo size="md" variant="full" />
 *   <GADLogo size="sm" variant="icon-only" className="mr-2" />
 *   <GADLogo logoSrc={settings.logo_url} siteName={settings.site_name} />
 */
export function GADLogo({ size = 'md', variant = 'full', className, logoSrc, siteName }: GADLogoProps) {
  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {variant !== 'text-only' && (
        <div
          className={cn(
            s.icon,
            'rounded-lg bg-primary flex items-center justify-center overflow-hidden',
            'shadow-warm-sm flex-shrink-0',
          )}
        >
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt="Site logo"
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            /* Amphora SVG icon — simplified urn shape */
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-[60%] h-[60%]"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M8 3h8M7 3c0 0-3 3-3 7s2 4 2 4v7h12v-7s2 0 2-4-3-7-3-7" />
              <path d="M5 10h3M19 10h-3" />
              <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
            </svg>
          )}
        </div>
      )}
      {variant !== 'icon-only' && (
        <div>
          <span className={cn(s.text, 'font-display font-bold text-foreground')}>
            {siteName || 'GAD'}
          </span>
          {variant === 'full' && (
            <span
              className={cn(
                s.sub,
                'block text-muted-foreground uppercase tracking-widest',
              )}
            >
              {siteName ? 'Site Administration' : 'Archaeological Database'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
