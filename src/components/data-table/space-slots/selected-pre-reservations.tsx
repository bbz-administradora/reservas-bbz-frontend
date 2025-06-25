'use client'

import { GetSpaceSlotAvailability200SlotsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useDeleteSpaceSlotPreReserve } from '@/api/endpoints/space-slot/space-slot'
import { showToast } from '@/components/ShowToast'
import { Text } from '@/components/Text'
import { cn } from '@/utils/mergeClassNames'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRightIcon, XIcon } from 'lucide-react'
import { useSWRConfig } from 'swr'

interface SelectedPreReservationProps {
  slot: GetSpaceSlotAvailability200SlotsItem
  onDataChange: () => void
}

export function SelectedPreReservation({
  slot,
  onDataChange,
}: SelectedPreReservationProps) {
  const { mutate } = useSWRConfig()

  const { trigger: deletePreReserve, isMutating: isDeleting } =
    useDeleteSpaceSlotPreReserve(slot.id, {
      swr: {
        onSuccess: () => {
          showToast({
            message: 'Pré-reserva deletada com sucesso!',
            variant: 'success',
            duration: 3000,
          })

          if (onDataChange) {
            onDataChange()
          }
        },
        onError: (error) => {
          console.error('💥 Erro ao deletar pré-reserva:', error)

          showToast({
            message: 'Erro ao deletar a pré-reserva. Tente novamente.',
            variant: 'error',
            duration: 3000,
          })
        },
      },
    })

  const slotStartDate = parseISO(slot.slotStart)
  const slotEndDate = parseISO(slot.slotEnd)
  const formattedDate = format(slotStartDate, 'dd/MM/yyyy', { locale: ptBR })
  const startTime = format(slotStartDate, 'HH:mm')
  const endTime = format(slotEndDate, 'HH:mm')

  return (
    <div className="flex w-full items-center gap-2.5 md:w-[320px]">
      <ChevronRightIcon size={15} className="text-primary" />
      <Text className="whitespace-nowrap">{formattedDate}: </Text>
      <Text className="text-muted-foreground/60 whitespace-nowrap">
        de {startTime} às {endTime}
      </Text>
      <div
        className={cn(
          'bg-destructive text-destructive-foreground border-destructive-foreground mr-2 ml-auto hidden cursor-pointer justify-self-end rounded-full border-1 p-0.5 md:mr-0 lg:block',
          isDeleting && 'cursor-not-allowed opacity-50',
        )}
        onClick={() => {
          if (!isDeleting) {
            deletePreReserve()
          }
        }}
      >
        <XIcon size={14} />
      </div>
    </div>
  )
}
