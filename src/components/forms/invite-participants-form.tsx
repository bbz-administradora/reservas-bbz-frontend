'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, TriangleAlertIcon, X } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  GetRoomSlotAvailability200SlotsItem,
  UserMe201User,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useGetRoomSlotAvailability } from '@/api/endpoints/room-slot/room-slot'
import { showToast } from '@/components/ShowToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { emailSchema } from '@/schema'
import { cn } from '@/utils/mergeClassNames'

// Schema de validação
const participantsSchema = z.object({
  participants: z.array(emailSchema),
  needsWaitress: z.boolean(),
})

// Definição do tipo do formulário
type FormData = z.infer<typeof participantsSchema>

interface InviteParticipantsFormProps {
  className?: string
  roomId: string // ID da sala
  startDate: string // Data inicial para buscar os slots
  endDate: string // Data final para buscar os slots
  user: UserMe201User | null // Dados do usuário logado
}

export function InviteParticipantsForm({
  className,
  roomId,
  startDate,
  endDate,
  user = null,
}: InviteParticipantsFormProps) {
  const [internalInput, setInternalInput] = useState<string>('')
  const [externalInput, setExternalInput] = useState<string>('')
  const [internalError, setInternalError] = useState<string | null>(null)
  const [externalError, setExternalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Lista local para participantes internos e externos
  const [internalParticipants, setInternalParticipants] = useState<string[]>([])
  const [externalParticipants, setExternalParticipants] = useState<string[]>([])

  // Buscar dados dos slots da sala apenas se tiver roomId
  const { data: roomSlotData, mutate: getRoomSlotData } =
    useGetRoomSlotAvailability(roomId, { startDate, endDate })

  const form = useForm<FormData>({
    resolver: zodResolver(participantsSchema),
    defaultValues: {
      participants: [],
      needsWaitress: false,
    },
  })

  const handleAddInternalParticipant = () => {
    const trimmedEmail = internalInput.trim()
    if (!trimmedEmail) return

    // Valida o email usando o emailSchema
    try {
      emailSchema.parse(trimmedEmail)
    } catch (error) {
      if (error instanceof z.ZodError) {
        setInternalError(error.errors[0].message)
      } else {
        setInternalError('E-mail inválido.')
      }
      return
    }

    // Verifica se o email já existe em alguma das listas
    if (
      internalParticipants.includes(trimmedEmail) ||
      externalParticipants.includes(trimmedEmail)
    ) {
      setInternalError('Este participante já foi adicionado')
      return
    }

    // Verifica se já atingiu o limite de participantes (9 no total, considerando que o usuário logado é o décimo)
    if (internalParticipants.length + externalParticipants.length >= 9) {
      showToast({
        message:
          'Você atingiu o limite máximo de 10 convidados (incluindo você como organizador).',
        variant: 'warning',
        duration: 5000,
      })
      return
    }

    // Adiciona o novo participante interno e limpa o input
    const newInternalList = [...internalParticipants, trimmedEmail]
    setInternalParticipants(newInternalList)
    setInternalInput('')
    setInternalError(null)

    // Atualiza o formulário
    form.setValue('participants', [...newInternalList, ...externalParticipants])
  }

  const handleAddExternalParticipant = () => {
    const trimmedEmail = externalInput.trim()
    if (!trimmedEmail) return

    // Valida o email usando o emailSchema
    try {
      emailSchema.parse(trimmedEmail)
    } catch (error) {
      if (error instanceof z.ZodError) {
        setExternalError(error.errors[0].message)
      } else {
        setExternalError('E-mail inválido.')
      }
      return
    }

    // Verifica se o email já existe em alguma das listas
    if (
      internalParticipants.includes(trimmedEmail) ||
      externalParticipants.includes(trimmedEmail)
    ) {
      setExternalError('Este participante já foi adicionado')
      return
    }

    // Verifica se já atingiu o limite de participantes (9 no total, considerando que o usuário logado é o décimo)
    if (internalParticipants.length + externalParticipants.length >= 9) {
      showToast({
        message:
          'Você atingiu o limite máximo de 10 convidados (incluindo você como organizador).',
        variant: 'warning',
        duration: 5000,
      })
      return
    }

    // Adiciona o novo participante externo e limpa o input
    const newExternalList = [...externalParticipants, trimmedEmail]
    setExternalParticipants(newExternalList)
    setExternalInput('')
    setExternalError(null)

    // Atualiza o formulário
    form.setValue('participants', [...internalParticipants, ...newExternalList])
  }

  const handleRemoveInternalParticipant = (index: number) => {
    const newList = internalParticipants.filter((_, i) => i !== index)
    setInternalParticipants(newList)
    form.setValue('participants', [...newList, ...externalParticipants])
  }

  const handleRemoveExternalParticipant = (index: number) => {
    const newList = externalParticipants.filter((_, i) => i !== index)
    setExternalParticipants(newList)
    form.setValue('participants', [...internalParticipants, ...newList])
  }

  const onFormSubmit: SubmitHandler<FormData> = async (data) => {
    // Ativar estado de loading
    setIsSubmitting(true)

    console.log('😎 Email usuário logado', user?.email)
    console.log('🌈Participantes convidados:', data.participants)
    console.log('🍵Precisa de copeira?', data.needsWaitress)

    await getRoomSlotData() // Forçar revalidação dos dados dos slots

    // Verificar se temos dados de slots, roomId e o usuário está logado
    if (roomId && roomSlotData?.data && user) {
      // Filtrar apenas os slots que pertencem ao usuário atual e que estão em pré-reserva
      const userPreReservedSlots = roomSlotData.data.slots.filter(
        (slot: GetRoomSlotAvailability200SlotsItem) =>
          slot.status === 'pre_reserved' && slot.user.id === user.id,
      )

      // Mostrar quantos slots encontramos
      console.log(
        `🟢Encontrados ${userPreReservedSlots.length} slots pré-reservados para o usuário.`,
      )

      // Para cada slot pré-reservado, faríamos a chamada para confirmação
      if (userPreReservedSlots.length > 0) {
        try {
          // Usar Promise.all para processar todas as confirmações em paralelo
          await Promise.all(
            userPreReservedSlots.map(async (slot) => {
              console.log('🔄 Slot que seria confirmado:', {
                id: slot.id,
                start: slot.slotStart,
                end: slot.slotEnd,
                status: slot.status,
                room: roomId,
              })

              // TODO: Implementar a chamada de API para converter pré-reserva em reserva
              // Exemplo de como seria com async/await:
              // await confirmRoomSlotReservation(slot.id);
            }),
          )

          // Forçar revalidação dos dados APENAS APÓS todas as operações assíncronas serem concluídas
          console.log(
            '✅ Todas as operações foram concluídas, atualizando dados...',
          )

          showToast({
            message:
              'Pré-reservas encontradas e listadas no console (implementação parcial)',
            variant: 'info',
            duration: 5000,
          })
        } catch (error) {
          console.error('❌ Erro ao processar as pré-reservas:', error)
          showToast({
            message: 'Ocorreu um erro ao processar suas pré-reservas.',
            variant: 'error',
            duration: 5000,
          })
        } finally {
          // Desativar loading independente do resultado
          setIsSubmitting(false)
        }
      } else {
        showToast({
          message: 'Nenhuma pré-reserva encontrada para confirmar',
          variant: 'warning',
          duration: 5000,
        })
        // Desativar loading quando não há pré-reservas
        setIsSubmitting(false)
      }
    } else {
      console.log('Dados dos slots, roomId ou usuário não disponíveis', {
        hasRoomId: !!roomId,
        hasRoomData: !!roomSlotData,
        hasUser: !!user,
      })
      // Desativar loading quando não conseguimos acessar os dados necessários
      setIsSubmitting(false)
    }

    // TODO: Aqui você pode enviar os dados para o servidor ou realizar outras ações
  }

  return (
    <div className={cn('w-full max-w-2xl', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="participants"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                {/* Seção de participantes internos */}
                <FormLabel>Colaboradores BBZ</FormLabel>

                {/* Input + botão para colaboradores internos */}
                <div className="flex flex-col gap-2 md:flex-row">
                  <FormControl>
                    <Input
                      placeholder="Digite o nome ou e-mail do colaborador"
                      value={internalInput}
                      onChange={(e) => {
                        setInternalInput(e.target.value)
                        setInternalError(null)
                      }}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), handleAddInternalParticipant())
                      }
                      className="h-9 min-h-[36px]"
                    />
                  </FormControl>
                  <Button
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={handleAddInternalParticipant}
                    className="h-9"
                  >
                    Adicionar
                  </Button>
                </div>

                {/* Mensagem de erro do input interno */}
                {internalError && (
                  <p className="text-destructive text-sm">{internalError}</p>
                )}

                {/* Lista de participantes internos */}
                <div
                  className={cn(
                    'flex flex-wrap gap-3',
                    internalParticipants.length > 0 && 'my-5 md:mt-2.5',
                  )}
                >
                  {internalParticipants.map((email, idx) => (
                    <Badge
                      key={idx}
                      className="bg-accent text-accent-foreground hover:bg-accent/80 relative h-8 overflow-visible rounded-full px-4"
                    >
                      {email}
                      <div
                        className="bg-destructive text-destructive-foreground border-destructive-foreground absolute top-[-10px] right-[-10px] cursor-pointer rounded-full border-1 p-0.5"
                        onClick={() => handleRemoveInternalParticipant(idx)}
                      >
                        <X size={14} />
                      </div>
                    </Badge>
                  ))}
                </div>

                <FormDescription className="text-muted-foreground text-[14px] leading-[20px] tracking-[0.25px]">
                  Adicione cada colaborador por vez, ou clique no "X" para
                  remover.
                </FormDescription>

                {/* Seção de participantes externos */}
                <FormLabel className="mt-4">
                  E-mails de convidados externos
                </FormLabel>

                {/* Input + botão para convidados externos */}
                <div className="flex flex-col gap-2 md:flex-row">
                  <FormControl>
                    <Input
                      placeholder="Digite e-mail do convidado externo"
                      value={externalInput}
                      onChange={(e) => {
                        setExternalInput(e.target.value)
                        setExternalError(null)
                      }}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), handleAddExternalParticipant())
                      }
                      className="h-9 min-h-[36px]"
                    />
                  </FormControl>
                  <Button
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={handleAddExternalParticipant}
                    className="h-9"
                  >
                    Adicionar
                  </Button>
                </div>

                {/* Mensagem de erro do input externo */}
                {externalError && (
                  <p className="text-destructive text-sm">{externalError}</p>
                )}

                {/* Lista de participantes externos */}
                <div
                  className={cn(
                    'flex flex-wrap gap-3',
                    externalParticipants.length > 0 && 'my-5 md:mt-2.5',
                  )}
                >
                  {externalParticipants.map((email, idx) => (
                    <Badge
                      key={idx}
                      className="bg-accent text-accent-foreground hover:bg-accent/80 relative h-8 overflow-visible rounded-full px-4"
                    >
                      {email}
                      <div
                        className="bg-destructive text-destructive-foreground border-destructive-foreground absolute top-[-10px] right-[-10px] cursor-pointer rounded-full border-1 p-0.5"
                        onClick={() => handleRemoveExternalParticipant(idx)}
                      >
                        <X size={14} />
                      </div>
                    </Badge>
                  ))}
                </div>

                <FormDescription className="text-muted-foreground text-[14px] leading-[20px] tracking-[0.25px]">
                  Adicione cada convidado por vez, ou clique no "X" para
                  remover.
                </FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormDescription className="text-muted-foreground bg-warning/10 flex items-center gap-2 rounded-md p-3 text-[14px] leading-[20px] tracking-[0.25px]">
            <TriangleAlertIcon />
            Máximo de 10 convidados por agendamento. Caso deseje convidar mais
            pessoas, reencaminhe o e-mail de confirmação manualmente após o
            envio.
          </FormDescription>

          <FormField
            control={form.control}
            name="needsWaitress"
            render={({ field }) => (
              <FormItem className="mt-4 flex flex-row items-center space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Necessidades adicionais:</FormLabel>
                  <FormDescription>Precisa de Copeira?</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full lg:w-min"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Confirmando o agendamento...
              </>
            ) : (
              'Confirmar agendamento'
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
