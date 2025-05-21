'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { env } from '@/infra/env'
import { webserver } from '@/infra/webserver'
import { ImageShimmerPlaceholder } from '@/utils/imagesUtils'
import { addDays, format } from 'date-fns'
import { ImageOffIcon, UserRoundIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Text } from './Text'
import { AspectRatio } from './ui/aspect-ratio'

type RoomCardProps = {
  capacidade: number
  description: string | null
  id: string
  imagens: string[]
  name: string
  recursos: string[]
  date: Date | undefined
}

export function RoomCard({
  id,
  name,
  capacidade,
  imagens,
  recursos,
  date,
}: RoomCardProps) {
  const baseDate = date ?? new Date()

  const startDate = format(baseDate, 'yyyy-MM-dd')
  const endDate = format(addDays(baseDate, 6), 'yyyy-MM-dd')

  return (
    <Card className="gap-4 overflow-hidden border-none pt-0 shadow-2xl">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-t-md">
        {imagens[0] ? (
          <Image
            src={`${env.NEXT_PUBLIC_BUCKET}/${imagens[0]}`}
            alt={`Imagem da sala ${name}`}
            fill
            className="object-cover"
            placeholder={ImageShimmerPlaceholder()}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="bg-muted/40 flex h-full items-center justify-center">
            <ImageOffIcon size={56} className="text-muted" />
          </div>
        )}
      </AspectRatio>
      <CardHeader className="">
        <Text variant="title-16-18-700">{name}</Text>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <div className="flex items-center gap-2">
          <UserRoundIcon size={24} className="text-primary" />
          <Text>
            {capacidade} pessoa{capacidade === 1 ? '' : 's'}
          </Text>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {recursos.map((recurso, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="rounded-full px-3 py-1.5"
            >
              {recurso}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-2">
        <Button variant="outline" className="w-full" asChild>
          <Link
            href={`${webserver.host}/salas/${id}?startDate=${startDate}&endDate=${endDate}`}
          >
            Ver espaço
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
