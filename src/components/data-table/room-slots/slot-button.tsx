'use client'

import { UserMe201User } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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

  function handleCancelReservation() {
    console.log(`Cancelando reserva: ${date} ${time}`)
    console.log(`Dados da reserva:`, slot.preReservedBy)
  }

  // Componente de conteúdo reutilizado tanto para tooltip quanto para sheet
  const SlotContent = () => (
    <div className="space-y-4 lg:space-y-2">
      <p className="text-primary lg:text-primary-foreground text-xl font-semibold lg:text-xs">
        {format(new Date(date + 'T' + time), 'dd/MM/yyyy - HH:mm', {
          locale: ptBR,
        })}
      </p>

      {variant === 'reserved-my' && (
        <>
          <p className="lg:text-secondary text-primary font-semibold lg:font-normal">
            Sua reserva
          </p>
          {user && (
            <div className="text-xs">
              <p>
                Nome: <strong>{user.name}</strong>
              </p>
              <p>
                Email: <strong>{user.email}</strong>
              </p>
            </div>
          )}
        </>
      )}

      {variant === 'reserved-adm' && (
        <>
          <p className="text-primary lg:text-destructive font-semibold lg:font-normal">
            Reservado (cancelável)
          </p>
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
          <p className="text-primary lg:text-foreground font-semibold lg:font-normal">
            Reservado
          </p>
          {slot.preReservedBy && (
            <div className="text-xs">
              <p>
                Por: <strong>{slot.preReservedBy.name}</strong>
              </p>
              <p>
                Email: <strong>{slot.preReservedBy.email}</strong>
              </p>
            </div>
          )}
        </>
      )}

      {variant === 'pre_reserved' && (
        <>
          <p className="lg:text-warning text-primary font-semibold">
            Pré-reservado
          </p>
          {slot.preReservedBy && (
            <div className="text-xs">
              <p>
                Por: <strong>{slot.preReservedBy.name}</strong>
              </p>
              <p>
                Email: <strong>{slot.preReservedBy.email}</strong>
              </p>
            </div>
          )}
          {slot.preReservedUntil && (
            <p className="mt-2 text-xs">
              Até:{' '}
              {format(new Date(slot.preReservedUntil), 'dd/MM/yyyy - HH:mm', {
                locale: ptBR,
              })}
            </p>
          )}
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Tooltip para desktop */}
      <div className="hidden lg:block">
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
            {variant !== 'available' && (
              <TooltipContent>
                <SlotContent />
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Sheet para mobile/tablet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
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
          </SheetTrigger>
          {variant !== 'available' && (
            <SheetContent
              side="bottom"
              className="h-auto max-h-[80vh] py-4 md:p-10"
            >
              <SheetHeader className="sr-only">
                <SheetTitle className="text-center">
                  Detalhes da reserva de sala
                </SheetTitle>
                <SheetDescription>
                  Detalhes da reserva de sala para o horário selecionado e
                  aplicação mobile.
                </SheetDescription>
              </SheetHeader>

              <div className="p-4">
                <SlotContent />
              </div>

              <SheetFooter className="flex-col gap-3 sm:flex-row">
                <SheetClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Fechar
                  </Button>
                </SheetClose>

                {variant === 'reserved-adm' && (
                  <Button
                    onClick={handleCancelReservation}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Cancelar Reserva
                  </Button>
                )}
              </SheetFooter>
            </SheetContent>
          )}
        </Sheet>
      </div>
    </>
  )
}
