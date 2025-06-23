'use client'

import { ListSpaceReservations200ReservationsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { FilterFn } from '@tanstack/react-table'
import { DataTable } from '../data-table'
import { columnsReservations } from './columns-reservations'
import { DataTableReservationsToolbar } from './toolbar-reservations'

interface DataTableReservationsProps {
  initialData?: ListSpaceReservations200ReservationsItem[]
  className?: string
}

// Custom filter function for space name (nested property)
const spaceNameFilter: FilterFn<ListSpaceReservations200ReservationsItem> = (
  row,
  columnId,
  filterValue,
) => {
  // Skip if no filter value
  if (!filterValue || typeof filterValue !== 'string') return true

  // For space name column, search in the nested property
  if (columnId === 'name') {
    const spaceName = row.original.space.name || ''
    return spaceName.toLowerCase().includes(filterValue.toLowerCase())
  }

  // Default behavior for other columns
  const value = row.getValue(columnId) as string
  return value?.toLowerCase().includes(filterValue.toLowerCase())
}

// Interface para representar reservas de espaços agrupadas
interface GroupedReservation
  extends Omit<ListSpaceReservations200ReservationsItem, 'id'> {
  id: string // ID da primeira reserva do grupo
  ids: string[] // Array com todos os IDs das reservas agrupadas
  // Acrescentamos campos para representar o intervalo completo
  groupSlotStart: string
  groupSlotEnd: string
}

// Função para agrupar slots consecutivos do mesmo espaço
const groupConsecutiveSlots = (
  reservations: ListSpaceReservations200ReservationsItem[],
): GroupedReservation[] => {
  if (!reservations || reservations.length === 0) return []

  // Primeiro, ordenamos por espaço e data/hora de início
  const sortedReservations = [...reservations].sort((a, b) => {
    // Primeiro por espaço
    if (a.space.id !== b.space.id) {
      return a.space.id.localeCompare(b.space.id)
    }
    // Depois por horário de início
    return (
      new Date(a.slotStart || '').getTime() -
      new Date(b.slotStart || '').getTime()
    )
  })

  const groupedReservations: GroupedReservation[] = []
  let currentGroup: {
    reservations: ListSpaceReservations200ReservationsItem[]
    spaceId: string
    lastEndTime: Date
  } | null = null

  for (const reservation of sortedReservations) {
    const startTime = new Date(reservation.slotStart || '')
    const endTime = new Date(reservation.slotEnd || '')

    // Se não temos um grupo atual ou a reserva é de outro espaço
    // ou não é consecutiva (início != fim do último slot)
    if (
      !currentGroup ||
      reservation.space.id !== currentGroup.spaceId ||
      Math.abs(startTime.getTime() - currentGroup.lastEndTime.getTime()) > 60000 // tolerância de 1 minuto
    ) {
      // Se temos um grupo em andamento, finalizamos ele
      if (currentGroup && currentGroup.reservations.length > 0) {
        const firstReservation = currentGroup.reservations[0]
        const lastReservation =
          currentGroup.reservations[currentGroup.reservations.length - 1]

        // Criamos um novo objeto GroupedReservation a partir da primeira reserva
        groupedReservations.push({
          // Copiamos todas as propriedades necessárias de forma explícita
          id: firstReservation.id,
          ids: currentGroup.reservations.map((r) => r.id),
          groupSlotStart: firstReservation.slotStart || '',
          groupSlotEnd: lastReservation.slotEnd || '',
          // Outras propriedades necessárias da reserva
          status: firstReservation.status,
          space: firstReservation.space,
          slotStart: firstReservation.slotStart,
          slotEnd: firstReservation.slotEnd,
          slot: firstReservation.slot,
          user: firstReservation.user,
          createdAt: firstReservation.createdAt,
          cancelledAt: firstReservation.cancelledAt,
          cancelledBy: firstReservation.cancelledBy,
          cancelReason: firstReservation.cancelReason,
          closedAt: firstReservation.closedAt,
          bbzCollaborators: firstReservation.bbzCollaborators,
          externalGuests: firstReservation.externalGuests,
          needsCopeira: firstReservation.needsCopeira,
        })
      }

      // Iniciamos um novo grupo
      currentGroup = {
        reservations: [reservation],
        spaceId: reservation.space.id,
        lastEndTime: endTime,
      }
    } else {
      // Adicionamos a reserva ao grupo atual
      currentGroup.reservations.push(reservation)
      currentGroup.lastEndTime = endTime
    }
  }

  // Finalizamos o último grupo se existir
  if (currentGroup && currentGroup.reservations.length > 0) {
    const firstReservation = currentGroup.reservations[0]
    const lastReservation =
      currentGroup.reservations[currentGroup.reservations.length - 1]

    groupedReservations.push({
      // Copiamos todas as propriedades necessárias de forma explícita
      id: firstReservation.id,
      ids: currentGroup.reservations.map((r) => r.id),
      groupSlotStart: firstReservation.slotStart || '',
      groupSlotEnd: lastReservation.slotEnd || '',
      // Outras propriedades necessárias da reserva
      status: firstReservation.status,
      space: firstReservation.space,
      slotStart: firstReservation.slotStart,
      slotEnd: firstReservation.slotEnd,
      slot: firstReservation.slot,
      user: firstReservation.user,
      createdAt: firstReservation.createdAt,
      cancelledAt: firstReservation.cancelledAt,
      cancelledBy: firstReservation.cancelledBy,
      cancelReason: firstReservation.cancelReason,
      closedAt: firstReservation.closedAt,
      bbzCollaborators: firstReservation.bbzCollaborators,
      externalGuests: firstReservation.externalGuests,
      needsCopeira: firstReservation.needsCopeira,
    })
  }

  return groupedReservations
}

export function DataTableReservations({
  initialData,
  className,
}: DataTableReservationsProps) {
  // Agrupar slots consecutivos do mesmo espaço
  const groupedData = groupConsecutiveSlots(initialData || [])

  return (
    <DataTable
      data={groupedData}
      columns={columnsReservations as any[]}
      Toolbar={DataTableReservationsToolbar}
      className={className}
      globalFilterFn={spaceNameFilter}
      initialSorting={[{ id: 'dateTime', desc: true }]} // Ordenar por data/hora, mais recente primeiro
    />
  )
}
