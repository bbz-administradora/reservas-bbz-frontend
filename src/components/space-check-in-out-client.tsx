'use client'

import type { ListCheckInOutReservations200ReservationsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import {
  useListCheckInOutReservations,
  useReservationCheckInOut,
} from '@/api/endpoints/reservation/reservation'
import { showToast } from '@/components/ShowToast'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bug,
  CalendarX,
  CheckCircle,
  Clock,
  LogIn,
  LogOut,
  MapPinOff,
} from 'lucide-react'
import { useState } from 'react'
import { LoadingScreen } from './LoaderLogoSpin'

interface SpaceCheckInOutClientProps {
  spaceId: string
  spaceName: string
}

export function SpaceCheckInOutClient({
  spaceId,
  spaceName,
}: SpaceCheckInOutClientProps) {
  const [processingReservationId, setProcessingReservationId] = useState<
    string | null
  >(null)
  const [checkOutCompleted, setCheckOutCompleted] = useState(false)

  // Hook dedicado: busca reservas do dia do usuário autenticado neste espaço
  // Todos os filtros (userId, data, status) são aplicados no servidor
  const {
    data: listData,
    error: listError,
    isLoading,
    mutate: revalidateList,
  } = useListCheckInOutReservations(spaceId, {
    swr: {
      revalidateOnMount: true,
      dedupingInterval: 0,
    },
  })

  // Hook para realizar check-in/out
  const { trigger: performCheckInOut, isMutating: isPerformingCheckInOut } =
    useReservationCheckInOut(spaceId)

  // Dados vindos do servidor (já filtrados corretamente)
  const reservations = listData?.data?.reservations ?? []
  const serverSpaceName = listData?.data?.spaceName ?? spaceName

  // Handler para check-in/out
  async function handleCheckInOut(
    reservationId: string,
    type: 'check-in' | 'check-out',
  ) {
    try {
      setProcessingReservationId(reservationId)

      const result = await performCheckInOut({
        reservationId,
        type,
      })

      showToast({
        message: result.data.message || 'Operação realizada com sucesso!',
        variant: 'success',
      })

      if (type === 'check-out') {
        setCheckOutCompleted(true)
      }

      await revalidateList()
    } catch (error: any) {
      const errorMessage =
        error?.message || 'Erro ao realizar operação. Tente novamente.'

      showToast({
        message: errorMessage,
        variant: 'error',
      })
    } finally {
      setProcessingReservationId(null)
    }
  }

  function getReservationStatus(
    reservation: ListCheckInOutReservations200ReservationsItem,
  ) {
    const hasCheckIn = reservation.checkInOuts.some(
      (ci) => ci.type === 'check-in',
    )
    const hasCheckOut = reservation.checkInOuts.some(
      (ci) => ci.type === 'check-out',
    )

    if (hasCheckOut) return 'completed'
    if (hasCheckIn) return 'checked-in'
    return 'pending'
  }

  function formatTimeRange(start: string, end: string) {
    return `${format(new Date(start), 'HH:mm', { locale: ptBR })} → ${format(new Date(end), 'HH:mm', { locale: ptBR })}`
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Text
          variant={'headline-24-45-700'}
          className="text-primary text-center"
        >
          {serverSpaceName}
        </Text>
        <LoadingScreen />
      </div>
    )
  }

  // Erro
  if (listError) {
    const errorMessage =
      (listError as any)?.message || 'Erro ao buscar reservas'

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Text
          variant={'headline-24-45-700'}
          className="text-primary text-center"
        >
          {serverSpaceName}
        </Text>
        {renderErrorFeedback(errorMessage)}
      </div>
    )
  }

  // Sem reservas
  if (reservations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Text
          variant={'headline-24-45-700'}
          className="text-primary text-center"
        >
          {serverSpaceName}
        </Text>
        {checkOutCompleted ? (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <CheckCircle className="size-16 text-green-600" />
            <Text variant="title-22-32-700" className="text-green-600">
              Check-out realizado!
            </Text>
            <Text variant="title-18-24-500">
              Obrigado por usar nosso espaço
            </Text>
            <Text variant="body-16-18-400">
              Sua jornada foi registrada com sucesso. Tenha um ótimo dia!
            </Text>
          </div>
        ) : (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <CalendarX className="text-destructive size-16" />
            <Text variant="title-22-32-700" className="text-destructive">
              Nenhuma reserva para hoje
            </Text>
            <Text variant="title-18-24-500">
              Ops! Não encontramos sua reserva ativa
            </Text>
            <Text variant="body-16-18-400">
              Verifique se você tem uma reserva confirmada para hoje neste
              espaço.
            </Text>
          </div>
        )}
      </div>
    )
  }

  // Lista de reservas
  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4">
      <Text variant={'headline-24-45-700'} className="text-primary text-center">
        {serverSpaceName}
      </Text>

      <div className="w-full max-w-2xl space-y-4">
        <Text variant="body-16-18-400" className="text-center">
          {reservations.length} reserva(s) ativa(s)
        </Text>

        {reservations.map((reservation) => {
          const status = getReservationStatus(reservation)

          return (
            <div
              key={reservation.id}
              className="bg-card border-border rounded-lg border p-6 shadow-sm"
            >
              {/* Horário */}
              <div className="mb-4 flex items-center gap-2">
                <Clock className="text-primary size-6" />
                <Text variant="title-22-32-700" className="text-primary">
                  {formatTimeRange(reservation.slotStart, reservation.slotEnd)}
                </Text>
              </div>

              {/* Badge de Status */}
              <div className="mb-4">
                {status === 'pending' && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">
                    <Clock className="size-4" />
                    <Text variant="label-14-16-400">Pendente</Text>
                  </div>
                )}
                {status === 'checked-in' && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-green-800">
                    <CheckCircle className="size-4" />
                    <Text variant="label-14-16-400">Check-in realizado</Text>
                  </div>
                )}
                {status === 'completed' && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-800">
                    <CheckCircle className="size-4" />
                    <Text variant="label-14-16-400">Finalizado</Text>
                  </div>
                )}
              </div>

              {/* Info de Check-in/Check-out realizado */}
              {status !== 'pending' && (
                <div className="bg-muted mb-4 rounded-md p-3">
                  {reservation.checkInOuts.map((ci) => (
                    <div
                      key={ci.id}
                      className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                      {ci.type === 'check-in' ? (
                        <LogIn className="size-4" />
                      ) : (
                        <LogOut className="size-4" />
                      )}
                      <Text variant="label-14-14-400">
                        {ci.type === 'check-in' ? 'Check-in' : 'Check-out'}{' '}
                        realizado às{' '}
                        {format(new Date(ci.createdAt), 'HH:mm', {
                          locale: ptBR,
                        })}
                      </Text>
                    </div>
                  ))}
                </div>
              )}

              {/* Botões de Check-in / Check-out */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  disabled={
                    status !== 'pending' ||
                    isPerformingCheckInOut ||
                    processingReservationId === reservation.id
                  }
                  variant={status === 'pending' ? 'default' : 'secondary'}
                  className="flex-1"
                  onClick={() => handleCheckInOut(reservation.id, 'check-in')}
                >
                  <LogIn className="mr-2 size-5" />
                  {processingReservationId === reservation.id &&
                  isPerformingCheckInOut
                    ? 'Processando...'
                    : 'Fazer Check-in'}
                </Button>
                <Button
                  disabled={
                    status !== 'checked-in' ||
                    isPerformingCheckInOut ||
                    processingReservationId === reservation.id
                  }
                  variant={status === 'checked-in' ? 'default' : 'secondary'}
                  className="flex-1"
                  onClick={() => handleCheckInOut(reservation.id, 'check-out')}
                >
                  <LogOut className="mr-2 size-5" />
                  {processingReservationId === reservation.id &&
                  isPerformingCheckInOut
                    ? 'Processando...'
                    : 'Fazer Check-out'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderErrorFeedback(errorMessage: string) {
  if (errorMessage.includes('Espaço não encontrado')) {
    return (
      <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
        <MapPinOff className="text-destructive size-16" />
        <Text variant="title-22-32-700" className="text-destructive">
          Espaço não localizado
        </Text>
        <Text variant="title-18-24-500">QR Code inválido?</Text>
        <Text variant="body-16-18-400">
          Verifique se o QR Code é válido ou se o espaço ainda está disponível.
        </Text>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
      <Bug className="text-destructive size-16" />
      <Text variant="title-22-32-700" className="text-destructive">
        Ops! Algo deu errado
      </Text>
      <Text variant="title-18-24-500">{errorMessage}</Text>
      <Text variant="body-16-18-400">
        Tente novamente ou entre em contato com o suporte se o problema
        persistir.
      </Text>
    </div>
  )
}
