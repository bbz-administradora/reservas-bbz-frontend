'use client'

import {
  GetRoomSlotAvailability200,
  UserMe201User,
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
import { cn } from '@/utils/mergeClassNames'
import { addDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRightIcon, ClockAlertIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { RoomSlotsLegend } from './room-slots-legend'
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
  user: UserMe201User | null
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
        <Text variant="title-16-18-700">Horários selecionados:</Text>
        <div className="flex w-full items-center gap-2.5 lg:w-min">
          <ChevronRightIcon size={15} className="text-primary" />
          <Text className="whitespace-nowrap">03/01/2025: </Text>
          <Text className="text-muted-foreground/60 whitespace-nowrap">
            de 10:00 às 11:00
          </Text>

          {/* deletar horário */}
          <div
            className={cn(
              'bg-destructive text-destructive-foreground border-destructive-foreground mr-2 ml-auto cursor-pointer justify-self-end rounded-full border-1 p-0.5 md:mr-0 md:ml-2',
              // (isProcessing ||
              //   loadingUpdateRoom ||
              //   loadingDeleteImage) &&
              //   'cursor-not-allowed opacity-50',
            )}
            // onClick={() => handleRemoveImage(idx)}
          >
            <XIcon size={14} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2.5 md:flex-row lg:mt-2">
          <div className="flex items-center gap-2.5">
            <ClockAlertIcon size={15} className="text-primary" />
            <Text className="text-primary whitespace-nowrap italic">
              Tempo restante para confirmar:
            </Text>
          </div>
          <Text
            variant="title-16-16-700"
            className="text-destructive whitespace-nowrap italic"
          >
            4:30 minutos
          </Text>
        </div>
      </div>
    </div>
  )
}
