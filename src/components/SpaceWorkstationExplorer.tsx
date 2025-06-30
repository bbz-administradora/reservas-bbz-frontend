// src/components/SpaceWorkstationExplorer.tsx
'use client'

import { useListSpaceSlots } from '@/api/endpoints/space-slot/space-slot'
import { DatePickerWithButton } from '@/components/DatePickerWithButton'
import { Text } from '@/components/Text'
import { webserver } from '@/infra/webserver'
import { cn } from '@/utils/mergeClassNames'
import { addDays, format } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'

interface SpaceWorkstationExplorerProps {
  className?: string
}

export function SpaceWorkstationExplorer({
  className,
}: SpaceWorkstationExplorerProps) {
  // Função para garantir que a data seja sempre hoje ou no futuro
  function ensureDateIsNotPast(date: Date | undefined): Date {
    if (!date) return new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) {
      return today
    }
    return date
  }

  const [date, setDate] = useState<Date | undefined>(
    ensureDateIsNotPast(new Date()),
  )

  const formattedDateTime = date
    ? format(date, "yyyy-MM-dd'T'00:00:00.000XXX")
    : format(new Date(), "yyyy-MM-dd'T'00:00:00.000XXX")

  const params = {
    datetime: formattedDateTime,
    page: '1',
    pageSize: '100',
    type: 'workstation' as const,
  }

  const { data, isLoading, error } = useListSpaceSlots(params, {
    swr: {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 30000,
    },
  })

  // Organizar os dados por floor > zone > positions
  const spaces = data?.data?.spaces || []

  // Agrupar por andar (floor)
  const floors = spaces.reduce<Record<string, typeof spaces>>((acc, space) => {
    if (!space.floor) return acc
    if (!acc[space.floor]) acc[space.floor] = []
    acc[space.floor].push(space)
    return acc
  }, {})

  // Para cada andar, agrupar por zona
  const floorsWithZones = Object.entries(floors).map(([floor, floorSpaces]) => {
    const zones = floorSpaces.reduce<Record<string, typeof floorSpaces>>(
      (acc, space) => {
        if (!space.zone) return acc
        if (!acc[space.zone]) acc[space.zone] = []
        acc[space.zone].push(space)
        return acc
      },
      {},
    )
    return { floor, zones }
  })

  const baseDate = date ?? new Date()
  const startDate = format(baseDate, 'yyyy-MM-dd')
  const endDate = format(addDays(baseDate, 6), 'yyyy-MM-dd')

  return (
    <div className={cn('flex w-full flex-col gap-6', className)}>
      <DatePickerWithButton
        date={date}
        setDate={setDate}
        className="mt-4 w-full lg:w-min"
      />

      {floorsWithZones.length === 0 && (
        <Text className="text-muted-foreground mt-4">
          Nenhuma estação disponível para a data selecionada.
        </Text>
      )}

      {floorsWithZones.map(({ floor, zones }) => (
        <div key={floor} className="mb-8">
          <Text variant="title-18-24-700" className="mt-4 mb-2">
            Andar {floor}
          </Text>
          {Object.entries(zones).map(([zone, positions]) => (
            <div key={zone} className="mb-4">
              <Text variant="title-16-18-500" className="mt-2 mb-1">
                Zona {zone}
              </Text>
              <div className="flex flex-wrap gap-3">
                {positions.map((space) => (
                  <Link
                    key={space.id}
                    href={`${webserver.host}/espacos/${space.id}?startDate=${startDate}&endDate=${endDate}`}
                    className="no-underline"
                  >
                    <div className="group text-card-foreground bg-background flex max-w-[160px] min-w-[120px] flex-col items-center rounded-lg border px-4 py-3 shadow-sm transition-all hover:bg-linear-[330deg,#0664E4_0%,#04193B_80%]">
                      <Text className="text-primary group-hover:text-background text-center font-semibold transition-all">
                        {space.name}
                      </Text>
                      <Text className="text-muted-foreground group-hover:text-background mt-1 text-center text-xs transition-all">
                        Posição {space.position}
                      </Text>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
