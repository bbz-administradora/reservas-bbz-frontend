'use client'

import { UserList200UsersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { DataTable } from '../data-table'
import { columnsUsers } from './columns-users'
import { DataTableUsersToolbar } from './toolbar-users'

interface DataTableUsersProps {
  initialData?: UserList200UsersItem[]
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
