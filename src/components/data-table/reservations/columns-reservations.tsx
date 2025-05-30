'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import {
  ListRoomReservations200ReservationsItem,
  ListRoomReservations200ReservationsItemStatus,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useCloseRoomReservation } from '@/api/endpoints/reservation/reservation'
import { useOpenDoor } from '@/api/endpoints/room/room'
import { DoorCodeDialog } from '@/components/DoorCodeDialog'
import { showToast } from '@/components/ShowToast'
import { cn } from '@/utils/mergeClassNames'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LockOpenIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { DataTableColumnHeader } from '../data-table-column-header'

export const reservationsTitlesColumns = {
  name: 'Sala',
  dateTime: 'Data e horário',
  status: 'Status',
  createdBy: 'Criado por',
  bbzCollaborators: 'Convidados Internos',
  externalGuests: 'Convidados externos',
  needsCopeira: 'Copeira?',
  createdAt: 'Criado em',
  closedAt: 'Encerrada em',
  cancelledBy: 'Cancelado por',
  cancelReason: 'Obs. cancelamento',
  cancelledAt: 'Cancelado em',
}

// Função para formatar o intervalo de tempo
const formatTimeRange = (slotStart: string, slotEnd: string) => {
  if (!slotStart || !slotEnd) return 'N/A'

  try {
    const startDate = new Date(slotStart)
    const endDate = new Date(slotEnd)

    const dateFormatted = format(startDate, 'dd/MM/yyyy', { locale: ptBR })
    const startTime = format(startDate, 'HH:mm')
    const endTime = format(endDate, 'HH:mm')

    // Return date on top line, time on bottom line
    return {
      date: dateFormatted,
      time: `${startTime} às ${endTime}`,
    }
  } catch (error) {
    console.error('Error formatting date range:', error)
    return { date: 'Data inválida', time: '' }
  }
}

// Função para verificar se o horário já passou
const isReservationPast = (slotEnd: string) => {
  if (!slotEnd) return false

  try {
    const endDate = new Date(slotEnd)
    return endDate < new Date()
  } catch {
    return false
  }
}

// Função para determinar o status de exibição
const getStatusDisplay = (
  status: ListRoomReservations200ReservationsItemStatus,
  slotEnd: string,
) => {
  if (status === 'reserved' && isReservationPast(slotEnd)) {
    return {
      text: 'Realizado',
      color: 'text-foreground',
      dotColor: 'bg-green-500',
    }
  }

  switch (status) {
    case 'reserved':
      return {
        text: 'Ativo',
        color: 'text-foreground',
        dotColor: 'bg-yellow-500',
      }
    case 'cancelled':
      return {
        text: 'Cancelado',
        color: 'text-foreground',
        dotColor: 'bg-red-500',
      }
    case 'closed':
      return {
        text: 'Encerrada',
        color: 'text-foreground',
        dotColor: 'bg-red-500',
      }
    default:
      return {
        text: 'Desconhecido',
        color: 'text-gray-500',
        dotColor: 'bg-gray-400',
      }
  }
}

// Formatar lista de emails
const formatEmailList = (emails: string[] | undefined) => {
  if (!emails || emails.length === 0) return 'Nenhum'
  return emails.join(', ')
}

export const columnsReservations: ColumnDef<ListRoomReservations200ReservationsItem>[] =
  [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.name}
        />
      ),
      cell: ({ row }) => (
        <span className="break-words whitespace-normal">
          {transformTextIntoCapitalizedWords(row.original.room.name || 'N/A')}
        </span>
      ),
      // Custom filter function to handle the nested room.name property
      filterFn: (row, id, value) => {
        const roomName = row.original.room.name || ''
        return roomName.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      accessorKey: 'dateTime',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.dateTime}
        />
      ),
      cell: ({ row }) => {
        if (!row.original.slotStart || !row.original.slotEnd)
          return <span>-</span>
        const timeRange = formatTimeRange(
          row.original.slotStart,
          row.original.slotEnd,
        )
        if (typeof timeRange === 'string') {
          return <span className="whitespace-nowrap">{timeRange}</span>
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium">{timeRange.date}</span>
            <span className="text-sm text-gray-600">{timeRange.time}</span>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.slotStart || ''
        const dateB = rowB.original.slotStart || ''
        return new Date(dateA).getTime() - new Date(dateB).getTime()
      },
      filterFn: (row, id, value) => {
        if (!value || !(value instanceof Date)) return true
        if (!row.original.slotStart) return false

        try {
          const reservationDate = new Date(row.original.slotStart)
          // Comparar apenas a data (dia, mês e ano), ignorando o horário
          return (
            reservationDate.getFullYear() === value.getFullYear() &&
            reservationDate.getMonth() === value.getMonth() &&
            reservationDate.getDate() === value.getDate()
          )
        } catch (error) {
          console.error('Error filtering by date:', error)
          return false
        }
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.status}
        />
      ),
      cell: ({ row }) => {
        const status = getStatusDisplay(
          row.original.status,
          row.original.slotEnd || '',
        )
        return (
          <div className="flex items-center gap-2">
            <div className={cn('h-2.5 w-2.5 rounded-full', status.dotColor)} />
            <span className={cn(status.color)}>{status.text}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        if (value.includes('realized')) {
          const isRealized =
            row.original.status === 'reserved' &&
            isReservationPast(row.original.slotEnd || '')
          if (isRealized) return true
          if (value.length === 1) return false
        }
        return value.includes(row.original.status)
      },
    },
    {
      accessorKey: 'createdBy',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.createdBy}
        />
      ),
      cell: ({ row }) => (
        <span className="break-words whitespace-normal">
          {transformTextIntoCapitalizedWords(row.original.user.name || 'N/A')}
        </span>
      ),
    },
    {
      accessorKey: 'bbzCollaborators',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.bbzCollaborators}
        />
      ),
      cell: ({ row }) => (
        <span className="break-words whitespace-normal">
          {formatEmailList(row.original.bbzCollaborators)}
        </span>
      ),
    },
    {
      accessorKey: 'externalGuests',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.externalGuests}
        />
      ),
      cell: ({ row }) => (
        <span className="break-words whitespace-normal">
          {formatEmailList(row.original.externalGuests)}
        </span>
      ),
    },
    {
      accessorKey: 'needsCopeira',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.needsCopeira}
        />
      ),
      cell: ({ row }) => (
        <span>{row.original.needsCopeira ? 'Sim' : 'Não'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.createdAt}
        />
      ),
      cell: ({ row }) => {
        const date = row.original.createdAt || ''
        try {
          const formattedDate = format(new Date(date), 'dd/MM/yyyy', {
            locale: ptBR,
          })
          return <span>{formattedDate}</span>
        } catch {
          return <span>Data inválida</span>
        }
      },
      sortingFn: (rowA, rowB) => {
        return (
          new Date(rowA.original.createdAt).getTime() -
          new Date(rowB.original.createdAt).getTime()
        )
      },
    },
    {
      accessorKey: 'closedAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.closedAt}
        />
      ),
      cell: ({ row }) => {
        const date = row.original.closedAt
        if (!date) return <span>-</span>

        try {
          const formattedDate = format(new Date(date), 'dd/MM/yyyy', {
            locale: ptBR,
          })
          return <span>{formattedDate}</span>
        } catch {
          return <span>Data inválida</span>
        }
      },
    },
    {
      accessorKey: 'cancelledBy',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.cancelledBy}
        />
      ),
      cell: ({ row }) => {
        if (!row.original.cancelledBy) return <span>-</span>
        return (
          <span className="break-words whitespace-normal">
            {transformTextIntoCapitalizedWords(
              row.original.cancelledBy.name || 'N/A',
            )}
          </span>
        )
      },
    },
    {
      accessorKey: 'cancelReason',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.cancelReason}
        />
      ),
      cell: ({ row }) => {
        if (!row.original.cancelReason) return <span>-</span>
        return (
          <span className="line-clamp-6 w-[300px] break-words whitespace-normal lg:line-clamp-none">
            {row.original.cancelReason}
          </span>
        )
      },
    },
    {
      accessorKey: 'cancelledAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={reservationsTitlesColumns.cancelledAt}
        />
      ),
      cell: ({ row }) => {
        const date = row.original.cancelledAt
        if (!date) return <span>-</span>

        try {
          const formattedDate = format(new Date(date), 'dd/MM/yyyy', {
            locale: ptBR,
          })
          return <span>{formattedDate}</span>
        } catch {
          return <span>Data inválida</span>
        }
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const reservationId = row.original.id
        const status = row.original.status
        const isPast = isReservationPast(row.original.slotEnd || '')
        const roomName = row.original.room.name || 'Sala'

        // Estado para controlar o diálogo do código de abertura
        const [isDoorCodeDialogOpen, setIsDoorCodeDialogOpen] = useState(false)
        const [doorCodeInfo, setDoorCodeInfo] = useState<{
          doorCode?: string
          expiresAt?: string
          isLoading: boolean
        }>({
          doorCode: undefined,
          expiresAt: undefined,
          isLoading: false,
        })

        // Hook para gerar código de abertura da porta
        const { trigger: generateDoorCode, isMutating: isGeneratingCode } =
          useOpenDoor(
            { roomName },
            {
              swr: {
                onSuccess: (response) => {
                  if (response?.status === 200 && response?.data?.doorCode) {
                    // Atualizar os dados do código e manter o diálogo aberto
                    setDoorCodeInfo({
                      doorCode: response.data.doorCode,
                      expiresAt: response.data.expiresAt,
                      isLoading: false,
                    })
                  } else {
                    // Esconder o diálogo e mostrar toast de erro
                    setIsDoorCodeDialogOpen(false)
                    setDoorCodeInfo({
                      doorCode: undefined,
                      expiresAt: undefined,
                      isLoading: false,
                    })
                    showToast({
                      message:
                        'Não foi possível gerar o código de abertura. Tente novamente.',
                      duration: 5000,
                      variant: 'error',
                    })
                  }
                },
                onError: (error) => {
                  // Esconder o diálogo e mostrar toast de erro
                  setIsDoorCodeDialogOpen(false)
                  setDoorCodeInfo({
                    doorCode: undefined,
                    expiresAt: undefined,
                    isLoading: false,
                  })
                  console.error('💥 Erro ao gerar código de abertura:', error)
                  showToast({
                    message:
                      'Erro ao gerar código de abertura. Tente novamente.',
                    duration: 5000,
                    variant: 'error',
                  })
                },
              },
            },
          )

        const handleWarningOpenDoor = () => {
          showToast({
            message:
              'Você pode gerar um código de abertura para esta sala baseado na sua reserva.',
            duration: Infinity,
            variant: 'warning',
            firstButton: {
              text: 'Cancelar',
              variant: 'ghost',
              onClick: () => ({}),
            },
            secondButton: {
              text: 'Gerar Código',
              variant: 'default',
              onClick: () => {
                // Mostrar diálogo imediatamente com estado de loading
                setDoorCodeInfo({
                  doorCode: undefined,
                  expiresAt: undefined,
                  isLoading: true,
                })
                setIsDoorCodeDialogOpen(true)

                generateDoorCode()
              },
            },
          })
        }

        const { isMutating, trigger: closeReservation } =
          useCloseRoomReservation({
            swr: {
              onSuccess: (response) => {
                switch (response.status) {
                  case 200: {
                    showToast({
                      message: 'Reserva encerrada com sucesso.',
                      duration: 5000,
                      variant: 'success',
                    })

                    revalidateTags(['close-reservation'])
                    break
                  }
                  default: {
                    showToast({
                      message:
                        'Ops... Falha ao encerrar reserva, tente novamente.',
                      duration: 5000,
                      variant: 'error',
                    })
                    break
                  }
                }
              },
              onError: () => {
                showToast({
                  message: 'Ops... Falha ao encerrar reserva, tente novamente.',
                  duration: 5000,
                  variant: 'error',
                })
              },
            },
          })

        const handleCloseReservation = () => {
          showToast({
            message:
              'Você tem certeza que deseja encerrar esta reserva? Esta ação não pode ser desfeita e o horário ficará disponível para outros usuários.',
            duration: Infinity,
            variant: 'warning',
            firstButton: {
              text: 'Cancelar',
              variant: 'ghost',
              onClick: () => ({}),
            },
            secondButton: {
              text: 'Encerrar',
              variant: 'destructive',
              onClick: () => {
                closeReservation({
                  id: reservationId,
                })
              },
            },
          })
        }

        return (
          <div className="flex justify-end gap-2">
            <Button
              disabled={
                isGeneratingCode ||
                isMutating ||
                status !== 'reserved' ||
                isPast
              }
              variant="ghost"
              size="icon"
              onClick={handleWarningOpenDoor}
              // TODO: retirar hidden ao liberar quarta entrega de reservas
              className="hidden"
            >
              <LockOpenIcon />
            </Button>
            <Button
              disabled={isMutating || status !== 'reserved' || isPast}
              variant="ghost"
              size="icon"
              onClick={handleCloseReservation}
              className="group hover:bg-destructive hover:text-destructive-foreground text-destructive"
            >
              <TrashIcon />
            </Button>
            <DoorCodeDialog
              isOpen={isDoorCodeDialogOpen}
              onOpenChange={setIsDoorCodeDialogOpen}
              doorCode={doorCodeInfo?.doorCode}
              expiresAt={doorCodeInfo?.expiresAt}
              roomName={roomName}
              isLoading={doorCodeInfo?.isLoading}
            />
          </div>
        )
      },
    },
  ]
