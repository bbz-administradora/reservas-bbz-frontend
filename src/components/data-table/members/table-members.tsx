'use client'

import { ListMembers200MembersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { DataTable } from '../data-table'
import { columnsMembers } from './columns-members'
import { DataTableMembersToolbar } from './toolbar-members'

interface DataTableMembersProps {
  initialData?: ListMembers200MembersItem[]
  className?: string
}

export function DataTableMembers({
  initialData,
  className,
}: DataTableMembersProps) {
  return (
    <DataTable
      data={initialData || []}
      columns={columnsMembers}
      Toolbar={DataTableMembersToolbar}
      className={className}
    />
  )
}
