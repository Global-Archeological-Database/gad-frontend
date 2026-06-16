'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ArtifactImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
}

export function ArtifactImage({ src, alt, className, ...props }: ArtifactImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gradient-to-br from-[#F0EBE0] to-[#E0D5C0]',
        className
      )}>
        <svg className="w-12 h-12 text-[#C4A88A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Warm gradient placeholder while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0EBE0] to-[#E0D5C0] z-10" />
      )}

      <Image
        src={src}
        alt={alt}
        className={cn(
          'object-cover transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        sizes={props.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
        {...props}
      />
    </div>
  )
}
