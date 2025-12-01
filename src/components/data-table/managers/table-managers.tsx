'use client'

import { ListManagers200ManagersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { DataTable } from '../data-table'
import { columnsManagers } from './columns-managers'
import { DataTableManagersToolbar } from './toolbar-managers'

interface DataTableManagersProps {
  initialData?: ListManagers200ManagersItem[]
  className?: string
}

export function DataTableManagers({
  initialData,
  className,
}: DataTableManagersProps) {
  return (
    <DataTable
      data={initialData || []}
      columns={columnsManagers}
      Toolbar={DataTableManagersToolbar}
      className={className}
    />
  )
}
