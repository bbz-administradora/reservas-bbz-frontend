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
import { addDays, format, parseISO } from 'date-fns'
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

  // Se não houver dados, garantir que temos 7 dias de slots
  const startDateObj = parseISO(startDate)
  const slotData = spaceData?.slots || []

  // Processar os dados em um formato adequado para nossa tabela
  let processedData = prepareWorkstationSlotTableData(slotData)

  // Se não temos 7 dias de dados, preencher com dias vazios (todos disponíveis)
  if (processedData.length < 7) {
    const existingDates = new Set(processedData.map((row) => row.date))

    // Adicionar dias faltantes até ter 7 dias
    for (let i = 0; i < 7; i++) {
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

    // Limitar a 7 dias
    processedData = processedData.slice(0, 7)
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
      await createSpaceSlotPreReserve({
        spaceId,
        slotStart,
        slotEnd,
      })

      // Atualizar os dados após a criação bem-sucedida
      const swrKey = getGetSpaceSlotAvailabilityKey(spaceId, {
        startDate,
        endDate,
      })
      mutate(swrKey)

      return true
    } catch (error) {
      console.error(`Erro ao criar reserva para ${period}:`, error)
      showToast({
        message: `Erro ao criar reserva para ${period === 'morning' ? 'manhã' : 'tarde'}`,
        variant: 'error',
        duration: 3000,
      })
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

                            // Apenas mostrar mensagem de sucesso se ambas as reservas foram bem-sucedidas
                            if (morningSuccess && afternoonSuccess) {
                              showToast({
                                message:
                                  'Dia inteiro pré-reservado com sucesso!',
                                variant: 'success',
                                duration: 3000,
                              })
                            }
                          }
                        } catch (error) {
                          console.error('Erro ao reservar dia inteiro:', error)
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
