'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/utils/mergeClassNames'

// Schema de validação
const participantsSchema = z.object({
  participants: z.array(z.string().email('Email inválido')),
})

type FormData = z.infer<typeof participantsSchema>

interface InviteParticipantsFormProps {
  onSubmit?: (data: FormData) => void
  className?: string
}

export function InviteParticipantsForm({
  onSubmit,
  className,
}: InviteParticipantsFormProps) {
  const [participantInput, setParticipantInput] = useState<string>('')
  const [inputError, setInputError] = useState<string | null>(null)

  // React Hook Form
  const form = useForm<FormData>({
    resolver: zodResolver(participantsSchema),
    defaultValues: {
      participants: [],
    },
  })

  // Observando o valor atual dos participantes
  const participants = form.watch('participants')

  // Validação de email simples
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddParticipant = () => {
    const trimmedEmail = participantInput.trim()
    if (!trimmedEmail) return

    // Valida o email
    if (!isValidEmail(trimmedEmail)) {
      setInputError('Email inválido')
      return
    }

    // Verifica se o email já existe na lista
    if (participants.includes(trimmedEmail)) {
      setInputError('Este participante já foi adicionado')
      return
    }

    // Adiciona o novo participante e limpa o input
    form.setValue('participants', [...participants, trimmedEmail])
    setParticipantInput('')
    setInputError(null)
  }

  const handleRemoveParticipant = (index: number) => {
    form.setValue(
      'participants',
      participants.filter((_, i) => i !== index),
    )
  }

  function onFormSubmit(data: FormData) {
    console.log('Participantes convidados:', data.participants)
    if (onSubmit) {
      onSubmit(data)
    }
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
                <FormLabel>Colaboradores BBZ</FormLabel>

                {/* Input + botão */}
                <div className="flex flex-col gap-2 md:flex-row">
                  <FormControl>
                    <Input
                      placeholder="Digite o nome ou e-mail do colaborador"
                      value={participantInput}
                      onChange={(e) => {
                        setParticipantInput(e.target.value)
                        setInputError(null)
                      }}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), handleAddParticipant())
                      }
                      className="h-9 min-h-[36px]"
                    />
                  </FormControl>
                  <Button
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={handleAddParticipant}
                    className="h-9"
                  >
                    Adicionar
                  </Button>
                </div>

                {/* Mensagem de erro do input */}
                {inputError && (
                  <p className="text-destructive text-sm">{inputError}</p>
                )}

                {/* Lista de participantes adicionados */}
                <div
                  className={cn(
                    'flex flex-wrap gap-3',
                    participants.length > 0 && 'my-5 md:mt-2.5',
                  )}
                >
                  {participants.map((email, idx) => (
                    <Badge
                      key={idx}
                      className="bg-accent text-accent-foreground hover:bg-accent/80 relative h-8 overflow-visible rounded-full px-4"
                    >
                      {email}
                      <div
                        className="bg-destructive text-destructive-foreground border-destructive-foreground absolute top-[-10px] right-[-10px] cursor-pointer rounded-full border-1 p-0.5"
                        onClick={() => handleRemoveParticipant(idx)}
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

                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Confirmar agendamento
          </Button>
        </form>
      </Form>
    </div>
  )
}
