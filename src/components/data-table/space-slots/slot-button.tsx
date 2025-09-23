'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { UserMe200User } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import {
  useCancelSpaceReservation,
  useCloseSpaceReservation,
} from '@/api/endpoints/reservation/reservation'
import {
  useCreateSpaceSlotPreReserve,
  useDeleteSpaceSlotPreReserve,
} from '@/api/endpoints/space-slot/space-slot'
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
import { Textarea } from '@/components/ui/textarea'
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
import { SlotCell } from './slot-table-data-utils'

interface SlotButtonProps {
  date: string
  time: string
  slot: SlotCell
  user: UserMe200User | null
  onDataChange?: () => void
  spaceId?: string
  /**
   * Duração do slot em horas. Default: 1 (room). Para workstation, use 6 (manhã) ou 7 (tarde).
   */
  slotDurationHours?: number
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
  spaceId,
  slotDurationHours = 1,
}: SlotButtonProps) {
  // Estado para controlar a abertura do Dialog e Sheet
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Estado para controlar o motivo do cancelamento
  const [cancelReason, setCancelReason] = useState('')

  // Função para verificar se o usuário é admin ou dev
  const isAdminOrDev = () => {
    return user?.role === 'admin' || user?.role === 'dev'
  }

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
    useDeleteSpaceSlotPreReserve(slot.id || '', {
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
    useCreateSpaceSlotPreReserve({
      swr: {
        onSuccess: (response) => {
          if (response.status === 201) {
            showToast({
              message: 'Pré-reserva criada com sucesso!',
              variant: 'success',
              duration: 3000,
            })

            if (onDataChange) {
              onDataChange()
            }
          } else if (response.status === 409) {
            // Erro de conflito, slot já reservado ou pré-reservado
            showToast({
              message: 'Este horário já está reservado ou pré-reservado',
              variant: 'warning',
              duration: 4000,
            })
          } else if (
            response.status === 400 &&
            response.data.message ===
              'Não é possível pré-reservar para horários que já começaram'
          ) {
            // Erro de horário passado
            showToast({
              message: 'Não é possível reservar horários que já passaram',
              variant: 'warning',
              duration: 5000,
            })
          } else if (
            response.status === 400 &&
            response.data.message.includes(
              'Não é possível reservar estações de trabalho com mais de 14 dias de antecedência',
            )
          ) {
            // Erro específico para workstations com limite de 14 dias
            showToast({
              message:
                'Não é possível reservar estações de trabalho com mais de 14 dias de antecedência',
              variant: 'warning',
              duration: 5000,
            })
          } else if (
            response.status === 400 &&
            response.data.message.includes(
              'Não é possível fazer reservas para mais de',
            )
          ) {
            // Erro de data muito no futuro
            showToast({
              message:
                'Não é possível fazer reservas para datas muito distantes',
              variant: 'warning',
              duration: 5000,
            })
          } else {
            // Outros erros específicos da API
            showToast({
              message: 'Não foi possível fazer a pré-reserva',
              variant: 'warning',
              duration: 4000,
            })
          }

          setIsDialogOpen(false)
          setIsSheetOpen(false)
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

  // Hook para cancelar uma reserva
  const { trigger: cancelReservation, isMutating: isCancelingReservation } =
    useCancelSpaceReservation({
      swr: {
        onSuccess: (response) => {
          if (response.status === 200) {
            showToast({
              message: 'Reserva cancelada com sucesso!',
              variant: 'success',
              duration: 3000,
            })

            if (onDataChange) {
              onDataChange()
            }

            revalidateTags(['cancel-reservation'])
          } else {
            // Outros erros específicos da API
            showToast({
              message: 'Não foi possível cancelar a reserva',
              variant: 'warning',
              duration: 4000,
            })
          }

          setIsDialogOpen(false)
          setIsSheetOpen(false)
        },
        onError: (error) => {
          console.error('💥 Erro ao cancelar reserva:', error)

          showToast({
            message: 'Erro ao cancelar a reserva. Tente novamente.',
            variant: 'error',
            duration: 3000,
          })

          // Fechar o Sheet e Dialog mesmo em caso de erro
          setIsDialogOpen(false)
          setIsSheetOpen(false)
        },
      },
    })

  // Hook para encerrar uma reserva
  const { trigger: closeReservation, isMutating: isClosingReservation } =
    useCloseSpaceReservation({
      swr: {
        onSuccess: (response) => {
          if (response.status === 200) {
            showToast({
              message: 'Reserva encerrada com sucesso!',
              variant: 'success',
              duration: 3000,
            })

            if (onDataChange) {
              onDataChange()
            }

            revalidateTags(['close-reservation'])
          } else if (
            response.status === 400 &&
            response.data?.message?.includes(
              'Workstations só podem ser fechadas com 24h de antecedência',
            )
          ) {
            // Erro específico para workstations com menos de 24h de antecedência
            showToast({
              message:
                'Workstations só podem ser fechadas com 24 horas de antecedência',
              variant: 'warning',
              duration: 5000,
            })
          } else {
            // Outros erros específicos da API
            showToast({
              message: 'Não foi possível encerrar a reserva',
              variant: 'warning',
              duration: 4000,
            })
          }

          setIsDialogOpen(false)
          setIsSheetOpen(false)
        },
        onError: (error) => {
          console.error('💥 Erro ao encerrar reserva:', error)

          showToast({
            message: 'Erro ao encerrar a reserva. Tente novamente.',
            variant: 'error',
            duration: 3000,
          })

          // Fechar o Sheet e Dialog mesmo em caso de erro
          setIsDialogOpen(false)
          setIsSheetOpen(false)
        },
      },
    })

  function handleCancelReservation() {
    if (!cancelReason || cancelReason.trim().length < 3) {
      showToast({
        message:
          'Informe um motivo válido para o cancelamento (mínimo 3 caracteres)',
        variant: 'warning',
        duration: 3000,
      })
      return
    }

    if (!slot.id) {
      showToast({
        message: 'Erro: Não foi possível identificar a reserva',
        variant: 'error',
        duration: 3000,
      })

      setIsDialogOpen(false)
      setIsSheetOpen(false)
      return
    }

    cancelReservation({
      spaceSlotIds: [slot.id], // Usando array com um único elemento
      cancelReason: cancelReason.trim(),
    })
    // Dialog e Sheet serão fechados no callback de sucesso/erro
  }

  function handleEndReservation() {
    if (!slot.id) {
      showToast({
        message: 'Erro: Não foi possível identificar a reserva',
        variant: 'error',
        duration: 3000,
      })

      setIsDialogOpen(false)
      setIsSheetOpen(false)
      return
    }

    closeReservation({ spaceSlotIds: [slot.id] })
    // Dialog e Sheet serão fechados no callback de sucesso/erro
  }

  function handleDeletePreReservation() {
    if (slot.id) {
      deletePreReserve()
      // O Sheet será fechado no callback de sucesso
    } else {
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
    if (!spaceId) {
      showToast({
        message: 'ID da sala não disponível',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    // A data está no formato 'YYYY-MM-DD' e o tempo no formato 'HH:MM'
    const slotStart = `${date}T${time}:00-03:00` // Adiciona segundos e timezone

    // Calcula o horário de término (slotDurationHours depois)
    const slotStartDate = parseISO(slotStart)
    const slotEndDate = new Date(slotStartDate)
    slotEndDate.setHours(slotEndDate.getHours() + slotDurationHours)

    // Formata o slotEnd com o mesmo padrão do slotStart (com timezone -03:00)
    const slotEnd = `${date}T${format(slotEndDate, 'HH:mm:ss')}-03:00`

    // Dados da pré-reserva
    const preReserveData = {
      spaceId,
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
  const SlotContent = () => {
    // Verificar se a pré-reserva está vencida
    const isPreReserveExpired =
      variant === 'pre_reserved' &&
      slot.preReservedUntil &&
      new Date(slot.preReservedUntil) < new Date()

    // Calcular horário final do slot
    const slotStartDate = parseISO(`${date}T${time}:00`)
    const slotEndDate = new Date(slotStartDate)
    slotEndDate.setHours(slotEndDate.getHours() + slotDurationHours)

    return (
      <div className="space-y-4 lg:space-y-2">
        <p className="text-primary lg:text-primary-foreground text-xl font-semibold lg:text-xs">
          {format(slotStartDate, 'dd/MM/yyyy - HH:mm', {
            locale: ptBR,
          })}{' '}
          até {format(slotEndDate, 'HH:mm', { locale: ptBR })}
        </p>

        {variant !== 'available' && (
          <>
            <p className={CONTENT_CONFIG[variant].titleClass}>
              {CONTENT_CONFIG[variant].title}
            </p>
            {CONTENT_CONFIG[variant].content()}

            {/* Mostrar aviso de pré-reserva vencida */}
            {isPreReserveExpired && (
              <p className="text-destructive mt-4 max-w-[300px] text-xs font-medium italic">
                Esta pré-reserva está vencida e será apagada no próximo reload.
              </p>
            )}
          </>
        )}
      </div>
    )
  }

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
                      new Date(`${date}T${time}:00`).getHours() +
                        slotDurationHours,
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

      {/* Dialog para encerrar reserva do usuário somente desktop */}
      {variant === 'reserved-my' && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Encerrar sua reserva</DialogTitle>
              <DialogDescription>
                Você está prestes a encerrar sua reserva. Deseja confirmar?
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <Text variant="title-16-18-700" className="mb-2">
                Detalhes da sua reserva:
              </Text>
              <Text variant="body-16-16-400">
                {format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })} de{' '}
                {time} às{' '}
                {format(
                  new Date(
                    new Date(`${date}T${time}:00`).setHours(
                      new Date(`${date}T${time}:00`).getHours() +
                        slotDurationHours,
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
                disabled={isClosingReservation}
                onClick={handleEndReservation}
                variant="destructive"
              >
                {isClosingReservation ? 'Encerrando...' : 'Encerrar reserva'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para cancelar reserva de outro usuário - apenas para visualização desktop e usuários admin/dev */}
      {variant === 'reserved-adm' && isAdminOrDev() && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar reserva de outro usuário</DialogTitle>
              <DialogDescription>
                Como administrador, você pode cancelar a reserva de outro
                usuário. Informe o motivo do cancelamento.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <Text variant="title-16-18-700" className="mb-2">
                Detalhes da reserva:
              </Text>
              <Text variant="body-16-16-400">
                {format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })} de{' '}
                {time} às{' '}
                {format(
                  new Date(
                    new Date(`${date}T${time}:00`).setHours(
                      new Date(`${date}T${time}:00`).getHours() +
                        slotDurationHours,
                    ),
                  ),
                  'HH:mm',
                  { locale: ptBR },
                )}
              </Text>
              <Text variant="body-16-16-400" className="mt-1">
                Reservado por: {slot.user?.name || 'Usuário desconhecido'}
              </Text>
            </div>

            <div className="my-4">
              <Text variant="title-16-18-700" className="mb-2">
                Motivo do cancelamento:
              </Text>
              <Textarea
                placeholder="Informe o motivo do cancelamento (obrigatório, mínimo 3 e máximo 500 caracteres)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={500}
                className="resize-none"
              />
              <Text
                variant="body-16-16-400"
                className="text-muted-foreground mt-1"
              >
                {cancelReason.length}/500 caracteres
              </Text>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setCancelReason('')}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                disabled={
                  isCancelingReservation || cancelReason.trim().length < 3
                }
                onClick={handleCancelReservation}
                variant="destructive"
              >
                {isCancelingReservation ? 'Cancelando...' : 'Cancelar reserva'}
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
                  // No desktop, abrir Dialog para slots 'available', 'reserved-my' ou 'reserved-adm' (para admin/dev)
                  if (
                    variant === 'available' ||
                    variant === 'reserved-my' ||
                    (variant === 'reserved-adm' && isAdminOrDev())
                  ) {
                    // Resetar o motivo do cancelamento ao abrir o dialog
                    if (variant === 'reserved-adm') {
                      setCancelReason('')
                    }
                    setIsDialogOpen(true)
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
                // No mobile, sempre usar o Sheet, nunca o Dialog
                // Resetar o motivo do cancelamento ao abrir o sheet para variante 'reserved-adm'
                if (variant === 'reserved-adm') {
                  setCancelReason('')
                }
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
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setCancelReason('')}
                >
                  Fechar
                </Button>
              </SheetClose>

              {variant === 'reserved-adm' && isAdminOrDev() && (
                <>
                  <div className="my-4">
                    <Text variant="title-16-18-700" className="mb-2">
                      Motivo do cancelamento:
                    </Text>
                    <Textarea
                      placeholder="Informe o motivo do cancelamento (obrigatório, mínimo 3 e máximo 500 caracteres)"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      maxLength={500}
                      className="resize-none"
                    />
                    <Text
                      variant="body-16-16-400"
                      className="text-muted-foreground mt-1"
                    >
                      {cancelReason.length}/500 caracteres
                    </Text>
                  </div>
                  <Button
                    onClick={handleCancelReservation}
                    variant="destructive"
                    className="w-full sm:w-auto"
                    disabled={
                      isCancelingReservation || cancelReason.trim().length < 3
                    }
                  >
                    {isCancelingReservation
                      ? 'Cancelando...'
                      : 'Cancelar Reserva'}
                  </Button>
                </>
              )}

              {variant === 'reserved-my' && (
                <Button
                  onClick={handleEndReservation}
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={isClosingReservation}
                >
                  {deletingPreReserve ? 'Encerrando...' : 'Encerrar Reserva'}
                </Button>
              )}

              {variant === 'pre_reserved' && slot.user?.id === user?.id && (
                <Button
                  onClick={handleDeletePreReservation}
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={deletingPreReserve}
                >
                  {deletingPreReserve ? 'Deletando...' : 'Deletar Pré-reserva'}
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
