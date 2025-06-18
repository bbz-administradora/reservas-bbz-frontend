'use client'

import { useAuthResetPassword } from '@/api/endpoints/auth/auth'
import { showToast } from '@/components/ShowToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { webserver } from '@/infra/webserver'
import { passwordSchema } from '@/schema'
import { cn } from '@/utils/mergeClassNames'
import { generatePassword } from '@/utils/password'
import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type ResetPasswordSchemaProps = z.infer<typeof resetPasswordSchema>

type ResetPasswordFormProps = React.HTMLAttributes<HTMLFormElement> & {
  userId: string
  token: string
  className?: string
}

export function ResetPasswordForm({
  userId,
  token,
  className,
  ...props
}: ResetPasswordFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const form = useForm<ResetPasswordSchemaProps>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const { trigger: resetPassword, isMutating: isResetting } =
    useAuthResetPassword(userId, token, {
      swr: {
        onSuccess: (response) => {
          if (response.status === 200) {
            showToast({
              message: 'Senha redefinida com sucesso!',
              duration: 3000,
              variant: 'success',
              closeButton: false,
              redirect: {
                path: `${webserver.host}/login`,
                countdownSeconds: 2,
              },
            })
          } else if (response.status === 403) {
            showToast({
              message:
                'Sua conta está inativa. Entre em contato com o suporte.',
              duration: Infinity,
              variant: 'error',
            })
          } else {
            showToast({
              message:
                'O link de redefinição de senha expirou ou é inválido. Por favor, solicite uma nova redefinição de senha.',
              duration: 5000,
              variant: 'error',
              redirect: {
                path: `${webserver.host}/esqueceu-senha`,
                countdownSeconds: 4,
              },
            })
          }
        },
        onError: (error) => {
          console.error('Erro ao redefinir senha:', error)
          showToast({
            message:
              'O link de redefinição de senha expirou ou é inválido. Por favor, solicite uma nova redefinição de senha.',
            duration: 5000,
            variant: 'error',
            redirect: {
              path: `${webserver.host}/esqueceu-senha`,
              countdownSeconds: 4,
            },
          })
        },
      },
    })

  function handleGeneratePassword() {
    const password = generatePassword(16)
    form.setValue('newPassword', password)
    form.setValue('confirmPassword', password)
    showToast({
      message: 'Senha gerada com sucesso.',
      duration: 3000,
      variant: 'info',
    })
  }

  function handleCopyPassword() {
    const password = form.getValues('newPassword')
    if (password) {
      navigator.clipboard.writeText(password)
      showToast({
        message: 'Senha copiada para a área de transferência.',
        duration: 3000,
        variant: 'info',
      })
    } else {
      showToast({
        message: 'Nenhuma senha para copiar.',
        duration: 3000,
        variant: 'error',
      })
    }
  }

  async function handleSubmit(values: ResetPasswordSchemaProps) {
    await resetPassword({
      password: values.newPassword,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('grid gap-5', className)}
        {...props}
      >
        {/* Nova senha input */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <div className="flex items-center justify-between">
                <FormLabel>Nova senha</FormLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleGeneratePassword}
                    className="text-muted-foreground/50 hover:accent-accent-foreground transition-all"
                  >
                    Gerar Senha
                  </Button>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyPassword}
                      className="group"
                    >
                      <Copy
                        size={20}
                        className="text-muted-foreground/50 group-hover:text-accent-foreground transition-all"
                      />
                      <span className="sr-only">Copiar Senha</span>
                    </Button>
                  )}
                </div>
              </div>
              <FormControl>
                <div className="relative">
                  <Button
                    type="button"
                    variant={'ghost'}
                    size={'icon'}
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    className="text-muted-foreground/50 hover:text-primary absolute top-0.5 right-0 hover:bg-transparent"
                  >
                    {isPasswordVisible ? (
                      <>
                        <Eye size={20} />
                        <span className="sr-only">Esconder senha</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={20} />
                        <span className="sr-only">Mostrar senha</span>
                      </>
                    )}
                  </Button>
                  <Input
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                    {...field}
                    className="h-10 pr-10"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirmar senha input */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <FormLabel>Confirmar nova senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Button
                    type="button"
                    variant={'ghost'}
                    size={'icon'}
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    className="text-muted-foreground/50 hover:text-primary absolute top-0.5 right-0 hover:bg-transparent"
                  >
                    {isPasswordVisible ? (
                      <>
                        <Eye size={20} />
                        <span className="sr-only">Esconder senha</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={20} />
                        <span className="sr-only">Mostrar senha</span>
                      </>
                    )}
                  </Button>
                  <Input
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder="Confirme sua nova senha"
                    {...field}
                    className="h-10 pr-10"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit button */}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isResetting}
          size={'lg'}
          className="w-full"
        >
          {form.formState.isSubmitting || isResetting ? (
            <>
              <LoaderCircle className="mr-2 animate-spin" /> Processando...
            </>
          ) : (
            'Redefinir senha'
          )}
        </Button>
      </form>
    </Form>
  )
}
