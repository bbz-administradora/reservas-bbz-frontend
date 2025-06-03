'use client'

import { ListRoomReservations200ReservationsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { FilterFn } from '@tanstack/react-table'
import { DataTable } from '../data-table'
import { columnsReservations } from './columns-reservations'
import { DataTableReservationsToolbar } from './toolbar-reservations'

interface DataTableReservationsProps {
  initialData?: ListRoomReservations200ReservationsItem[]
  className?: string
}

// Custom filter function for room name (nested property)
const roomNameFilter: FilterFn<ListRoomReservations200ReservationsItem> = (
  row,
  columnId,
  filterValue,
) => {
  // Skip if no filter value
  if (!filterValue || typeof filterValue !== 'string') return true

  // For room name column, search in the nested property
  if (columnId === 'name') {
    const roomName = row.original.room.name || ''
    return roomName.toLowerCase().includes(filterValue.toLowerCase())
  }

  // Default behavior for other columns
  const value = row.getValue(columnId) as string
  return value?.toLowerCase().includes(filterValue.toLowerCase())
}

// Interface para representar reservas agrupadas
interface GroupedReservation
  extends Omit<ListRoomReservations200ReservationsItem, 'id'> {
  id: string // ID da primeira reserva do grupo
  ids: string[] // Array com todos os IDs das reservas agrupadas
  // Acrescentamos campos para representar o intervalo completo
  groupSlotStart: string
  groupSlotEnd: string
}

// Função para agrupar slots consecutivos da mesma sala
const groupConsecutiveSlots = (
  reservations: ListRoomReservations200ReservationsItem[],
): GroupedReservation[] => {
  if (!reservations || reservations.length === 0) return []

  // Primeiro, ordenamos por sala e data/hora de início
  const sortedReservations = [...reservations].sort((a, b) => {
    // Primeiro por sala
    if (a.room.id !== b.room.id) {
      return a.room.id.localeCompare(b.room.id)
    }
    // Depois por horário de início
    return (
      new Date(a.slotStart || '').getTime() -
      new Date(b.slotStart || '').getTime()
    )
  })

  const groupedReservations: GroupedReservation[] = []
  let currentGroup: {
    reservations: ListRoomReservations200ReservationsItem[]
    roomId: string
    lastEndTime: Date
  } | null = null

  for (const reservation of sortedReservations) {
    const startTime = new Date(reservation.slotStart || '')
    const endTime = new Date(reservation.slotEnd || '')

    // Se não temos um grupo atual ou a reserva é de outra sala
    // ou não é consecutiva (início != fim do último slot)
    if (
      !currentGroup ||
      reservation.room.id !== currentGroup.roomId ||
      Math.abs(startTime.getTime() - currentGroup.lastEndTime.getTime()) > 60000 // tolerância de 1 minuto
    ) {
      // Se temos um grupo em andamento, finalizamos ele
      if (currentGroup && currentGroup.reservations.length > 0) {
        const firstReservation = currentGroup.reservations[0]
        const lastReservation =
          currentGroup.reservations[currentGroup.reservations.length - 1]

        groupedReservations.push({
          ...firstReservation,
          id: firstReservation.id,
          ids: currentGroup.reservations.map((r) => r.id),
          groupSlotStart: firstReservation.slotStart || '',
          groupSlotEnd: lastReservation.slotEnd || '',
        })
      }

      // Iniciamos um novo grupo
      currentGroup = {
        reservations: [reservation],
        roomId: reservation.room.id,
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
      ...firstReservation,
      id: firstReservation.id,
      ids: currentGroup.reservations.map((r) => r.id),
      groupSlotStart: firstReservation.slotStart || '',
      groupSlotEnd: lastReservation.slotEnd || '',
    })
  }

  return groupedReservations
}

export function DataTableReservations({
  initialData,
  className,
}: DataTableReservationsProps) {
  // Agrupar slots consecutivos da mesma sala
  const groupedData = groupConsecutiveSlots(initialData || [])

  return (
    <DataTable
      data={groupedData}
      columns={columnsReservations as any[]}
      Toolbar={DataTableReservationsToolbar}
      className={className}
      globalFilterFn={roomNameFilter}
      initialSorting={[{ id: 'dateTime', desc: true }]} // Ordenar por data/hora, mais recente primeiro
    />
  )
}
