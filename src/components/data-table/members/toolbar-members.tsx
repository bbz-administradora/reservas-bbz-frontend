'use client'

import { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { DataTableViewOptions } from '../data-table-view-options'
import { membersTitlesColumns } from './columns-members'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableMembersToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="grid grid-rows-2 gap-3 lg:grid-cols-[.5fr_.5fr_1fr] lg:grid-rows-1">
      <Input
        placeholder="Filtrar por nome..."
        value={(table.getColumn('userName')?.getFilterValue() as string) ?? ''}
        onChange={(event) =>
          table.getColumn('userName')?.setFilterValue(event.target.value)
        }
        className="md:h-9"
      />

      <Input
        placeholder="Filtrar por email..."
        value={(table.getColumn('userEmail')?.getFilterValue() as string) ?? ''}
        onChange={(event) => {
          const normalizedEmail = event.target.value.trim().toLowerCase()
          table.getColumn('userEmail')?.setFilterValue(normalizedEmail)
        }}
        className="md:h-9"
      />

      <div className="flex flex-wrap gap-3">
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="text-destructive h-9 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
        <DataTableViewOptions titles={membersTitlesColumns} table={table} />
      </div>
    </div>
  )
}
