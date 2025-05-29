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

export function DataTableReservations({
  initialData,
  className,
}: DataTableReservationsProps) {
  return (
    <DataTable
      data={initialData || []}
      columns={columnsReservations}
      Toolbar={DataTableReservationsToolbar}
      className={className}
      globalFilterFn={roomNameFilter}
      initialSorting={[{ id: 'dateTime', desc: true }]} // Ordenar por data/hora, mais recente primeiro
    />
  )
}
