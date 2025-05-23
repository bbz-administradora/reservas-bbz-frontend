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

// Define os tipos de variantes de slot possíveis
type SlotVariant =
  | 'reserved-adm'
  | 'reserved-user'
  | 'reserved-my'
  | 'pre_reserved'
  | 'available'

// Define configurações para cada variante de slot
const SLOT_CONFIGS = {
  'reserved-my': {
    icon: <CalendarCheck2Icon className="text-secondary-foreground size-6" />,
    description: 'Esta é sua reserva',
    buttonClass:
      'bg-secondary/30 text-secondary-foreground hover:bg-secondary/50',
  },
  'reserved-adm': {
    icon: (
      <CalendarX2Icon className="text-destructive size-6 transition-colors" />
    ),
    description: 'Reservado por outro usuário (cancelável como admin)',
    buttonClass:
      'hover:bg-destructive/20 text-destructive hover:text-destructive',
  },
  'reserved-user': {
    icon: <CalendarX2Icon className="text-muted size-6" />,
    description: 'Indisponível - reservado por outro usuário',
    buttonClass: 'text-muted hover:bg-muted/40 hover:text-muted bg-transparent',
  },
  pre_reserved: {
    icon: <CalendarClockIcon className="size-6 text-yellow-500" />,
    description: 'Pré-reservado',
    buttonClass:
      'bg-warning/20 text-primary hover:bg-warning/40 hover:text-primary',
  },
  available: {
    icon: (
      <CalendarIcon className="text-primary group-hover:text-primary-foreground size-6 transition-colors" />
    ),
    description: 'Disponível para reserva',
    buttonClass: 'text-primary hover:bg-primary',
  },
}

export function SlotButton({ date, time, slot, user }: SlotButtonProps) {
  // Determina a variante do slot com base nas condições
  const getSlotVariant = (): SlotVariant => {
    switch (slot.status) {
      case 'reserved':
        // Verificar se o slot é do usuário atual: apenas o user agora
        const slotUserId = slot.user?.id
        if (user && slotUserId && slotUserId === user.id) {
          return 'reserved-my'
        } else if (user && user.role !== 'user') {
          return 'reserved-adm'
        } else {
          return 'reserved-user'
        }
      case 'pre_reserved':
        return 'pre_reserved'
      default:
        return 'available'
    }
  }

  // Obtém a variante atual do slot
  const variant = getSlotVariant()
  // Obtém o ícone associado a esta variante
  const icon = SLOT_CONFIGS[variant].icon

  function handleClick() {
    console.log(`Slot clicado: ${date} ${time}`)
    console.log(`Status: ${slot.status}`)
    console.log(SLOT_CONFIGS[variant].description)

    if (variant === 'pre_reserved' && slot.preReservedUntil) {
      console.log(`Até: ${slot.preReservedUntil}`)
    }
  }

  function handleCancelReservation() {
    console.log(`Cancelando reserva: ${date} ${time}`)
    // Usar apenas user agora
    const reservedBy = slot.user
    console.log(`Dados da reserva:`, reservedBy)
  }

  function handleCancelPreReservation() {
    console.log(`Cancelando pré-reserva: ${date} ${time}`)
    const reservedBy = slot.user
    console.log(`Dados da pré-reserva:`, reservedBy)
    console.log(`Data limite da pré-reserva:`, slot.preReservedUntil)
  }

  // Definição dos conteúdos específicos para cada variante
  const CONTENT_CONFIG = {
    'reserved-my': {
      title: 'Sua reserva',
      titleClass: 'lg:text-secondary text-primary font-semibold lg:font-normal',
      content: () => {
        // Para 'reserved-my', usamos o usuário atual
        return (
          user && (
            <div className="text-xs">
              <p>
                Nome: <strong>{user.name}</strong>
              </p>
              <p>
                Email: <strong>{user.email}</strong>
              </p>
            </div>
          )
        )
      },
    },
    'reserved-adm': {
      title: 'Reservado (cancelável)',
      titleClass:
        'text-primary lg:text-destructive font-semibold lg:font-normal',
      content: () => {
        // Usar apenas user agora
        const reservedBy = slot.user
        return reservedBy ? (
          <div className="text-xs">
            <p>Por: {reservedBy.name}</p>
            <p>Email: {reservedBy.email}</p>
            <p className="mt-4 text-xs italic lg:mt-2">
              Como admin, você pode cancelar esta reserva
            </p>
          </div>
        ) : null
      },
    },
    'reserved-user': {
      title: 'Reservado',
      titleClass:
        'text-primary lg:text-foreground font-semibold lg:font-normal',
      content: () => {
        // Usar apenas user agora
        const reservedBy = slot.user
        return reservedBy ? (
          <div className="text-xs">
            <p>
              Por: <strong>{reservedBy.name}</strong>
            </p>
            <p>
              Email: <strong>{reservedBy.email}</strong>
            </p>
          </div>
        ) : null
      },
    },
    pre_reserved: {
      title: 'Pré-reservado',
      titleClass: 'text-primary font-semibold lg:text-yellow-500',
      content: () => {
        // Usar apenas user agora
        const reservedBy = slot.user
        return (
          <>
            {reservedBy && (
              <div className="text-xs">
                <p>
                  Por: <strong>{reservedBy.name}</strong>
                </p>
                <p>
                  Email: <strong>{reservedBy.email}</strong>
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
        )
      },
    },
    available: {
      title: '',
      titleClass: '',
      content: () => null,
    },
  }

  // Componente de conteúdo reutilizado tanto para tooltip quanto para sheet
  const SlotContent = () => (
    <div className="space-y-4 lg:space-y-2">
      <p className="text-primary lg:text-primary-foreground text-xl font-semibold lg:text-xs">
        {format(new Date(date + 'T' + time), 'dd/MM/yyyy - HH:mm', {
          locale: ptBR,
        })}
      </p>

      {variant !== 'available' && (
        <>
          <p className={CONTENT_CONFIG[variant].titleClass}>
            {CONTENT_CONFIG[variant].title}
          </p>
          {CONTENT_CONFIG[variant].content()}
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
                  SLOT_CONFIGS[variant].buttonClass,
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
              className={cn('group size-14', SLOT_CONFIGS[variant].buttonClass)}
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

                {variant === 'pre_reserved' && slot.user?.id === user?.id && (
                  <Button
                    onClick={handleCancelPreReservation}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Cancelar Pré-reserva
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
