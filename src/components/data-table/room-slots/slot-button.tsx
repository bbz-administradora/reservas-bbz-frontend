'use client'

import { UserMe201User } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/utils/mergeClassNames'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarCheck2Icon,
  CalendarClockIcon,
  CalendarIcon,
  CalendarX2Icon,
} from 'lucide-react'
import { SlotCell } from './slotTableDataUtils'

interface SlotButtonProps {
  date: string
  time: string
  slot: SlotCell
  user: UserMe201User | null
}

export function SlotButton({ date, time, slot, user }: SlotButtonProps) {
  function handleClick() {
    console.log(`Slot clicado: ${date} ${time}`)
    console.log(`Status: ${slot.status}`)

    if (slot.status === 'reserved') {
      if (slot.preReservedBy?.id === user?.id) {
        console.log('Esta é sua reserva')
      } else if (user?.role !== 'user') {
        console.log('Reservado por outro usuário (cancelável como admin)')
      } else {
        console.log('Indisponível - reservado por outro usuário')
      }
    } else if (slot.status === 'pre_reserved') {
      console.log('Pré-reservado')
      if (slot.preReservedUntil) {
        console.log(`Até: ${slot.preReservedUntil}`)
      }
    } else {
      console.log('Disponível para reserva')
    }
  }

  let icon = (
    <CalendarIcon className="text-primary group-hover:text-primary-foreground size-6 transition-colors" />
  )
  let variant:
    | 'reserved-adm'
    | 'reserved-user'
    | 'reserved-my'
    | 'pre_reserved'
    | 'available' = 'available'

  // Determinar ícone com base no status e no papel do usuário
  if (slot.status === 'reserved') {
    // Slot reservado
    if (user && slot.preReservedBy && slot.preReservedBy.id === user.id) {
      // Reservado pelo usuário atual
      icon = <CalendarCheck2Icon className="text-secondary-foreground size-6" />
      variant = 'reserved-my'
    } else if (user && user.role !== 'user') {
      // Reservado por outra pessoa e usuário é admin
      icon = (
        <CalendarX2Icon className="text-destructive group-hover:text-destructive-foreground size-6 transition-colors" />
      )
      variant = 'reserved-adm'
    } else {
      // Reservado por outra pessoa e usuário é comum
      icon = <CalendarX2Icon className="text-muted size-6" />
      variant = 'reserved-user'
    }
  } else if (slot.status === 'pre_reserved') {
    // Slot pré-reservado
    icon = <CalendarClockIcon className="text-primary size-6" />
    variant = 'pre_reserved'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClick}
            className={cn(
              'group size-14',
              variant === 'reserved-my' &&
                'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              variant === 'reserved-adm' &&
                'hover:bg-destructive hover:text-destructive-foreground text-destructive',
              variant === 'reserved-user' &&
                'text-muted hover:bg-muted/40 hover:text-muted bg-transparent',
              variant === 'pre_reserved' &&
                'bg-warning/40 text-primary hover:bg-warning/80 hover:text-primary',
              variant === 'available' && 'text-primary hover:bg-primary',
            )}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        {variant !== 'available' ? (
          <TooltipContent className="hidden lg:block">
            <div className="space-y-1.5">
              <p className="font-semibold">
                {format(new Date(date + 'T' + time), 'dd/MM/yyyy - HH:mm', {
                  locale: ptBR,
                })}
              </p>

              {variant === 'reserved-my' && (
                <>
                  <p className="text-secondary">Sua reserva</p>
                  {user && (
                    <div className="text-xs">
                      <p>Nome: {user.name}</p>
                      <p>Email: {user.email}</p>
                    </div>
                  )}
                </>
              )}

              {variant === 'reserved-adm' && (
                <>
                  <p className="text-destructive">Reservado (cancelável)</p>
                  {slot.preReservedBy && (
                    <div className="text-xs">
                      <p>Por: {slot.preReservedBy.name}</p>
                      <p>Email: {slot.preReservedBy.email}</p>
                      <p className="mt-2 text-xs italic">
                        Como admin, você pode cancelar esta reserva
                      </p>
                    </div>
                  )}
                </>
              )}

              {variant === 'reserved-user' && (
                <>
                  <p>Reservado</p>
                  {slot.preReservedBy && (
                    <div className="text-xs">
                      <p>Por: {slot.preReservedBy.name}</p>
                      <p>Email: {slot.preReservedBy.email}</p>
                    </div>
                  )}
                </>
              )}

              {variant === 'pre_reserved' && (
                <>
                  <p className="text-warning">Pré-reservado</p>
                  {slot.preReservedBy && (
                    <div className="text-xs">
                      <p>Por: {slot.preReservedBy.name}</p>
                      <p>Email: {slot.preReservedBy.email}</p>
                    </div>
                  )}
                  {slot.preReservedUntil && (
                    <p className="mt-2 text-xs">
                      Até:{' '}
                      {format(
                        new Date(slot.preReservedUntil),
                        'dd/MM/yyyy - HH:mm',
                        { locale: ptBR },
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </TooltipContent>
        ) : null}
      </Tooltip>
    </TooltipProvider>
  )
}
