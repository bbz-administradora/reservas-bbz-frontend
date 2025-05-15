'use client'

import { ListRooms200RoomsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { DataTable } from '../data-table'
import { columnsRooms } from './columns-rooms'
import { DataTableRoomsToolbar } from './toolbar-rooms'

interface DataTableRoomsProps {
  initialData?: ListRooms200RoomsItem[]
  className?: string
}

export function DataTableRooms({
  initialData,
  className,
}: DataTableRoomsProps) {
  return (
    <DataTable
      data={initialData || []}
      columns={columnsRooms}
      Toolbar={DataTableRoomsToolbar}
      className={className}
    />
  )
}
