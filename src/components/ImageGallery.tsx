'use client'

import { env } from '@/infra/env'
import { ImageShimmerPlaceholder } from '@/utils/imagesUtils'
import { cn } from '@/utils/mergeClassNames'
import { AspectRatio } from '@radix-ui/react-aspect-ratio'
import { ImageOffIcon } from 'lucide-react'
import Image from 'next/image'
import React, { HTMLAttributes, useState } from 'react'

interface ImageGalleryProps extends HTMLAttributes<HTMLDivElement> {
  images: string[]
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className,
  ...props
}) => {
  const [activeIndex, setActiveIndex] = useState(0)

  // garante sempre 5 slots no grid
  const thumbnails = Array.from({ length: 5 }, (_, i) => images[i] || '')

  return (
    <div
      className={cn('grid w-full gap-2 lg:grid-cols-2', className)}
      {...props}
    >
      {/* Imagem principal */}
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
        {images[activeIndex] ? (
          <Image
            src={`${env.NEXT_PUBLIC_BUCKET}/${images[activeIndex]}`}
            alt={`Main image ${activeIndex + 1}`}
            fill
            className="object-cover"
            placeholder={ImageShimmerPlaceholder()}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="bg-muted/40 flex h-full items-center justify-center">
            <ImageOffIcon size={56} className="text-muted" />
          </div>
        )}
      </AspectRatio>

      {/* Grid de thumbnails */}
      <div className="grid grid-cols-5 gap-2 lg:grid-cols-6">
        {thumbnails.map((img, idx) => (
          <div
            key={idx}
            className={cn(
              'overflow-hidden rounded-lg border-2',
              idx <= 2 ? 'lg:col-span-2' : 'lg:col-span-2',
              activeIndex === idx
                ? 'border-accent shadow-accent shadow-sm'
                : 'hover:border-accent/50 hover:shadow-accent/50 border-transparent shadow-sm shadow-transparent transition-colors',
            )}
          >
            <AspectRatio
              ratio={1}
              className="cursor-pointer"
              onClick={() => setActiveIndex(idx)}
            >
              {img ? (
                <Image
                  src={`${env.NEXT_PUBLIC_BUCKET}/${img}`}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  placeholder={ImageShimmerPlaceholder()}
                  sizes="(max-width: 768px) 33vw, 25vw"
                />
              ) : (
                <div className="bg-muted/40 flex h-full items-center justify-center">
                  <ImageOffIcon className="text-muted size-5 lg:size-14" />
                </div>
              )}
            </AspectRatio>
          </div>
        ))}
      </div>
    </div>
  )
}
