'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { useAuthLoginCredential } from '@/api/endpoints/auth/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { webserver } from '@/infra/webserver'
import { emailSchema, passwordSchema } from '@/schema'
import { cn } from '@/utils/mergeClassNames'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { showToast } from '../ShowToast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'

const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

type LoginFormSchemaProps = z.infer<typeof loginFormSchema>

type LoginFormProps = React.HTMLAttributes<HTMLFormElement> & {
  className?: string
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const form = useForm<LoginFormSchemaProps>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function revalidateTag() {
    await revalidateTags(['auth'])
  }

  // Login com credenciais
  const { trigger: loginUser, isMutating: isLoggingIn } =
    useAuthLoginCredential({
      swr: {
        onSuccess: async (response) => {
          if (response.status === 200) {
            // Revalidar o cache ANTES de redirecionar
            await revalidateTag()

            showToast({
              message: 'Login efetuado com sucesso!',
              duration: 3000,
              variant: 'success',
              closeButton: false,
              redirect: {
                path: `${webserver.host}/espacos`,
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
              message: 'Credenciais inválidas. Tente novamente.',
              duration: 3000,
              variant: 'error',
            })
          }
        },
        onError: (error) => {
          console.error('Erro no login:', error)
          showToast({
            message: 'Erro ao efetuar login. Tente novamente mais tarde.',
            duration: Infinity,
            variant: 'error',
          })
        },
      },
    })

  async function submitLoginCredentials(values: LoginFormSchemaProps) {
    await loginUser({
      email: values.email,
      password: values.password,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitLoginCredentials)}
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
                  type="text"
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

        {/* Password input */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="grid gap-1">
              <div className="flex items-center">
                <FormLabel>Senha</FormLabel>
                <Link
                  href={`${webserver.host}/esqueceu-senha`}
                  className="ring-offset-background focus-visible:ring-ring/20 hover:text-primary ml-auto inline-block rounded-sm text-[14px] leading-[20px] tracking-[0.1px] underline transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Esqueceu a senha?
                </Link>
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
                    placeholder="Sua senha"
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
          disabled={form.formState.isSubmitting || isLoggingIn}
          size={'lg'}
          className="w-full"
        >
          {form.formState.isSubmitting || isLoggingIn ? (
            <>
              <LoaderCircle className="mr-2 animate-spin" /> Carregando...
            </>
          ) : (
            'Acessar'
          )}
        </Button>
      </form>
    </Form>
  )
}
