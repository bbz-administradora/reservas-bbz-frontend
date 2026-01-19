'use client'

import {
  useListSpaceReservations,
  useReservationCheckInOut,
} from '@/api/endpoints/reservation/reservation'
import { useUserMe } from '@/api/endpoints/user/user'
import { showToast } from '@/components/ShowToast'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { getBrazilianDayRange } from '@/utils/date-time'
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
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { LoadingScreen } from './LoaderLogoSpin'

interface SpaceCheckInOutClientProps {
  spaceId: string
  spaceName: string
}

export function SpaceCheckInOutClient({
  spaceId,
  spaceName,
}: SpaceCheckInOutClientProps) {
  // Buscar dados do usuário logado
  const { data: userData, isLoading: isLoadingUser } = useUserMe()
  const user = userData?.data?.user

  // Estado para controlar qual reserva está processando
  const [processingReservationId, setProcessingReservationId] = useState<
    string | null
  >(null)

  // Hook para realizar check-in/out
  const { trigger: performCheckInOut, isMutating: isPerformingCheckInOut } =
    useReservationCheckInOut(spaceId)

  // Calcular intervalo do dia brasileiro
  const { startDate, endDate } = getBrazilianDayRange()

  // Buscar reservas do dia deste espaço para este usuário
  const {
    data: reservationsData,
    error: reservationsError,
    isLoading: isLoadingReservations,
    mutate: revalidateReservations,
  } = useListSpaceReservations(
    {
      spaceId,
      userId: user?.id,
      includeUserAsGuest: 'true',
      page: '1',
      pageSize: '100',
    },
    {
      swr: {
        enabled: !!user?.id, // Só busca quando tiver userId
      },
    },
  )

  // Filtrar reservas do dia brasileiro no lado do cliente
  const reservations = (reservationsData?.data?.reservations || []).filter(
    (reservation) => {
      const slotStart = new Date(reservation.slotStart)
      const dayStart = new Date(startDate)
      const dayEnd = new Date(endDate)
      return slotStart >= dayStart && slotStart <= dayEnd
    },
  )

  // Console para debug
  useEffect(() => {
    if (reservationsData) {
      console.log('📅 Todas as reservas:', reservationsData)
      console.log('📅 Reservas do dia (filtradas):', reservations)
      console.log('👤 Usuário:', user)
      console.log('🕐 Intervalo:', { startDate, endDate })
    }
  }, [reservationsData, reservations, user, startDate, endDate])

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

      // Sucesso - mostrar toast
      showToast({
        message: result.data.message || 'Operação realizada com sucesso!',
        variant: 'success',
      })

      // Revalidar lista de reservas
      await revalidateReservations()
    } catch (error: any) {
      // Erro - mostrar toast de erro
      const errorMessage =
        error?.message || 'Erro ao realizar operação. Tente novamente.'

      showToast({
        message: errorMessage,
        variant: 'error',
      })

      console.error('Erro ao realizar check-in/out:', error)
    } finally {
      setProcessingReservationId(null)
    }
  }

  function renderErrorFeedback(errorMessage: string) {
    // Mapeia mensagens de erro conhecidas para feedbacks específicos
    if (errorMessage.includes('Não há reservas para hoje neste espaço')) {
      return (
        <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
          <CalendarX className="text-destructive size-16" />
          <Text variant="title-22-32-700" className="text-destructive">
            Nenhuma reserva para hoje
          </Text>
          <Text variant="title-18-24-500">
            Ops! Não encontramos sua reserva ativa
          </Text>
          <Text variant="body-16-18-400">
            Verifique se você tem uma reserva confirmada para hoje neste espaço.
          </Text>
        </div>
      )
    }

    if (errorMessage.includes('Espaço não encontrado')) {
      return (
        <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
          <MapPinOff className="text-destructive size-16" />
          <Text variant="title-22-32-700" className="text-destructive">
            Espaço não localizado
          </Text>
          <Text variant="title-18-24-500">QR Code inválido?</Text>
          <Text variant="body-16-18-400">
            Verifique se o QR Code é válido ou se o espaço ainda está
            disponível.
          </Text>
        </div>
      )
    }

    // Erro genérico para outros casos
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

  // Loading
  const isLoading = isLoadingUser || isLoadingReservations
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Text
          variant={'headline-24-45-700'}
          className="text-primary text-center"
        >{`Sala ${spaceName}`}</Text>
        <LoadingScreen />
      </div>
    )
  }

  // Erro ao buscar reservas
  if (reservationsError) {
    const errorMessage =
      (reservationsError as any)?.message || 'Erro ao buscar reservas'
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Text
          variant={'headline-24-45-700'}
          className="text-primary text-center"
        >{`Sala ${spaceName}`}</Text>
        {renderErrorFeedback(errorMessage)}
      </div>
    )
  }

  // Filtrar reservas ativas (reserved) e finalizadas do dia (closed)
  // Mostra o histórico completo do dia, incluindo as que já foram finalizadas
  const activeReservations = reservations.filter(
    (r) => r.status === 'reserved' || r.status === 'closed',
  )

  // Função para determinar status da reserva baseado em checkInOuts
  function getReservationStatus(reservation: any) {
    if (!user) return 'pending'

    const userCheckIns = reservation.checkInOuts.filter(
      (ci: any) => ci.userId === user.id && ci.type === 'check-in',
    )
    const userCheckOuts = reservation.checkInOuts.filter(
      (ci: any) => ci.userId === user.id && ci.type === 'check-out',
    )

    if (userCheckOuts.length > 0) return 'completed'
    if (userCheckIns.length > 0) return 'checked-in'
    return 'pending'
  }

  // Função para formatar horário
  function formatTimeRange(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${format(startDate, 'HH:mm', { locale: ptBR })} → ${format(endDate, 'HH:mm', { locale: ptBR })}`
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4">
      <Text
        variant={'headline-24-45-700'}
        className="text-primary text-center"
      >{`Sala ${spaceName}`}</Text>

      {activeReservations.length === 0 ? (
        <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
          <CalendarX className="text-destructive size-16" />
          <Text variant="title-22-32-700" className="text-destructive">
            Nenhuma reserva para hoje
          </Text>
          <Text variant="title-18-24-500">
            Ops! Não encontramos sua reserva ativa
          </Text>
          <Text variant="body-16-18-400">
            Verifique se você tem uma reserva confirmada para hoje neste espaço.
          </Text>
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-4">
          <Text variant="body-16-18-400" className="text-center">
            {activeReservations.length} reserva(s) ativa(s)
          </Text>

          {activeReservations.map((reservation) => {
            const status = getReservationStatus(reservation)
            const hasGuests =
              reservation.bbzCollaborators.length > 0 ||
              reservation.externalGuests.length > 0
            const totalGuests =
              reservation.bbzCollaborators.length +
              reservation.externalGuests.length

            return (
              <div
                key={reservation.id}
                className="bg-card border-border rounded-lg border p-6 shadow-sm"
              >
                {/* Horário */}
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="text-primary size-6" />
                  <Text variant="title-22-32-700" className="text-primary">
                    {formatTimeRange(
                      reservation.slotStart,
                      reservation.slotEnd,
                    )}
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

                {/* Informações de Convidados */}
                {hasGuests && (
                  <div className="text-muted-foreground mb-4 flex items-center gap-2">
                    <Users className="size-5" />
                    <Text variant="label-14-16-400">
                      {reservation.bbzCollaborators.length > 0 &&
                        `${reservation.bbzCollaborators.length} BBZ`}
                      {reservation.bbzCollaborators.length > 0 &&
                        reservation.externalGuests.length > 0 &&
                        ' • '}
                      {reservation.externalGuests.length > 0 &&
                        `${reservation.externalGuests.length} externo(s)`}
                    </Text>
                  </div>
                )}

                {/* Info de Check-in/Check-out realizado */}
                {status !== 'pending' && (
                  <div className="bg-muted mb-4 rounded-md p-3">
                    {reservation.checkInOuts
                      .filter((ci: any) => ci.userId === user?.id)
                      .map((ci: any) => (
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
                    onClick={() =>
                      handleCheckInOut(reservation.id, 'check-out')
                    }
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
      )}
    </div>
  )
}
