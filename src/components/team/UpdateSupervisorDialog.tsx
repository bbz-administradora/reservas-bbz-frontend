'use client'

import { useUpdateSupervisor } from '@/api/endpoints/team/team'
import { showToast } from '@/components/ShowToast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Tipos de posição
type PositionType =
  | 'director'
  | 'supervisor'
  | 'manager'
  | 'assistant_manager'
  | 'assistant'

// Labels para cada posição
const POSITION_LABELS: Record<PositionType, string> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  assistant_manager: 'Subgerente',
  assistant: 'Assistente',
}

// Mapeamento de qual posição pode ser chefe de qual
const ALLOWED_SUPERVISORS: Record<PositionType, PositionType[]> = {
  director: [],
  supervisor: ['director'],
  manager: ['supervisor'],
  assistant_manager: ['manager'],
  assistant: ['manager', 'assistant_manager'],
}

// Schema de validação
const updateSupervisorSchema = z.object({
  supervisorEmail: z
    .string()
    .min(1, 'O email do chefe imediato é obrigatório')
    .email('Digite um email válido'),
})

type UpdateSupervisorFormData = z.infer<typeof updateSupervisorSchema>

interface UpdateSupervisorDialogProps {
  userId: string
  userName: string | null
  userEmail: string
  position: PositionType
}

export function UpdateSupervisorDialog({
  userId,
  userName,
  userEmail,
  position,
}: UpdateSupervisorDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const allowedSupervisors = ALLOWED_SUPERVISORS[position]
  const positionLabel = POSITION_LABELS[position]

  // Gera o label do chefe imediato baseado nas posições permitidas
  const supervisorLabel = allowedSupervisors
    .map((p) => POSITION_LABELS[p])
    .join(' ou ')

  const form = useForm<UpdateSupervisorFormData>({
    resolver: zodResolver(updateSupervisorSchema),
    defaultValues: {
      supervisorEmail: '',
    },
  })

  const { trigger: updateSupervisor, isMutating } = useUpdateSupervisor(
    userId,
    {
      swr: {
        onSuccess: (response) => {
          showToast({
            message: response.data.message,
            variant: 'success',
          })
          form.reset()
          setOpen(false)
          router.refresh()
        },
        onError: (error: any) => {
          const errorMessage = error?.message || 'Erro ao atualizar supervisor'
          const errorAction = error?.action || 'Tente novamente mais tarde'

          showToast({
            message: `${errorMessage}. ${errorAction}`,
            variant: 'error',
          })
        },
      },
    },
  )

  function onSubmit(data: UpdateSupervisorFormData) {
    updateSupervisor({
      supervisorEmail: data.supervisorEmail,
    })
  }

  // Não mostrar o botão para diretor (não pode ter supervisor)
  if (position === 'director') {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-primary/10 hover:text-primary"
          title="Nomear Superior"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nomear Superior</DialogTitle>
          <DialogDescription>
            Defina o chefe imediato de <strong>{userName || userEmail}</strong>{' '}
            ({positionLabel}).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supervisorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do Chefe Imediato</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="chefe@exemplo.com"
                      disabled={isMutating}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    O chefe imediato de um {positionLabel} deve ser um{' '}
                    {supervisorLabel}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isMutating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
