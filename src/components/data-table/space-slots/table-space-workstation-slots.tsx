'use client'

import {
  GetSpaceSlotAvailability200,
  GetSpaceSlotAvailability200SlotsItem,
  UserMe200User,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import {
  createSpaceSlotPreReserve,
  getGetSpaceSlotAvailabilityKey,
  useGetSpaceSlotAvailability,
} from '@/api/endpoints/space-slot/space-slot'
import { showToast } from '@/components/ShowToast'
import { Text } from '@/components/Text'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getNextWeekLastDay } from '@/utils/date-time'
import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { PreReservationCountdown } from './pre-reservation-countdown'
import { SelectedPreReservation } from './selected-pre-reservations'
import { SlotButton } from './slot-button'
import {
  SlotCell,
  prepareWorkstationSlotTableData,
} from './slot-table-data-utils'
import { SpaceSlotsLegend } from './space-slots-legend'

interface DataTableSpaceWorkstationSlotsProps {
  startDate: string
  endDate: string
  className?: string
  user: UserMe200User | null
  spaceData: GetSpaceSlotAvailability200
  spaceId: string
}

export function DataTableSpaceWorkstationSlots({
  startDate,
  endDate,
  className,
  user,
  spaceData: initialSpaceData,
  spaceId,
}: DataTableSpaceWorkstationSlotsProps) {
  // Obter a função mutate do SWR para força revalidação
  const { mutate } = useSWRConfig()

  // Estado para armazenar os dados mesclados (iniciais + atualizações do SWR)
  const [spaceData, setSpaceData] = useState<any | null>(initialSpaceData)

  // Usar o hook SWR para buscar dados atualizados com revalidação a cada 30 segundos
  const { data: liveSpaceData, isLoading } = useGetSpaceSlotAvailability(
    spaceId,
    { startDate, endDate },
    {
      swr: {
        refreshInterval: 30000, // Revalidação automática a cada 30 segundos
        revalidateOnFocus: false, // Não revalidar ao focar na janela
        dedupingInterval: 5000, // Evitar requisições duplicadas em intervalos curtos
      },
    },
  )

  // Efeito para atualizar os dados quando o SWR retornar novos dados
  useEffect(() => {
    if (liveSpaceData?.data) {
      setSpaceData(liveSpaceData.data)
    }
  }, [liveSpaceData])

  // Se não houver dados, garantir que temos todos os dias até o sábado da próxima semana
  const startDateObj = parseISO(startDate)
  const endDateObj = parseISO(endDate)
  const slotData = spaceData?.slots || []

  // Calcular quantos dias devemos mostrar (de hoje até o sábado da próxima semana)
  const maxDate = getNextWeekLastDay()
  const daysToShow = differenceInDays(maxDate, startDateObj) + 1 // +1 para incluir o último dia

  // Processar os dados em um formato adequado para nossa tabela
  let processedData = prepareWorkstationSlotTableData(slotData)

  // Se não temos todos os dias, preencher com dias vazios (todos disponíveis)
  if (processedData.length < daysToShow) {
    const existingDates = new Set(processedData.map((row) => row.date))

    // Adicionar dias faltantes até o sábado da próxima semana
    for (let i = 0; i < daysToShow; i++) {
      const currentDate = format(addDays(startDateObj, i), 'yyyy-MM-dd')

      if (!existingDates.has(currentDate)) {
        processedData.push({
          date: currentDate,
          slots: {
            morning: { status: 'available' },
            afternoon: { status: 'available' },
          },
        })
      }
    }

    // Ordenar por data
    processedData.sort((a, b) => a.date.localeCompare(b.date))

    // Limitar aos dias calculados
    processedData = processedData.slice(0, daysToShow)
  }

  // Função simplificada para renderizar o componente do cliente e criar pré-reserva
  const renderSlot = (
    date: string,
    period: 'morning' | 'afternoon',
    cell: SlotCell,
  ) => {
    // Para workstation, time deve ser o horário real do início do período
    const time = period === 'morning' ? '07:00' : '13:00'

    return (
      <SlotButton
        date={date}
        time={time}
        slot={cell}
        user={user}
        spaceId={spaceId}
        slotDurationHours={5}
        onDataChange={() => {
          // Forçar revalidação dos dados quando houver alteração (cancelamento da pré-reserva)
          const swrKey = getGetSpaceSlotAvailabilityKey(spaceId, {
            startDate,
            endDate,
          })
          mutate(swrKey)
        }}
      />
    )
  }

  // Função que cria reserva para um período específico
  const createReservation = async (
    date: string,
    period: 'morning' | 'afternoon',
  ) => {
    if (!spaceId || !user) {
      if (!user) {
        window.location.href = '/login'
      }
      return
    }

    const time = period === 'morning' ? '07:00' : '13:00'
    const slotStart = `${date}T${time}:00-03:00`

    // Calcular o horário de término (5 horas depois)
    const startDateTime = parseISO(slotStart)
    const endDateTime = new Date(startDateTime)
    endDateTime.setHours(endDateTime.getHours() + 5)

    const slotEnd = format(endDateTime, `yyyy-MM-dd'T'HH:mm:ss-03:00`)

    try {
      const response = await createSpaceSlotPreReserve({
        spaceId,
        slotStart,
        slotEnd,
      })

      // Verificar o status da resposta
      if (response.status === 201) {
        // Sucesso na criação
        const swrKey = getGetSpaceSlotAvailabilityKey(spaceId, {
          startDate,
          endDate,
        })
        mutate(swrKey)
        return true
      } else if (response.status === 400) {
        // Tratamento específico para cada tipo de erro de validação
        const errorData = response.data as any
        const errorMessage = errorData?.message || ''
        const errorAction = errorData?.action || ''

        // Log para debug (remover depois)
        console.log('Erro 400:', { errorMessage, errorAction, errorData })

        // Erro: Tentando reservar para a semana atual
        if (
          errorMessage.includes(
            'Não é possível reservar estações de trabalho na semana atual',
          )
        ) {
          showToast({
            message:
              'Não é possível reservar para a semana atual. Você só pode agendar para a próxima semana em diante. Faça suas reservas de segunda a quinta-feira.',
            variant: 'warning',
            duration: 6000,
          })
        }
        // Erro: Tentando fazer reserva em um dia bloqueado (sexta-feira)
        else if (
          errorMessage.includes(
            'Não é permitido realizar reservas de estações de trabalho',
          ) &&
          errorMessage.includes('sexta-feira')
        ) {
          showToast({
            message:
              'Hoje (sexta-feira) não é permitido fazer reservas. As reservas devem ser feitas de segunda a quinta-feira para a semana seguinte.',
            variant: 'warning',
            duration: 6000,
          })
        }
        // Erro: Tentando reservar além do sábado da próxima semana
        else if (
          errorMessage.includes(
            'Não é possível reservar estações de trabalho além do sábado da próxima semana',
          )
        ) {
          const message = errorAction
            ? `Data limite ultrapassada. ${errorAction}`
            : 'Data limite ultrapassada. Você pode reservar no máximo até o sábado da próxima semana.'
          showToast({
            message,
            variant: 'warning',
            duration: 6000,
          })
        }
        // Erro: Horário já passou
        else if (
          errorMessage.includes(
            'Não é possível pré-reservar para horários que já começaram',
          ) ||
          errorMessage.includes('horários que já passaram')
        ) {
          showToast({
            message:
              'Horário indisponível. Não é possível reservar horários que já passaram.',
            variant: 'warning',
            duration: 5000,
          })
        }
        // Erro: Horário passou há mais de 30 minutos
        else if (
          errorMessage.includes(
            'Não é possível reservar horários que já passaram mais de 30 minutos',
          )
        ) {
          showToast({
            message:
              'Horário expirado. Você pode reservar até 30 minutos após o início do horário.',
            variant: 'warning',
            duration: 5000,
          })
        }
        // Erro genérico de 400 - usar a mensagem do servidor
        else {
          // Sempre priorizar a mensagem do servidor
          const message = errorMessage || 'Não foi possível criar a reserva'
          const fullMessage = errorAction
            ? `${message}. ${errorAction}`
            : message

          showToast({
            message: fullMessage,
            variant: 'warning',
            duration: 6000,
          })
        }
      } else if (response.status === 409) {
        showToast({
          message:
            'Horário não disponível. Este horário já está reservado ou pré-reservado.',
          variant: 'warning',
          duration: 4000,
        })
      } else {
        // Erro desconhecido - log para debug
        console.log('Erro desconhecido:', {
          status: response.status,
          data: response.data,
        })

        // Tentar extrair mensagem de erro de qualquer resposta
        const errorData = response.data as any
        const errorMessage = errorData?.message || errorData?.error || ''

        showToast({
          message:
            errorMessage ||
            `Erro ao criar reserva para ${period === 'morning' ? 'manhã' : 'tarde'}. Por favor, tente novamente.`,
          variant: 'error',
          duration: 4000,
        })
      }
      return false
    } catch (error: any) {
      console.error(`Erro ao criar reserva para ${period}:`, error)

      // Verificar se é um CustomError do backend (BadRequestError, etc.)
      if (error.name === 'CustomError' || error.name === 'BadRequestError') {
        const errorMessage = error.message || ''
        const errorDetails = error.details || {}
        const errorAction = errorDetails.action || ''

        // Log para debug
        console.log('CustomError capturado:', { errorMessage, errorDetails })

        // Erro: Tentando reservar para a semana atual
        if (
          errorMessage.includes(
            'Não é possível reservar estações de trabalho na semana atual',
          )
        ) {
          showToast({
            message:
              'Não é possível reservar para a semana atual. Você só pode agendar para a próxima semana em diante. Faça suas reservas de segunda a quinta-feira.',
            variant: 'warning',
            duration: 6000,
          })
        }
        // Erro: Tentando fazer reserva em um dia bloqueado (sexta-feira)
        else if (
          errorMessage.includes(
            'Não é permitido realizar reservas de estações de trabalho',
          ) &&
          errorMessage.includes('sexta-feira')
        ) {
          showToast({
            message:
              'Hoje (sexta-feira) não é permitido fazer reservas. As reservas devem ser feitas de segunda a quinta-feira para a semana seguinte.',
            variant: 'warning',
            duration: 6000,
          })
        }
        // Erro: Tentando reservar além do sábado da próxima semana
        else if (
          errorMessage.includes(
            'Não é possível reservar estações de trabalho além do sábado da próxima semana',
          )
        ) {
          const message = errorAction
            ? `Data limite ultrapassada. ${errorAction}`
            : 'Data limite ultrapassada. Você pode reservar no máximo até o sábado da próxima semana.'
          showToast({
            message,
            variant: 'warning',
            duration: 6000,
          })
        }
        // Erro: Horário já passou
        else if (
          errorMessage.includes(
            'Não é possível pré-reservar para horários que já começaram',
          ) ||
          errorMessage.includes('horários que já passaram')
        ) {
          showToast({
            message:
              'Horário indisponível. Não é possível reservar horários que já passaram.',
            variant: 'warning',
            duration: 5000,
          })
        }
        // Erro: Horário passou há mais de 30 minutos
        else if (
          errorMessage.includes(
            'Não é possível reservar horários que já passaram mais de 30 minutos',
          )
        ) {
          showToast({
            message:
              'Horário expirado. Você pode reservar até 30 minutos após o início do horário.',
            variant: 'warning',
            duration: 5000,
          })
        }
        // Erro: Horário não disponível (409)
        else if (
          errorMessage.includes('já está reservado') ||
          errorMessage.includes('já está pré-reservado')
        ) {
          showToast({
            message:
              'Horário não disponível. Este horário já está reservado ou pré-reservado.',
            variant: 'warning',
            duration: 4000,
          })
        }
        // Erro genérico - usar a mensagem do servidor
        else {
          const message = errorMessage || 'Não foi possível criar a reserva'
          const fullMessage = errorAction
            ? `${message}. ${errorAction}`
            : message

          showToast({
            message: fullMessage,
            variant: 'warning',
            duration: 6000,
          })
        }
      }
      // Verificar se é erro de rede
      else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showToast({
          message: 'Erro de conexão. Verifique sua internet e tente novamente.',
          variant: 'error',
          duration: 5000,
        })
      }
      // Erro genérico desconhecido
      else {
        showToast({
          message: `Erro inesperado ao criar reserva para ${period === 'morning' ? 'manhã' : 'tarde'}. Por favor, tente novamente.`,
          variant: 'error',
          duration: 4000,
        })
      }
      return false
    }
  }
  // TODO: temos que preparar a api de pre reserva de slots para receber tempo maior que 1 hora "O horário de término
  // deve ser exatamente 1 hora após o início"
  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-start gap-5 lg:flex-row">
        <SpaceSlotsLegend user={user} className="lg:justify-start" />
        {isLoading && (
          <p className="text-muted-foreground hidden animate-pulse text-left text-xs lg:block lg:flex-1">
            Atualizando...
          </p>
        )}
      </div>
      <div className="mt-4 rounded-md border lg:max-w-[631px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead className="text-center">Manhã</TableHead>
              <TableHead className="text-center">Tarde</TableHead>
              <TableHead className="text-center">Dia Inteiro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((dayRow) => (
              <TableRow key={dayRow.date}>
                <TableCell>
                  {format(parseISO(dayRow.date), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-center">
                  {renderSlot(dayRow.date, 'morning', dayRow.slots.morning)}
                </TableCell>
                <TableCell className="text-center">
                  {renderSlot(dayRow.date, 'afternoon', dayRow.slots.afternoon)}
                </TableCell>
                <TableCell className="text-center">
                  <button
                    className={`rounded-full p-2 ${
                      dayRow.slots.morning.status === 'available' &&
                      dayRow.slots.afternoon.status === 'available'
                        ? 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
                        : 'cursor-not-allowed bg-gray-300 text-gray-500'
                    }`}
                    disabled={
                      !(
                        dayRow.slots.morning.status === 'available' &&
                        dayRow.slots.afternoon.status === 'available'
                      )
                    }
                    onClick={async () => {
                      if (
                        dayRow.slots.morning.status === 'available' &&
                        dayRow.slots.afternoon.status === 'available'
                      ) {
                        try {
                          // Criar reserva para manhã e tarde em sequência
                          const morningSuccess = await createReservation(
                            dayRow.date,
                            'morning',
                          )

                          if (morningSuccess) {
                            const afternoonSuccess = await createReservation(
                              dayRow.date,
                              'afternoon',
                            )

                            // Mostrar mensagem apropriada conforme o resultado
                            if (afternoonSuccess) {
                              showToast({
                                message:
                                  'Dia inteiro pré-reservado com sucesso!',
                                variant: 'success',
                                duration: 4000,
                              })
                            } else {
                              // Apenas a tarde falhou (manhã foi criada)
                              showToast({
                                message:
                                  'Apenas o período da manhã foi reservado. Não foi possível reservar a tarde.',
                                variant: 'warning',
                                duration: 5000,
                              })
                            }
                          }
                          // Se morningSuccess for false, a mensagem de erro já foi mostrada pelo createReservation
                        } catch (error) {
                          console.error('Erro ao reservar dia inteiro:', error)
                          showToast({
                            message:
                              'Erro inesperado ao reservar dia inteiro. Tente novamente.',
                            variant: 'error',
                            duration: 4000,
                          })
                        }
                      }
                    }}
                    title="Selecionar Dia Inteiro"
                  >
                    <CalendarIcon className="size-5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {isLoading && (
        <p className="text-muted-foreground mt-5 w-full animate-pulse text-center text-xs lg:hidden">
          Atualizando...
        </p>
      )}

      {/* Horários selecionados de pré-reserva */}
      <div className="mt-10 flex flex-col gap-2">
        <Text variant="title-16-18-700" className="mb-2">
          Horários selecionados:
        </Text>

        {/* Exibir pré-reservas do usuário atual - ordenadas por data/hora do slot (mais antigo primeiro) */}
        {spaceData?.slots
          .filter(
            (slot: GetSpaceSlotAvailability200SlotsItem) =>
              slot.status === 'pre_reserved' &&
              user &&
              slot.user.id === user.id,
          )
          .sort(
            (
              a: GetSpaceSlotAvailability200SlotsItem,
              b: GetSpaceSlotAvailability200SlotsItem,
            ) => {
              // Ordenar por data/hora de início do slot (mais antigo primeiro)
              return (
                new Date(a.slotStart).getTime() -
                new Date(b.slotStart).getTime()
              )
            },
          )
          .map((slot: GetSpaceSlotAvailability200SlotsItem) => (
            <SelectedPreReservation
              key={slot.id}
              slot={slot}
              onDataChange={() => {
                // Forçar revalidação dos dados quando houver alteração (cancelamento da pré-reserva)
                const swrKey = getGetSpaceSlotAvailabilityKey(spaceId, {
                  startDate,
                  endDate,
                })
                mutate(swrKey)
              }}
            />
          ))}

        {/* Exibir contagem regressiva para o slot que vence primeiro */}
        {spaceData?.slots && (
          <PreReservationCountdown slots={spaceData.slots} user={user} />
        )}

        {/* Mensagem quando não há pré-reservas */}
        {(!spaceData?.slots ||
          spaceData.slots.filter(
            (slot: GetSpaceSlotAvailability200SlotsItem) =>
              slot.status === 'pre_reserved' &&
              user &&
              slot.user.id === user.id,
          ).length === 0) && (
          <Text className="text-muted-foreground italic">
            Nenhuma pré-reserva encontrada
          </Text>
        )}
      </div>
    </div>
  )
}
