'use client'

import { ListSupervisors200SupervisorsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { DataTable } from '../data-table'
import { columnsSupervisors } from './columns-supervisors'
import { DataTableSupervisorsToolbar } from './toolbar-supervisors'

interface DataTableSupervisorsProps {
  initialData?: ListSupervisors200SupervisorsItem[]
  className?: string
}

export function DataTableSupervisors({
  initialData,
  className,
}: DataTableSupervisorsProps) {
  return (
    <DataTable
      data={initialData || []}
      columns={columnsSupervisors}
      Toolbar={DataTableSupervisorsToolbar}
      className={className}
    />
  )
}
