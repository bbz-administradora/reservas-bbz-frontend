'use client'

import { useCreatePosition } from '@/api/endpoints/team/team'
import { showToast } from '@/components/ShowToast'
import { Text } from '@/components/Text'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

// Posições que OBRIGATORIAMENTE precisam informar o chefe imediato
const REQUIRES_SUPERVISOR: PositionType[] = [
  'manager',
  'assistant_manager',
  'assistant',
]

// Mapeamento de qual posição pode ser chefe de qual
const ALLOWED_SUPERVISORS: Record<PositionType, PositionType[]> = {
  director: [],
  supervisor: ['director'],
  manager: ['supervisor'],
  assistant_manager: ['manager'],
  assistant: ['manager', 'assistant_manager'],
}

// Função para criar o schema dinamicamente baseado na posição
function createNominateSchema(position: PositionType) {
  const requiresSupervisor = REQUIRES_SUPERVISOR.includes(position)

  return z.object({
    email: z
      .string()
      .min(1, 'O email é obrigatório')
      .email('Digite um email válido'),
    supervisorEmail: requiresSupervisor
      ? z
          .string()
          .min(1, 'O email do chefe imediato é obrigatório')
          .email('Digite um email válido para o chefe imediato')
      : z.string().email('Digite um email válido').optional().or(z.literal('')),
  })
}

interface PositionNominateFormProps {
  position: PositionType
  className?: string
}

export function PositionNominateForm({
  position,
  className,
}: PositionNominateFormProps) {
  const router = useRouter()
  const label = POSITION_LABELS[position]
  const requiresSupervisor = REQUIRES_SUPERVISOR.includes(position)
  const allowedSupervisors = ALLOWED_SUPERVISORS[position]

  // Gera o label do chefe imediato baseado nas posições permitidas
  const supervisorLabel = allowedSupervisors
    .map((p) => POSITION_LABELS[p])
    .join(' ou ')

  const nominateSchema = createNominateSchema(position)
  type NominateFormData = z.infer<typeof nominateSchema>

  const form = useForm<NominateFormData>({
    resolver: zodResolver(nominateSchema),
    defaultValues: {
      email: '',
      supervisorEmail: '',
    },
  })

  const { trigger: createPosition, isMutating } = useCreatePosition(position, {
    swr: {
      onSuccess: (response) => {
        showToast({
          message: response.data.message,
          variant: 'success',
        })
        form.reset()
        router.refresh()
      },
      onError: (error: any) => {
        const errorMessage =
          error?.message || `Erro ao nomear ${label.toLowerCase()}`
        const errorAction = error?.action || 'Tente novamente mais tarde'

        showToast({
          message: `${errorMessage}. ${errorAction}`,
          variant: 'error',
        })
      },
    },
  })

  async function onSubmit(data: NominateFormData) {
    await createPosition({
      email: data.email,
      supervisorEmail: data.supervisorEmail || undefined,
    })
  }

  return (
    <div className={className}>
      <div className="bg-muted rounded-lg p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="text-primary h-5 w-5" />
          <Text variant="title-18-24-700">Nomear {label}</Text>
        </div>

        <Text variant="title-14-16-500" className="text-muted-foreground mb-6">
          Digite o email do usuário que deseja nomear como {label.toLowerCase()}
          . O usuário precisa estar cadastrado no sistema e ter a conta ativa.
        </Text>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do usuário</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@exemplo.com"
                      {...field}
                      disabled={isMutating}
                    />
                  </FormControl>
                  <FormDescription>
                    Email da pessoa que será nomeada {label.toLowerCase()}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de chefe imediato - exibido apenas para posições que precisam */}
            {(requiresSupervisor || allowedSupervisors.length > 0) && (
              <FormField
                control={form.control}
                name="supervisorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email do chefe imediato
                      {requiresSupervisor && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="chefe@exemplo.com"
                        {...field}
                        disabled={isMutating}
                      />
                    </FormControl>
                    <FormDescription>
                      {requiresSupervisor
                        ? `Informe o email do ${supervisorLabel} que será o chefe imediato`
                        : `Opcional: informe o email do ${supervisorLabel} para criar o vínculo`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isMutating} className="w-full">
              {isMutating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Nomeando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nomear {label}
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
