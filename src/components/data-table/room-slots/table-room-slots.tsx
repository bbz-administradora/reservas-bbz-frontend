'use client'

import {
  GetRoomSlotAvailability200,
  GetRoomSlotAvailability200SlotsItem,
  UserMe200User,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import {
  getGetRoomSlotAvailabilityKey,
  useGetRoomSlotAvailability,
} from '@/api/endpoints/room-slot/room-slot'
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
import { useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { PreReservationCountdown } from './PreReservationCountdown'
import { RoomSlotsLegend } from './room-slots-legend'
import { SelectedPreReservation } from './SelectedPreReservations'
import { SlotButton } from './slot-button'
import {
  SlotCell,
  TIME_SLOTS,
  prepareSlotTableData,
} from './slotTableDataUtils'

interface DataTableRoomSlotsProps {
  startDate: string
  endDate: string
  className?: string
  user: UserMe200User | null
  roomData: GetRoomSlotAvailability200
  roomId: string
}

export function DataTableRoomSlots({
  startDate,
  endDate,
  className,
  user,
  roomData: initialRoomData,
  roomId,
}: DataTableRoomSlotsProps) {
  // Obter a função mutate do SWR para força revalidação
  const { mutate } = useSWRConfig()

  // Estado para armazenar os dados mesclados (iniciais + atualizações do SWR)
  const [roomData, setRoomData] = useState<any | null>(initialRoomData)

  // Usar o hook SWR para buscar dados atualizados com revalidação a cada 30 segundos
  const { data: liveRoomData, isLoading } = useGetRoomSlotAvailability(
    roomId,
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
    if (liveRoomData?.data) {
      setRoomData(liveRoomData.data)
    }
  }, [liveRoomData])

  // Se não houver dados, garantir que temos 7 dias de slots
  const startDateObj = parseISO(startDate)
  const slotData = roomData?.slots || []

  // Processar os dados em um formato adequado para nossa tabela
  let processedData = prepareSlotTableData(slotData)

  // Se não temos 7 dias de dados, preencher com dias vazios (todos disponíveis)
  if (processedData.length < 7) {
    const existingDates = new Set(processedData.map((row) => row.date))

    // Adicionar dias faltantes até ter 7 dias
    for (let i = 0; i < 7; i++) {
      const currentDate = format(addDays(startDateObj, i), 'yyyy-MM-dd')

      if (!existingDates.has(currentDate)) {
        const emptySlots = TIME_SLOTS.reduce(
          (acc, time) => {
            acc[time] = { status: 'available' }
            return acc
          },
          {} as Record<string, SlotCell>,
        )

        processedData.push({
          date: currentDate,
          slots: emptySlots,
        })
      }
    }

    // Ordenar por data
    processedData.sort((a, b) => a.date.localeCompare(b.date))

    // Limitar a 7 dias
    processedData = processedData.slice(0, 7)
  }

  // Função simplificada para renderizar o componente do cliente
  const renderSlot = (date: string, time: string, cell: SlotCell) => {
    return (
      <SlotButton
        date={date}
        time={time}
        slot={cell}
        user={user}
        roomId={roomId}
        onDataChange={() => {
          // Forçar revalidação dos dados quando houver alteração (cancelamento da pré-reserva)
          const swrKey = getGetRoomSlotAvailabilityKey(roomId, {
            startDate,
            endDate,
          })
          mutate(swrKey)
        }}
      />
    )
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-end lg:flex-row">
        {isLoading && (
          <p className="text-muted-foreground hidden animate-pulse text-left text-xs lg:block lg:flex-1">
            Atualizando...
          </p>
        )}
        <RoomSlotsLegend user={user} />
      </div>
      <div className="mt-4 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              {TIME_SLOTS.map((time) => (
                <TableHead key={time} className="text-center">
                  {time}
                </TableHead>
              ))}
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
                {TIME_SLOTS.map((time) => (
                  <TableCell
                    key={`${dayRow.date}-${time}`}
                    className="text-center"
                  >
                    {renderSlot(dayRow.date, time, dayRow.slots[time])}
                  </TableCell>
                ))}
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
        {roomData?.slots
          .filter(
            (slot: GetRoomSlotAvailability200SlotsItem) =>
              slot.status === 'pre_reserved' &&
              user &&
              slot.user.id === user.id,
          )
          .sort(
            (
              a: GetRoomSlotAvailability200SlotsItem,
              b: GetRoomSlotAvailability200SlotsItem,
            ) => {
              // Ordenar por data/hora de início do slot (mais antigo primeiro)
              return (
                new Date(a.slotStart).getTime() -
                new Date(b.slotStart).getTime()
              )
            },
          )
          .map((slot: GetRoomSlotAvailability200SlotsItem) => (
            <SelectedPreReservation
              key={slot.id}
              slot={slot}
              onDataChange={() => {
                // Forçar revalidação dos dados quando houver alteração (cancelamento da pré-reserva)
                const swrKey = getGetRoomSlotAvailabilityKey(roomId, {
                  startDate,
                  endDate,
                })
                mutate(swrKey)
              }}
            />
          ))}

        {/* Exibir contagem regressiva para o slot que vence primeiro */}
        {roomData?.slots && (
          <PreReservationCountdown slots={roomData.slots} user={user} />
        )}

        {/* Mensagem quando não há pré-reservas */}
        {(!roomData?.slots ||
          roomData.slots.filter(
            (slot: GetRoomSlotAvailability200SlotsItem) =>
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
