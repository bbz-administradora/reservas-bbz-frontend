'use client'

import { UserMe201User } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import {
  useCreateRoomSlotPreReserve,
  useDeleteRoomSlotPreReserve,
} from '@/api/endpoints/room-slot/room-slot'
import { showToast } from '@/components/ShowToast'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarCheck2Icon,
  CalendarClockIcon,
  CalendarIcon,
  CalendarX2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { SlotCell } from './slotTableDataUtils'

interface SlotButtonProps {
  date: string
  time: string
  slot: SlotCell
  user: UserMe201User | null
  onDataChange?: () => void
  roomId?: string
}

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

export function SlotButton({
  date,
  time,
  slot,
  user,
  onDataChange,
  roomId,
}: SlotButtonProps) {
  // Estado para controlar a abertura do Dialog e Sheet
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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

  // Hook para deletar a pré-reserva
  const { trigger: deletePreReserve, isMutating: deletingPreReserve } =
    useDeleteRoomSlotPreReserve(slot.id || '', {
      swr: {
        onSuccess: () => {
          showToast({
            message: 'Pré-reserva deletada com sucesso!',
            variant: 'success',
            duration: 3000,
          })

          setIsSheetOpen(false)

          if (onDataChange) {
            onDataChange()
          }
        },
        onError: (error) => {
          console.error('💥 Erro ao deletar pré-reserva:', error)
          showToast({
            message: 'Erro ao deletar a pré-reserva. Tente novamente.',
            variant: 'error',
            duration: 3000,
          })

          // Fechar o Sheet mesmo em caso de erro
          setIsSheetOpen(false)
        },
      },
    })

  // Hook para criar uma pré-reserva
  const { trigger: createPreReserve, isMutating: isCreatingPreReserve } =
    useCreateRoomSlotPreReserve({
      swr: {
        onSuccess: (response) => {
          // Verificar se a resposta contém um erro
          // (API retorna erros como objeto com name, message, etc.)
          if (
            response &&
            response.data &&
            typeof response.data === 'object' &&
            'name' in response.data
          ) {
            const errorData = response.data as any // Type assertion para o formato de erro

            // Mensagens personalizadas com base no conteúdo do erro
            if (
              errorData.message &&
              errorData.message.includes('já começaram')
            ) {
              // Erro de horário passado
              showToast({
                message: 'Não é possível reservar horários que já passaram',
                variant: 'warning',
                duration: 5000,
              })
            } else if (
              errorData.message &&
              errorData.message.includes('mais de')
            ) {
              // Erro de data muito no futuro
              showToast({
                message:
                  'Não é possível fazer reservas para datas muito distantes',
                variant: 'warning',
                duration: 5000,
              })
            } else if (
              errorData.message &&
              errorData.message.includes('já reservado')
            ) {
              // Erro de conflito de horário
              showToast({
                message: 'Este horário já está reservado',
                variant: 'warning',
                duration: 4000,
              })
            } else {
              // Outros erros específicos da API
              showToast({
                message:
                  errorData.message || 'Não foi possível fazer a pré-reserva',
                variant: 'warning',
                duration: 4000,
              })
            }
          } else if (
            response &&
            response.data &&
            typeof response.data === 'object' &&
            'message' in response.data
          ) {
            // Sucesso verdadeiro com mensagem da API
            showToast({
              message: response.data.message as string,
              variant: 'success',
              duration: 3000,
            })
          } else {
            // Resposta desconhecida
            showToast({
              message: 'Pré-reserva criada com sucesso!',
              variant: 'success',
              duration: 3000,
            })
          }

          setIsDialogOpen(false)
          setIsSheetOpen(false)

          if (onDataChange) {
            onDataChange()
          }
        },
        onError: (error) => {
          console.error('💥 Erro ao criar pré-reserva:', error)

          showToast({
            message: 'Erro ao criar a pré-reserva. Tente novamente.',
            variant: 'error',
            duration: 3000,
          })

          // Fechar o Sheet e Dialog mesmo em caso de erro
          setIsDialogOpen(false)
          setIsSheetOpen(false)
        },
      },
    })

  function handleClick() {
    console.log(`Slot clicado: ${date} ${time}`)
    console.log(`Status: ${slot.status}`)
    console.log(SLOT_CONFIGS[variant].description)

    if (variant === 'pre_reserved' && slot.preReservedUntil) {
      console.log(`Até: ${slot.preReservedUntil}`)
    }

    // Se for um slot disponível, o diálogo será aberto via Dialog.Root open state
  }

  function handleCancelReservation() {
    console.log(`Cancelando reserva: ${date} ${time}`)
    // Usar apenas user agora
    const reservedBy = slot.user
    console.log(`Dados da reserva:`, reservedBy)

    // Fechar o Sheet após a ação
    setIsSheetOpen(false)
  }

  function handleDeletePreReservation() {
    if (slot.id) {
      deletePreReserve()
      // O Sheet será fechado no callback de sucesso
    } else {
      console.error('💥 ID do slot não encontrado')
      showToast({
        message: 'Erro: Não foi possível identificar a pré-reserva',
        variant: 'error',
        duration: 3000,
      })
      // Fechar o Sheet mesmo em caso de erro
      setIsSheetOpen(false)
    }
  }

  function handleCreatePreReservation() {
    if (!roomId) {
      showToast({
        message: 'ID da sala não disponível',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    // A data está no formato 'YYYY-MM-DD' e o tempo no formato 'HH:MM'
    const slotStart = `${date}T${time}:00-03:00` // Adiciona segundos e timezone

    // Calcula o horário de término (1 hora depois)
    const slotStartDate = parseISO(slotStart)
    const slotEndDate = new Date(slotStartDate)
    slotEndDate.setHours(slotEndDate.getHours() + 1)

    // Formata o slotEnd com o mesmo padrão do slotStart (com timezone -03:00)
    const slotEnd = `${date}T${format(slotEndDate, 'HH:mm:ss')}-03:00`

    // Dados da pré-reserva
    const preReserveData = {
      roomId: roomId,
      slotStart,
      slotEnd,
    }

    createPreReserve(preReserveData)
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
      {/* Dialog para confirmar pré-reserva somente desktop */}
      {variant === 'available' && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar pré-reserva</DialogTitle>
              <DialogDescription>
                Você está prestes a fazer uma pré-reserva. Após confirmar, você
                terá 5 minutos para finalizar a reserva.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <Text variant="title-16-18-700" className="mb-2">
                Detalhes do horário:
              </Text>
              <Text variant="body-16-16-400">
                {format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })} de{' '}
                {time} às{' '}
                {format(
                  new Date(
                    new Date(`${date}T${time}:00`).setHours(
                      new Date(`${date}T${time}:00`).getHours() + 1,
                    ),
                  ),
                  'HH:mm',
                  { locale: ptBR },
                )}
              </Text>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleCreatePreReservation}
                disabled={isCreatingPreReserve}
              >
                {isCreatingPreReserve ? 'Criando...' : 'Confirmar pré-reserva'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Tooltip para desktop */}
      <div className="hidden lg:block">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  handleClick()
                  if (variant === 'available') {
                    setIsDialogOpen(true) // Abre o diálogo para pré-reserva somente desktop
                  }
                }}
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
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                handleClick()
                setIsSheetOpen(true)
              }}
              className={cn('group size-14', SLOT_CONFIGS[variant].buttonClass)}
            >
              {icon}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-auto max-h-[80vh] py-4 md:p-10"
          >
            <SheetHeader className="sr-only">
              <SheetTitle className="text-center">
                {variant === 'available'
                  ? 'Criar pré-reserva de sala'
                  : 'Detalhes da reserva de sala'}
              </SheetTitle>
              <SheetDescription>
                {variant === 'available'
                  ? 'Pré-reserve este horário disponível'
                  : 'Detalhes da reserva de sala para o horário selecionado e aplicação mobile.'}
              </SheetDescription>
            </SheetHeader>

            <div className="p-4">
              {variant === 'available' ? (
                <div className="space-y-4">
                  <Text variant="title-18-24-700" className="mb-4">
                    Horário disponível para pré-reserva
                  </Text>
                  <Text variant="body-16-16-400">
                    {format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })} de{' '}
                    {time} às{' '}
                    {format(
                      new Date(
                        new Date(`${date}T${time}:00`).setHours(
                          new Date(`${date}T${time}:00`).getHours() + 1,
                        ),
                      ),
                      'HH:mm',
                      { locale: ptBR },
                    )}
                  </Text>
                  <Text
                    variant="body-16-16-400"
                    className="text-muted-foreground text-sm"
                  >
                    Você terá 5 minutos para finalizar a reserva após confirmar.
                  </Text>
                </div>
              ) : (
                <SlotContent />
              )}
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
                  onClick={handleDeletePreReservation}
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={deletingPreReserve}
                >
                  Deletar Pré-reserva
                </Button>
              )}

              {variant === 'available' && (
                <Button
                  onClick={() => {
                    handleCreatePreReservation()
                    // Não precisamos fechar o Sheet aqui, pois isso será feito no callback onSuccess
                  }}
                  disabled={isCreatingPreReserve}
                  className="w-full sm:w-auto"
                >
                  {isCreatingPreReserve ? 'Criando...' : 'Criar pré-reserva'}
                </Button>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
