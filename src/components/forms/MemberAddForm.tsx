'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { useSetMember } from '@/api/endpoints/team/team'
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

const addMemberFormSchema = z.object({
  email: emailSchema,
})

type AddMemberFormSchemaProps = z.infer<typeof addMemberFormSchema>

export interface MemberAddFormProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  /** ID do supervisor ao qual o membro será vinculado (usado por Admin/Dev/Manager) */
  supervisorId?: string
}

export function MemberAddForm({ className, supervisorId }: MemberAddFormProps) {
  const form = useForm<AddMemberFormSchemaProps>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      email: '',
    },
  })

  const { isMutating: isLoading, trigger: setMember } = useSetMember({
    swr: {
      onSuccess: (response) => {
        if (response.status === 201) {
          const { member, message } = response.data

          form.reset({ email: '' })
          revalidateTags(['list-members'])

          showToast({
            message:
              message ||
              `${member.userName || member.userEmail} foi adicionado(a) à equipe!`,
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
              'Não foi possível adicionar este usuário. Verifique se você tem permissão ou se a conta do usuário está ativa.',
            duration: 5000,
            variant: 'error',
          })
        } else {
          showToast({
            message: 'Erro ao adicionar membro. Tente novamente.',
            duration: 5000,
            variant: 'error',
          })
        }
      },
      onError: () => {
        showToast({
          message: 'Erro ao adicionar membro. Tente novamente.',
          duration: 5000,
          variant: 'error',
        })
      },
    },
  })

  function onSubmit(values: AddMemberFormSchemaProps) {
    setMember({
      email: values.email,
      ...(supervisorId && { supervisorId }),
    })
  }

  return (
    <div className={cn('flex w-full flex-1 flex-col items-center', className)}>
      <Text variant="title-22-32-700" className="my-4 text-center">
        Adicionar Novo Membro
      </Text>

      <Form {...form}>
        <div className="mx-auto w-full max-w-md">
          <form
            id="form-add-member"
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
                    adicioná-lo como membro da sua equipe de atendimento.
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
              {isLoading ? 'Adicionando...' : 'Adicionar Membro'}
            </Button>
          </form>
        </div>
      </Form>
    </div>
  )
}
