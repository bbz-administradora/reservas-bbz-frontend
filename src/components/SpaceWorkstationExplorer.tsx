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
  // Função para garantir que a data esteja dentro do período permitido (hoje até hoje + 6 dias)
  function ensureDateWithinAllowedRange(date: Date | undefined): Date {
    if (!date) return new Date()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxDate = addDays(today, 6) // Máximo: hoje + 6 dias (total de 7 dias)
    maxDate.setHours(23, 59, 59, 999)

    // Se a data for anterior a hoje, retorna hoje
    if (date < today) {
      return today
    }

    // Se a data for maior que o máximo permitido (hoje + 6), retorna o máximo
    if (date > maxDate) {
      return maxDate
    }

    return date
  }

  const [date, setDate] = useState<Date | undefined>(
    ensureDateWithinAllowedRange(new Date()),
  )

  // Handler personalizado para interceptar a mudança de data e aplicar validação
  function handleDateChange(newDate: Date | undefined) {
    const validatedDate = ensureDateWithinAllowedRange(newDate)
    setDate(validatedDate)
  }

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

  // Para a URL, sempre usar hoje como startDate e hoje + 6 como endDate (fixo)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = format(today, 'yyyy-MM-dd')
  const endDate = format(addDays(today, 6), 'yyyy-MM-dd')

  return (
    <div className={cn('flex w-full flex-col gap-6', className)}>
      <DatePickerWithButton
        date={date}
        setDate={handleDateChange}
        className="mt-4 w-full lg:w-min"
        fromDate={new Date()} // Bloqueia datas passadas
        toDate={addDays(new Date(), 6)} // Bloqueia datas além de hoje + 6 dias
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
