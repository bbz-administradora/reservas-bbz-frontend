'use client'

import {
  ListRoomReservations200ReservationsItem,
  ListRoomReservations200ReservationsItemStatus,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { cn } from '@/utils/mergeClassNames'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
const formatTimeRange = (slotRange: string[]) => {
  if (!slotRange || slotRange.length < 2) return 'N/A'

  try {
    const startDate = new Date(slotRange[0])
    const endDate = new Date(slotRange[1])

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
const isReservationPast = (slotRange: string[]) => {
  if (!slotRange || slotRange.length < 2) return false

  try {
    const endDate = new Date(slotRange[1])
    return endDate < new Date()
  } catch {
    return false
  }
}

// Função para determinar o status de exibição
const getStatusDisplay = (
  status: ListRoomReservations200ReservationsItemStatus,
  slotRange: string[],
) => {
  if (status === 'reserved' && isReservationPast(slotRange)) {
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
        const timeRange = formatTimeRange(row.original.slot.slotRange)
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
        // For sorting, we just use the original date string
        const dateA = rowA.original.slot.slotRange[0] || ''
        const dateB = rowB.original.slot.slotRange[0] || ''
        return new Date(dateA).getTime() - new Date(dateB).getTime()
      },
      filterFn: (row, id, value) => {
        // Filtrar por data específica
        if (!value || typeof value !== 'object') return true

        const slotRange = row.original.slot.slotRange
        if (!slotRange || slotRange.length < 2) return false

        try {
          // Os componentes da data do filtro
          const { year, month, day } = value as {
            year: number
            month: number
            day: number
          }

          // Obter a data da reserva
          const reservationDate = new Date(slotRange[0])

          // Comparar apenas ano, mês e dia
          return (
            reservationDate.getFullYear() === year &&
            reservationDate.getMonth() === month &&
            reservationDate.getDate() === day
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
          row.original.slot.slotRange,
        )
        return (
          <div className="flex items-center gap-2">
            <div className={cn('h-2.5 w-2.5 rounded-full', status.dotColor)} />
            <span className={cn(status.color)}>{status.text}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        // Handle the special case for "realized" status (completed reservations)
        if (value.includes('realized')) {
          const isRealized =
            row.original.status === 'reserved' &&
            isReservationPast(row.original.slot.slotRange)

          // If 'realized' is selected and this is a realized reservation, include it
          if (isRealized) return true

          // If 'realized' is the only option and this isn't realized, exclude it
          if (value.length === 1) return false
        }

        // Normal status filtering
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
          <span className="break-words whitespace-normal">
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
  ]
