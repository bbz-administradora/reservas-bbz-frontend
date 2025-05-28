'use client'

import { cn } from '@/utils/mergeClassNames'
import { Table } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { CalendarIcon, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { Calendar } from '../../ui/calendar'
import { Input } from '../../ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataTableFacetedFilter } from '../data-table-faceted-filter'
import { DataTableViewOptions } from '../data-table-view-options'
import { reservationsTitlesColumns } from './columns-reservations'

export const reservationStatuses = [
  {
    value: 'reserved',
    label: 'Ativo',
    color: 'bg-yellow-500',
  },
  {
    value: 'cancelled',
    label: 'Cancelado',
    color: 'bg-red-500',
  },
  {
    value: 'closed',
    label: 'Encerrada',
    color: 'bg-red-500',
  },
  {
    value: 'realized',
    label: 'Realizado',
    color: 'bg-green-500',
  },
]

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableReservationsToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <div className="grid grid-rows-2 gap-3 lg:grid-cols-[.4fr_.4fr_.4fr_1fr] lg:grid-rows-1">
      <Input
        placeholder="Filtrar por sala..."
        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        onChange={(event) => {
          // Custom filtering for room name
          const value = event.target.value

          if (table.getColumn('name')) {
            table.setColumnFilters((prev) => {
              // Remove any existing filter for 'name'
              const filtered = prev.filter((f) => f.id !== 'name')

              // Only add if there's a value
              if (value) {
                filtered.push({
                  id: 'name',
                  value: value,
                })
              }

              return filtered
            })
          }
        }}
        className="md:h-9"
      />

      {/* Filtro de data */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal md:h-9',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="text-muted-foreground group-hover:text-accent-foreground mr-2 h-4 w-4 transition-colors" />
            {date ? (
              format(date, 'dd/MM/yyyy', { locale: ptBR })
            ) : (
              <span>Filtrar por data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate)

              // Filtrar a tabela pela data selecionada
              if (selectedDate && table.getColumn('dateTime')) {
                // Formatar para comparação, sem a parte de horas
                const selectedYear = selectedDate.getFullYear()
                const selectedMonth = selectedDate.getMonth()
                const selectedDay = selectedDate.getDate()

                table.setColumnFilters((prev) => {
                  // Remover filtro de data existente
                  const filtered = prev.filter((f) => f.id !== 'dateTime')

                  // Adicionar novo filtro com os componentes da data para comparação correta
                  filtered.push({
                    id: 'dateTime',
                    value: {
                      year: selectedYear,
                      month: selectedMonth,
                      day: selectedDay,
                    },
                  })

                  return filtered
                })
              } else if (table.getColumn('dateTime')) {
                // Se a data for desmarcada, remover o filtro
                table.setColumnFilters((prev) =>
                  prev.filter((f) => f.id !== 'dateTime'),
                )
              }
            }}
            locale={ptBR}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-3">
        {table.getColumn('status') && (
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title="Status"
            options={reservationStatuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.resetColumnFilters()
              setDate(undefined)
            }}
            className="text-destructive h-9 px-2 lg:px-3"
          >
            Reset
            <XCircle className="ml-2 h-4 w-4" />
          </Button>
        )}
        <DataTableViewOptions
          titles={reservationsTitlesColumns}
          table={table}
        />
      </div>
    </div>
  )
}
