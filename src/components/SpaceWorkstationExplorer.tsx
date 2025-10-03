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

  // Organizar os dados por zone > positions (ignorando floor)
  const spaces = data?.data?.spaces || []

  // Função auxiliar para extrair o nome de exibição (tudo após o primeiro traço)
  function extractDisplayName(name: string): string {
    const firstDashIndex = name.indexOf('-')
    if (firstDashIndex === -1) return name // Se não houver traço, retorna o nome completo

    const displayName = name.substring(firstDashIndex + 1).trim()

    // Capitalizar: primeira letra maiúscula, restante minúscula
    if (!displayName) return displayName
    return (
      displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase()
    )
  }

  // Função auxiliar para converter string em número (zone e position já virão como números ou strings numéricas)
  function toNumber(value: string | number | null | undefined): number {
    if (typeof value === 'number') return value
    if (!value) return 0
    const num = parseInt(String(value), 10)
    return isNaN(num) ? 0 : num
  }

  // Agrupar apenas por zona (ignorando o andar)
  const zones = spaces.reduce<Record<string, typeof spaces>>((acc, space) => {
    if (!space.zone) return acc
    const zoneKey = String(space.zone).trim()
    if (!acc[zoneKey]) acc[zoneKey] = []
    acc[zoneKey].push(space)
    return acc
  }, {})

  // Ordenar as posições dentro de cada zona por position numérica
  const sortedZones = Object.entries(zones).map(([zone, positions]) => {
    const sortedPositions = [...positions].sort((a, b) => {
      const numA = toNumber(a.position)
      const numB = toNumber(b.position)
      return numA - numB
    })
    return { zone, positions: sortedPositions }
  })

  // Ordenar as zonas numericamente
  sortedZones.sort((a, b) => {
    const numA = toNumber(a.zone)
    const numB = toNumber(b.zone)
    return numA - numB
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

      {sortedZones.length === 0 && (
        <Text className="text-muted-foreground mt-4">
          Nenhuma estação disponível para a data selecionada.
        </Text>
      )}

      {sortedZones.map(({ zone, positions }) => (
        <div key={zone} className="mb-6">
          <Text variant="title-18-24-700" className="mt-4 mb-2">
            Seção {zone}
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
                    {extractDisplayName(space.name)}
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
  )
}
