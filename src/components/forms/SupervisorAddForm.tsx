'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { useSetSupervisor } from '@/api/endpoints/team/team'
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
import { emailSchema } from '@/schema'
import { cn } from '@/utils/mergeClassNames'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const addSupervisorFormSchema = z.object({
  email: emailSchema,
})

type AddSupervisorFormSchemaProps = z.infer<typeof addSupervisorFormSchema>

export interface SupervisorAddFormProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function SupervisorAddForm({ className }: SupervisorAddFormProps) {
  const form = useForm<AddSupervisorFormSchemaProps>({
    resolver: zodResolver(addSupervisorFormSchema),
    defaultValues: {
      email: '',
    },
  })

  const { isMutating: isLoading, trigger: setSupervisor } = useSetSupervisor({
    swr: {
      onSuccess: (response) => {
        if (response.status === 201) {
          const { supervisor, message } = response.data

          form.reset({ email: '' })
          revalidateTags(['list-supervisors'])

          showToast({
            message:
              message ||
              `${supervisor.userName || supervisor.userEmail} foi nomeado(a) supervisor(a)!`,
            duration: 5000,
            variant: 'success',
          })
        } else if (response.status === 404) {
          showToast({
            message: 'Usuário não encontrado. Verifique o email informado.',
            duration: 5000,
            variant: 'error',
          })
        } else if (response.status === 409) {
          showToast({
            message: 'Este usuário já possui uma posição na equipe.',
            duration: 5000,
            variant: 'error',
          })
        } else if (response.status === 403) {
          showToast({
            message:
              'Não foi possível nomear este usuário. Verifique se você tem permissão ou se a conta do usuário está ativa.',
            duration: 5000,
            variant: 'error',
          })
        } else {
          showToast({
            message: 'Erro ao nomear supervisor. Tente novamente.',
            duration: 5000,
            variant: 'error',
          })
        }
      },
      onError: () => {
        showToast({
          message: 'Erro ao nomear supervisor. Tente novamente.',
          duration: 5000,
          variant: 'error',
        })
      },
    },
  })

  function onSubmit(values: AddSupervisorFormSchemaProps) {
    setSupervisor({ email: values.email })
  }

  return (
    <div className={cn('flex w-full flex-1 flex-col items-center', className)}>
      <Text variant="title-22-32-700" className="my-4 text-center">
        Nomear Novo Supervisor
      </Text>

      <Form {...form}>
        <div className="mx-auto w-full max-w-md">
          <form
            id="form-add-supervisor"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid w-full gap-5"
          >
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Email do Usuário</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="ex: usuario@empresa.com.br"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground text-[14px] leading-[20px] tracking-[0.25px]">
                    Informe o email de um usuário cadastrado no sistema para
                    nomeá-lo como supervisor da equipe de atendimento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isLoading}
              className="w-full"
            >
              {(form.formState.isSubmitting || isLoading) && (
                <LoaderCircleIcon className="mr-2 animate-spin" />
              )}
              <UserPlus className="mr-2 h-4 w-4" />
              {isLoading ? 'Nomeando...' : 'Nomear Supervisor'}
            </Button>
          </form>
        </div>
      </Form>
    </div>
  )
}
