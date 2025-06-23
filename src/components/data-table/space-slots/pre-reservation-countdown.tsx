'use client'

import {
  GetSpaceSlotAvailability200SlotsItem,
  UserMe200User,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { Text } from '@/components/Text'
import { differenceInMilliseconds, isBefore, parseISO } from 'date-fns'
import { ClockAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PreReservationCountdownProps {
  slots: GetSpaceSlotAvailability200SlotsItem[]
  user: UserMe200User | null
}

export function PreReservationCountdown({
  slots,
  user,
}: PreReservationCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)

  useEffect(() => {
    // Função para calcular o tempo restante
    const calculateTimeRemaining = () => {
      if (!slots || !user) {
        setTimeRemaining(null)
        return
      }

      // Filtrar slots do usuário atual que estão pré-reservados e com preReservedUntil válido
      const userPreReservedSlots = slots.filter(
        (slot) =>
          slot.status === 'pre_reserved' &&
          slot.user &&
          slot.user.id === user.id &&
          slot.preReservedUntil,
      )

      if (userPreReservedSlots.length === 0) {
        setTimeRemaining(null)
        return
      }

      // Encontrar o slot com menor tempo restante (o que vence primeiro)
      const now = new Date()

      // Filtrar slots que ainda não expiraram
      const validSlots = userPreReservedSlots.filter((slot) => {
        if (!slot.preReservedUntil) return false
        const expirationTime = parseISO(slot.preReservedUntil)
        return !isBefore(expirationTime, now)
      })

      // Se todos os slots expiraram, mostrar mensagem específica
      if (validSlots.length === 0) {
        setTimeRemaining('Expirado! Faça nova pré-reserva')
        return
      }

      // Ordenar slots válidos por data de expiração (mais próxima primeiro)
      const sortedSlots = [...validSlots].sort((a, b) => {
        // Usar parseISO para converter string para Date de forma segura
        const dateA = a.preReservedUntil
          ? parseISO(a.preReservedUntil)
          : new Date(0)
        const dateB = b.preReservedUntil
          ? parseISO(b.preReservedUntil)
          : new Date(0)
        return dateA.getTime() - dateB.getTime()
      })

      // Pegar o primeiro slot válido (o que vence mais rápido)
      const earliestSlot = sortedSlots[0]

      // Usar parseISO para converter a string de data para um objeto Date
      const expirationTime = earliestSlot.preReservedUntil
        ? parseISO(earliestSlot.preReservedUntil)
        : new Date(0)

      // Calcular diferença em milissegundos usando date-fns
      const diffMs = differenceInMilliseconds(expirationTime, now)

      // Converter para minutos e segundos
      const minutes = Math.floor(diffMs / (1000 * 60))
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

      // Formatar como "MM:SS minutos"
      setTimeRemaining(
        `${minutes}:${seconds.toString().padStart(2, '0')} minutos`,
      )
    }

    // Calcular imediatamente
    calculateTimeRemaining()

    // Atualizar a cada segundo
    const intervalId = setInterval(calculateTimeRemaining, 1000)

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(intervalId)
  }, [slots, user])

  // Não renderizar nada se não houver tempo restante para mostrar
  if (!timeRemaining) {
    return null
  }

  return (
    <div className="mt-5 flex flex-col gap-2.5 md:flex-row lg:mt-2">
      <div className="flex items-center gap-2.5">
        <ClockAlertIcon size={15} className="text-primary" />
        <Text className="text-primary whitespace-nowrap italic">
          {timeRemaining === 'Expirado! Faça nova pré-reserva'
            ? 'Tempo expirado:'
            : 'Tempo restante para confirmar:'}
        </Text>
      </div>
      <Text
        variant="title-16-16-700"
        className={`whitespace-nowrap italic ${
          timeRemaining === 'Expirado! Faça nova pré-reserva'
            ? 'text-destructive font-bold'
            : 'text-destructive'
        }`}
      >
        {timeRemaining}
      </Text>
    </div>
  )
}
