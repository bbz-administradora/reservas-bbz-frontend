'use client'

import { ListSpaces200SpacesItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { DataTable } from '../data-table'
import { columnsSpaces } from './columns-spaces'
import { DataTableSpacesToolbar } from './toolbar-space'

interface DataTableSpacesProps {
  initialData?: ListSpaces200SpacesItem[]
  className?: string
}

export function DataTableSpaces({
  initialData,
  className,
}: DataTableSpacesProps) {
  return (
    <DataTable
      data={initialData || []}
      columns={columnsSpaces}
      Toolbar={DataTableSpacesToolbar}
      className={className}
    />
  )
}
