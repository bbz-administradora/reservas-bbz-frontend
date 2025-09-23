'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import {
  ListSpaceReservations200ReservationsItem,
  ListSpaceReservations200ReservationsItemStatus,
  UserMe200User,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useCloseSpaceReservation } from '@/api/endpoints/reservation/reservation'
import { useOpenDoor } from '@/api/endpoints/space/space'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DoorCodeDialog } from '@/components/DoorCodeDialog'
import { showToast } from '@/components/ShowToast'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/mergeClassNames'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LockOpenIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'

export const reservationsTitlesColumns = {
  name: 'Espaço',
  type: 'Tipo',
  dateTime: 'Data e horário',
  status: 'Status',
  createdBy: 'Criado por',
  userRole: 'Seu papel na reserva',
  bbzCollaborators: 'Convidados Internos',
  externalGuests: 'Convidados externos',
  needsCopeira: 'Copeira?',
  floor: 'Andar',
  zone: 'Seção',
  position: 'Posição',
  checkInAt: 'Check-in',
  checkOutAt: 'Check-out',
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
  status: ListSpaceReservations200ReservationsItemStatus,
  slotEnd: string,
  checkInOuts?: Array<{ type: 'check-in' | 'check-out' }>,
) => {
  const isPast = isReservationPast(slotEnd)
  const hasCheckIn = checkInOuts?.some((item) => item.type === 'check-in')
  const hasCheckOut = checkInOuts?.some((item) => item.type === 'check-out')

  // Se a reserva foi realizada completamente (check-in e check-out)
  if (hasCheckIn && hasCheckOut) {
    return {
      text: 'Realizado',
      color: 'text-foreground',
      dotColor: 'bg-green-500',
    }
  }

  // Se a reserva já passou mas não teve check-in ou check-out completos
  if (status === 'reserved' && isPast && (!hasCheckIn || !hasCheckOut)) {
    // Se tem check-in mas não tem check-out
    if (hasCheckIn && !hasCheckOut) {
      return {
        text: 'Check-out Pendente',
        color: 'text-foreground',
        dotColor: 'bg-orange-500',
      }
    }
    // Se não tem nem check-in nem check-out
    return {
      text: 'Incompleta',
      color: 'text-foreground',
      dotColor: 'bg-orange-500',
    }
  }

  // Para as demais regras
  switch (status) {
    case 'reserved':
      // Se não está no passado, está ativa
      if (!isPast) {
        return {
          text: 'Ativo',
          color: 'text-foreground',
          dotColor: 'bg-yellow-500',
        }
      }
      // Se chegou aqui é porque é reserva no passado sem check-in/check-out que não foi tratada acima
      return {
        text: 'Incompleta',
        color: 'text-foreground',
        dotColor: 'bg-orange-500',
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

export const columnsReservations = (
  currentUser?: UserMe200User | null,
): ColumnDef<ListSpaceReservations200ReservationsItem>[] => [
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
        {transformTextIntoCapitalizedWords(row.original.space.name || 'N/A')}
      </span>
    ),
    // Custom filter function to handle the nested space.name property
    filterFn: (row, id, value) => {
      const spaceName = row.original.space.name || ''
      return spaceName.toLowerCase().includes(value.toLowerCase())
    },
  },
  {
    // Usando accessorFn para acessar space.type diretamente
    id: 'type',
    accessorFn: (row) => row.space.type,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={reservationsTitlesColumns.type}
      />
    ),
    cell: ({ row }) => {
      const spaceType = row.original.space.type
      let typeText = 'N/A'

      if (spaceType === 'room') {
        typeText = 'Sala'
      } else if (spaceType === 'workstation') {
        typeText = 'Estação de trabalho'
      }

      return <span>{typeText}</span>
    },
    filterFn: (row, id, value) => {
      const spaceType = row.getValue(id) as string
      return value.includes(spaceType)
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
      const slotStart = row.original.slotStart
      const slotEnd = row.original.slotEnd

      if (!slotStart || !slotEnd) return <span>-</span>

      const timeRange = formatTimeRange(slotStart, slotEnd)

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
        row.original.checkInOuts,
      )
      return (
        <div className="flex items-center gap-2">
          <div className={cn('h-2.5 w-2.5 rounded-full', status.dotColor)} />
          <span className={cn(status.color)}>{status.text}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      // Status real do banco
      const dbStatus = row.original.status
      const isPast = isReservationPast(row.original.slotEnd || '')
      const hasCheckIn = row.original.checkInOuts?.some(
        (item) => item.type === 'check-in',
      )
      const hasCheckOut = row.original.checkInOuts?.some(
        (item) => item.type === 'check-out',
      )

      // Filtro para "Realizado" (check-in e check-out completos)
      if (value.includes('realized')) {
        if (hasCheckIn && hasCheckOut) return true
        if (value.length === 1) return false
      }

      // Filtro para "Incompleta" (sem check-in e sem check-out)
      if (value.includes('incomplete')) {
        const isIncomplete = dbStatus === 'reserved' && isPast && !hasCheckIn
        if (isIncomplete) return true
        if (value.length === 1) return false
      }

      // Filtro para "Check-out Pendente" (com check-in mas sem check-out)
      if (value.includes('checkout-pending')) {
        const isCheckoutPending =
          dbStatus === 'reserved' && isPast && hasCheckIn && !hasCheckOut
        if (isCheckoutPending) return true
        if (value.length === 1) return false
      }

      // Filtro para "Ativo" (reservado e no futuro)
      if (value.includes('reserved')) {
        const isActive = dbStatus === 'reserved' && !isPast
        if (isActive) return true
        if (value.length === 1) return false
      }

      // Filtros para status diretos do banco (closed, cancelled)
      return value.includes(dbStatus)
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
    id: 'userRole',
    enableColumnFilter: true,
    // Accessor retorna o papel em relação à pessoa visualizando, não à pessoa que criou
    accessorFn: (row) => {
      if (!currentUser) return 'not_authenticated'

      const userEmail = currentUser.email?.toLowerCase() || ''
      const userName = currentUser.name?.toLowerCase() || ''

      // Se o usuário atual é o criador da reserva
      if (row.user.name?.toLowerCase() === userName) return 'responsible'

      // Se o usuário atual é um convidado
      if (
        row.bbzCollaborators?.some(
          (email) => email.toLowerCase() === userEmail,
        ) ||
        row.externalGuests?.some((email) => email.toLowerCase() === userEmail)
      ) {
        return 'guest'
      }

      return 'not_related'
    },
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={reservationsTitlesColumns.userRole}
      />
    ),
    cell: ({ row }) => {
      if (!currentUser) {
        return <span className="text-gray-500">Não autenticado</span>
      }

      const userEmail = currentUser.email?.toLowerCase() || ''
      const userName = currentUser.name?.toLowerCase() || ''

      const isOwner = row.original.user.name?.toLowerCase() === userName

      const isGuest =
        row.original.bbzCollaborators?.some(
          (email) => email.toLowerCase() === userEmail,
        ) ||
        row.original.externalGuests?.some(
          (email) => email.toLowerCase() === userEmail,
        )

      if (isOwner) {
        return <span>Responsável</span>
      } else if (isGuest) {
        return <span>Convidado</span>
      } else {
        return <span className="text-gray-500">Não relacionado</span>
      }
    },
    filterFn: (row, id, value) => {
      if (value.length === 0) return true

      // Utilizamos o valor calculado pelo accessor
      const roleValue = row.getValue(id) as string
      return value.includes(roleValue)
    },
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
    cell: ({ row }) => <span>{row.original.needsCopeira ? 'Sim' : 'Não'}</span>,
  },
  {
    accessorKey: 'floor',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={reservationsTitlesColumns.floor}
      />
    ),
    cell: ({ row }) => <span>{row.original.space.floor || '-'}</span>,
  },
  {
    accessorKey: 'zone',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={reservationsTitlesColumns.zone}
      />
    ),
    cell: ({ row }) => <span>{row.original.space.zone || '-'}</span>,
  },
  {
    accessorKey: 'position',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={reservationsTitlesColumns.position}
      />
    ),
    cell: ({ row }) => <span>{row.original.space.position || '-'}</span>,
  },
  {
    accessorKey: 'checkInAt',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={reservationsTitlesColumns.checkInAt}
      />
    ),
    cell: ({ row }) => {
      if (!currentUser) return <span>-</span>
      const checkIn = row.original.checkInOuts?.find(
        (item) => item.userId === currentUser.id && item.type === 'check-in',
      )
      if (!checkIn) return <span>-</span>
      try {
        const formattedDate = format(
          new Date(checkIn.createdAt),
          'dd/MM/yyyy HH:mm',
          {
            locale: ptBR,
          },
        )
        return <span>{formattedDate}</span>
      } catch {
        return <span>Data inválida</span>
      }
    },
  },
  {
    accessorKey: 'checkOutAt',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={reservationsTitlesColumns.checkOutAt}
      />
    ),
    cell: ({ row }) => {
      if (!currentUser) return <span>-</span>
      const checkOut = row.original.checkInOuts?.find(
        (item) => item.userId === currentUser.id && item.type === 'check-out',
      )
      if (!checkOut) return <span>-</span>
      try {
        const formattedDate = format(
          new Date(checkOut.createdAt),
          'dd/MM/yyyy HH:mm',
          {
            locale: ptBR,
          },
        )
        return <span>{formattedDate}</span>
      } catch {
        return <span>Data inválida</span>
      }
    },
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
      const spaceName = row.original.space.name || 'Espaço'

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
          { spaceName, reservationId: row.original.id },
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

                  if (response.data.message === 'Check-in não encontrado') {
                    showToast({
                      message:
                        'Você precisa fazer check-in para gerar o código de abertura.',
                      duration: 5000,
                      variant: 'error',
                    })
                  } else {
                    showToast({
                      message:
                        'Não foi possível gerar o código de abertura. Tente novamente.',
                      duration: 5000,
                      variant: 'error',
                    })
                  }
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
                  message: 'Erro ao gerar código de abertura. Tente novamente.',
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
            'Você pode gerar um código de abertura para este espaço baseado na sua reserva.',
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
        useCloseSpaceReservation({
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
                case 400: {
                  // Verificar se é o erro específico de workstation com menos de 24h
                  if (
                    response.data?.message?.includes(
                      'Workstations só podem ser fechadas com 24h de antecedência',
                    )
                  ) {
                    showToast({
                      message:
                        'Workstations só podem ser fechadas com 24 horas de antecedência',
                      duration: 5000,
                      variant: 'warning',
                    })
                  } else {
                    // Outros erros 400
                    showToast({
                      message:
                        'Ops... Falha ao encerrar reserva, tente novamente.',
                      duration: 5000,
                      variant: 'error',
                    })
                  }
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
          message: `Você tem certeza que deseja encerrar esta reserva? Esta ação não pode ser desfeita e o horário ficará disponível para outros usuários.`,
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

      // Verificamos se o usuário é o proprietário da reserva
      const userEmail = currentUser?.email?.toLowerCase() || ''
      const userName = currentUser?.name?.toLowerCase() || ''
      const isOwner = row.original.user.name?.toLowerCase() === userName

      return (
        <div className="flex justify-end gap-2">
          <Button
            disabled={
              isGeneratingCode || isMutating || status !== 'reserved' || isPast
            }
            variant="ghost"
            size="icon"
            onClick={handleWarningOpenDoor}
          >
            <LockOpenIcon />
          </Button>
          <Button
            disabled={
              isMutating || status !== 'reserved' || isPast || !isOwner // Apenas o proprietário pode encerrar a reserva
            }
            variant="ghost"
            size="icon"
            onClick={handleCloseReservation}
            className="group hover:bg-destructive hover:text-destructive-foreground text-destructive"
            title={
              isOwner
                ? 'Encerrar reserva'
                : 'Apenas o responsável pode encerrar a reserva'
            }
          >
            <TrashIcon />
          </Button>
          <DoorCodeDialog
            isOpen={isDoorCodeDialogOpen}
            onOpenChange={setIsDoorCodeDialogOpen}
            doorCode={doorCodeInfo?.doorCode}
            expiresAt={doorCodeInfo?.expiresAt}
            spaceName={spaceName}
            isLoading={doorCodeInfo?.isLoading}
          />
        </div>
      )
    },
  },
]
