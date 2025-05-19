'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/utils/mergeClassNames'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
}

export function DatePickerWithButton({
  date,
  setDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  // Função que vai lidar com a seleção da data e fechar o popover
  const handleSelect = (date: Date | undefined) => {
    setDate(date)
    // Feche o popover se uma data for selecionada
    if (date) {
      setOpen(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'group w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="text-muted-foreground group-hover:text-accent-foreground mr-2 h-4 w-4 transition-colors" />
            {date ? (
              format(date, 'dd/MM/yyyy', { locale: ptBR })
            ) : (
              <span>Escolha uma data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            autoFocus
            locale={ptBR}
            startMonth={new Date()} // Desabilita dias anteriores à data atual
            disabled={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            } // Garante que não seja possível selecionar datas passadas
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
