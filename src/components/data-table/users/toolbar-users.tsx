'use client'

import { Table } from '@tanstack/react-table'
import { Check, UserRound, UserRoundCog, UserRoundPlus, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { DataTableFacetedFilter } from '../data-table-faceted-filter'
import { DataTableViewOptions } from '../data-table-view-options'
import { usersTitlesColumns } from './columns-users'

export const roles = [
  {
    value: 'user',
    label: 'User',
    icon: UserRound,
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: UserRoundPlus,
  },
  {
    value: 'dev',
    label: 'Dev',
    icon: UserRoundCog,
  },
]

export const status = [
  {
    value: true,
    label: 'Active',
    icon: Check,
  },
  {
    value: false,
    label: 'Inactive',
    icon: X,
  },
]

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableUsersToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="grid grid-rows-2 gap-3 lg:grid-cols-[.5fr_.5fr_1fr] lg:grid-rows-1">
      <Input
        placeholder="Filtrar por nome..."
        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        onChange={(event) =>
          table.getColumn('name')?.setFilterValue(event.target.value)
        }
        className="md:h-9"
      />

      <Input
        placeholder="Filtrar por email..."
        value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
        onChange={(event) =>
          table.getColumn('email')?.setFilterValue(event.target.value)
        }
        className="md:h-9"
      />
      <div className="flex gap-3">
        {table.getColumn('role') && (
          <DataTableFacetedFilter
            column={table.getColumn('role')}
            title="Role"
            options={roles}
          />
        )}
        {table.getColumn('accountStatus') && (
          <DataTableFacetedFilter
            column={table.getColumn('accountStatus')}
            title="Status"
            options={status}
          />
        )}
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
        <DataTableViewOptions titles={usersTitlesColumns} table={table} />
      </div>
    </div>
  )
}
