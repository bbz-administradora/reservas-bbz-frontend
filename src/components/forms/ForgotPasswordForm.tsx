'use client'

import { useAuthForgotPassword } from '@/api/endpoints/auth/auth'
import { showToast } from '@/components/ShowToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { emailSchema } from '@/schema'
import { cn } from '@/utils/mergeClassNames'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Text } from '../Text'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'

const forgotPasswordSchema = z.object({
  email: emailSchema,
})

type ForgotPasswordSchemaProps = z.infer<typeof forgotPasswordSchema>

type ForgotPasswordFormProps = React.HTMLAttributes<HTMLFormElement> & {
  className?: string
}

export function ForgotPasswordForm({
  className,
  ...props
}: ForgotPasswordFormProps) {
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordSchemaProps>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const { trigger: forgotPassword, isMutating: isSubmitting } =
    useAuthForgotPassword({
      swr: {
        onSuccess: (response) => {
          if (response.status === 201) {
            setEmailSent(true)
            showToast({
              message: 'E-mail enviado com sucesso!',
              duration: 3000,
              variant: 'success',
            })
          } else if (response.status === 403) {
            showToast({
              message:
                'Esta conta está desativada. Entre em contato com o suporte.',
              duration: Infinity,
              variant: 'error',
            })
          } else {
            showToast({
              message: 'Este e-mail não existe em nossa base de dados.',
              duration: 3000,
              variant: 'error',
            })
          }
        },
        onError: (error) => {
          console.error('Erro ao solicitar redefinição de senha:', error)
          showToast({
            message:
              'Erro ao processar sua solicitação. Tente novamente mais tarde.',
            duration: Infinity,
            variant: 'error',
          })
        },
      },
    })

  async function handleSubmit(data: ForgotPasswordSchemaProps) {
    await forgotPassword({ email: data.email })
  }

  return (
    <Form {...form}>
      {emailSent ? (
        <div className="flex flex-col gap-4 text-center">
          <p className="text-base">
            Enviamos um e-mail com as instruções para redefinição de senha.
          </p>
          <p className="text-muted-foreground text-sm">
            Verifique sua caixa de entrada e siga as instruções para criar uma
            nova senha.
          </p>
          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            className="mt-4"
          >
            Tentar outro e-mail
          </Button>
        </div>
      ) : (
        <>
          <Text className="mb-8 text-center">
            Informe seu e-mail cadastrado e enviaremos um link para redefinir
            sua senha.
          </Text>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className={cn('grid gap-5', className)}
            {...props}
          >
            {/* Email input */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-1">
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="exemplo@email.com"
                      className="h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit button */}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isSubmitting}
              size={'lg'}
              className="w-full"
            >
              {form.formState.isSubmitting || isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 animate-spin" /> Enviando...
                </>
              ) : (
                'Solicitar nova senha'
              )}
            </Button>
          </form>
        </>
      )}
    </Form>
  )
}
