import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        {
          'rounded-sm': rounded === 'sm',
          'rounded-md': rounded === 'md',
          'rounded-lg': rounded === 'lg',
          'rounded-full': rounded === 'full',
        },
        'bg-gradient-to-r from-[#F0EBE0] via-[#E8E0D0] to-[#F0EBE0]',
        'bg-[length:200%_100%]',
        'animate-shimmer',
        className,
      )}
    />
  )
}
