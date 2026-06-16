'use client'

import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center rounded-full border border-secondary/60 bg-muted/50 p-0.5 gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-7 w-7 rounded-full bg-muted"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center rounded-full border border-secondary/60 bg-muted/50 p-0.5 gap-0.5">
      {[
        { value: 'light',  icon: SunIcon,     label: 'Light mode' },
        { value: 'system', icon: MonitorIcon, label: 'System theme' },
        { value: 'dark',   icon: MoonIcon,    label: 'Dark mode' },
      ].map(({ value, icon: Icon, label }) => {
        const isActive = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            type="button"
            title={label}
            aria-label={label}
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center",
              "transition-all duration-200",
              isActive
                ? "bg-background shadow-warm-xs text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}
