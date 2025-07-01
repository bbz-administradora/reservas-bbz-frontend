'use client'

import {
  ListSpaceReservations200ReservationsItem,
  UserMe200User,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { FilterFn } from '@tanstack/react-table'
import { DataTable } from '../data-table'
import { columnsAllReservations } from './columns-all-reservations'
import { columnsReservations } from './columns-reservations'
import { DataTableAllReservationsToolbar } from './toolbar-all-reservations'
import { DataTableReservationsToolbar } from './toolbar-reservations'

interface DataTableReservationsProps {
  initialData?: ListSpaceReservations200ReservationsItem[]
  className?: string
  currentUser?: UserMe200User | null
  allList?: boolean // Optional prop to indicate if it's an all reservations list
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

export function DataTableReservations({
  initialData,
  className,
  currentUser,
  allList = false,
}: DataTableReservationsProps) {
  const columns = !allList
    ? columnsReservations(currentUser)
    : columnsAllReservations(currentUser)

  const toolbar = !allList
    ? DataTableReservationsToolbar
    : DataTableAllReservationsToolbar

  return (
    <DataTable
      data={initialData || []}
      columns={columns}
      Toolbar={toolbar}
      className={className}
      globalFilterFn={spaceNameFilter}
      initialSorting={[{ id: 'dateTime', desc: true }]} // Ordenar por data/hora, mais recente primeiro
    />
  )
}
