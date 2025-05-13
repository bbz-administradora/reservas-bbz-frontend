'use client'

import { ListUsers201UsersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { DataTable } from '../data-table'
import { columnsUsers } from './columns-users'
import { DataTableUsersToolbar } from './toolbar-users'

interface DataTableUsersProps {
  initialData?: ListUsers201UsersItem[]
  className?: string
}

export function DataTableUsers({
  initialData,
  className,
}: DataTableUsersProps) {
  return (
    <DataTable
      data={initialData || []}
      columns={columnsUsers}
      Toolbar={DataTableUsersToolbar}
      className={className}
    />
  )
}
