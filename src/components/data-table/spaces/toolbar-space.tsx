'use client'

import { Table } from '@tanstack/react-table'
import { Check, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { DataTableFacetedFilter } from '../data-table-faceted-filter'
import { DataTableViewOptions } from '../data-table-view-options'
import { spacesTitlesColumns } from './columns-spaces'

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

export const spaceTypes = [
  {
    value: 'room',
    label: 'Sala',
    icon: Check,
  },
  {
    value: 'workstation',
    label: 'Estação de Trabalho',
    icon: Check,
  },
]

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableSpacesToolbar<TData>({
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
        placeholder="Filtrar por recurso..."
        value={(table.getColumn('recursos')?.getFilterValue() as string) ?? ''}
        onChange={(event) =>
          table.getColumn('recursos')?.setFilterValue(event.target.value)
        }
        className="md:h-9"
      />

      <div className="flex gap-3">
        {table.getColumn('isActive') && (
          <DataTableFacetedFilter
            column={table.getColumn('isActive')}
            title="Status"
            options={status}
          />
        )}

        {table.getColumn('type') && (
          <DataTableFacetedFilter
            column={table.getColumn('type')}
            title="Tipo"
            options={spaceTypes}
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
        <DataTableViewOptions titles={spacesTitlesColumns} table={table} />
      </div>
    </div>
  )
}
