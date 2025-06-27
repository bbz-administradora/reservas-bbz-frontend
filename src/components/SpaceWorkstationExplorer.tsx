// src/components/SpaceWorkstationExplorer.tsx
'use client'

import { ListSpaceSlots200 } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { DatePickerWithButton } from '@/components/DatePickerWithButton'
import { Text } from '@/components/Text'
import { cn } from '@/utils/mergeClassNames'
import { useState } from 'react'

interface SpaceWorkstationExplorerProps {
  initialData: ListSpaceSlots200 | null
  className?: string
}

export function SpaceWorkstationExplorer({
  initialData,
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

  return (
    <div className={cn('flex w-full flex-col gap-6', className)}>
      <DatePickerWithButton
        date={date}
        setDate={setDate}
        className="w-full lg:w-min"
      />
      <Text className="text-muted-foreground mt-4">Em implementação 🚧</Text>
    </div>
  )
}
