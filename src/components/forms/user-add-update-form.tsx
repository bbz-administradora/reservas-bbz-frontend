'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import {
  useCreateUser,
  useGetUser,
  useUpdateUser,
} from '@/api/endpoints/user/user'
import { Text } from '@/components/Text'
import { useUserFormMode } from '@/context/UserFormModeProvider'
import { emailSchema, fullNameSchema } from '@/schema'
import { cn } from '@/utils/mergeClassNames'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon, ShieldIcon, UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { showToast } from '../ShowToast'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

const addUpdateUserFormSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  role: z.enum(['user', 'admin', 'dev']),
  accountStatus: z.boolean(),
})

type UserAddUpdateFormSchemaProps = z.infer<typeof addUpdateUserFormSchema>

export interface UserAddUpdateFormProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function UserAddUpdateForm({ className }: UserAddUpdateFormProps) {
  const { mode, selectedUserId, setMode, setSelectedUserId } = useUserFormMode()
  const [isDev, setIsDev] = useState(false)

  // React Hook Form
  const form = useForm<UserAddUpdateFormSchemaProps>({
    resolver: zodResolver(addUpdateUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
      accountStatus: true,
    },
  })

  // Hook para obter os dados do usuário
  const swrKey =
    mode === 'edit' && selectedUserId ? ['get-user', selectedUserId] : null

  const {
    data: getUserData,
    isLoading: loadingGetUser,
    mutate,
  } = useGetUser(selectedUserId as string, {
    swr: {
      swrKey,
      onSuccess: (response) => {
        if (response.status === 200) {
          const { user } = response.data

          form.reset({
            name: user.name ?? undefined,
            email: user.email,
            role: user.role as 'user' | 'admin' | 'dev',
            accountStatus: user.accountStatus,
          })

          setSelectedUserId(user.id)
          setIsDev(user.role === 'dev')
        } else {
          showToast({
            message: 'Ops... Falha ao carregar dados do usuário.',
            duration: 5000,
            variant: 'error',
          })

          setMode('add')
          setSelectedUserId(null)
          setIsDev(false)

          form.reset({
            name: '',
            email: '',
            role: 'user',
            accountStatus: true,
          })
        }
      },
      onError: () => {
        showToast({
          message: 'Ops... Falha ao carregar dados do usuário.',
          duration: 5000,
          variant: 'error',
        })

        setMode('add')
        setSelectedUserId(null)
        setIsDev(false)

        form.reset({
          name: '',
          email: '',
          role: 'user',
          accountStatus: true,
        })
      },
    },
  })

  const { isMutating: loadingUpdateUser, trigger: updateUser } = useUpdateUser(
    selectedUserId as string,
    {
      swr: {
        onSuccess: (response) => {
          if (response.status === 200) {
            const { user } = response.data

            form.reset({
              name: '',
              email: '',
              role: 'user',
              accountStatus: true,
            })

            revalidateTags(['update-user'])
            setMode('add')
            setSelectedUserId(null)
            setIsDev(false)

            showToast({
              message: `Usuário ${user.name} atualizado com sucesso.`,
              duration: 5000,
              variant: 'success',
            })
          } else if (response.status === 409) {
            showToast({
              message: 'Ops... Já existe um usuário com este email.',
              duration: 5000,
              variant: 'error',
            })
          } else {
            showToast({
              message: 'Ops... Falha ao atualizar dados do usuário.',
              duration: 5000,
              variant: 'error',
            })
          }
        },
        onError: () => {
          showToast({
            message: 'Ops... Falha ao atualizar dados do usuário.',
            duration: 5000,
            variant: 'error',
          })
        },
      },
    },
  )

  const { isMutating: loadingCreateUser, trigger: createUser } = useCreateUser({
    swr: {
      onSuccess: (response) => {
        if (response.status === 201) {
          const { user } = response.data

          form.reset({
            name: '',
            email: '',
            role: 'user',
            accountStatus: true,
          })

          revalidateTags(['create-user'])
          setMode('add')
          setSelectedUserId(null)
          setIsDev(false)

          showToast({
            message: `Usuário ${user.name} criado com sucesso.`,
            duration: 5000,
            variant: 'success',
          })
        } else if (response.status === 409) {
          showToast({
            message: 'Ops... Já existe um usuário com este email.',
            duration: 5000,
            variant: 'error',
          })
        } else {
          showToast({
            message: 'Ops... Falha ao criar usuário.',
            duration: 5000,
            variant: 'error',
          })
        }
      },
      onError: () => {
        showToast({
          message: 'Ops... Falha ao criar usuário.',
          duration: 5000,
          variant: 'error',
        })
      },
    },
  })

  function resolveLabelButton() {
    switch (true) {
      case loadingCreateUser:
        return 'Adicionando...'
      case loadingUpdateUser:
        return 'Atualizando...'
      case loadingGetUser:
        return 'Carregando...'
      default:
        return mode === 'add' ? 'Adicionar' : 'Atualizar'
    }
  }

  function resolveTitle() {
    switch (true) {
      case loadingCreateUser:
        return 'Adicionando Usuário...'
      case loadingUpdateUser:
        return 'Atualizando Usuário...'
      case loadingGetUser:
        return 'Carregando Usuário...'
      default:
        return mode === 'add' ? 'Adicionar Usuário' : 'Editar Usuário'
    }
  }

  const title = resolveTitle()

  // Função para cancelar a edição do usuário
  function handleCancelEditUser() {
    setMode('add')
    setSelectedUserId(null)
    setIsDev(false)

    form.reset({
      name: '',
      email: '',
      role: 'user',
      accountStatus: true,
    })

    // Rola a página para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onSubmit(values: UserAddUpdateFormSchemaProps) {
    if (mode === 'add') {
      // adiciona todos os campos
      createUser(values)
    } else {
      // prepara payload somente com mudanças
      const orig = getUserData?.data.user

      if (!orig) return
      const diff: Partial<UserAddUpdateFormSchemaProps> = {}

      if (values.name && values.name !== orig.name) diff.name = values.name
      if (values.email && values.email !== orig.email) diff.email = values.email
      if (values.role && values.role !== orig.role) diff.role = values.role
      if (values.accountStatus !== orig.accountStatus)
        diff.accountStatus = values.accountStatus

      if (Object.keys(diff).length === 0) {
        showToast({
          message:
            'Os dados atuais do usuário não foram alterados. Faça alguma modificação para atualizar.',
          duration: 5000,
          variant: 'info',
        })
        return
      }
      updateUser(diff)
    }
  }

  // Efeito para atualizar o formulário quando o modo for 'edit' e o ID do usuário estiver definido
  useEffect(() => {
    if (mode === 'edit' && selectedUserId) {
      mutate()
    }
  }, [selectedUserId])

  return (
    <div className={cn('flex w-full flex-1 flex-col items-center', className)}>
      <Text variant="title-22-32-700" className="my-4 text-center">
        {title}
      </Text>

      {/* Formulário de adição e edição de usuário */}
      <Form {...form}>
        <div className="mx-auto w-full max-w-2xl">
          {/* Mensagem de erro somente se o usuário não for dev */}
          {isDev && (
            <div
              className={
                'bg-destructive/10 mt-5 mb-10 flex w-full flex-col gap-4 rounded-md p-4 md:max-w-2xl'
              }
            >
              <p className="text-destructive text-[14px] leading-[20px] tracking-[0.25px]">
                Conta de desenvolvedor em edição. Essa conta tem acesso
                irrestrito e não permite alterações.
              </p>
            </div>
          )}

          <form
            id="form-edit-user"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid w-full gap-5"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isDev}
                      type="text"
                      placeholder="Ex: João Santos"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isDev}
                      type="email"
                      placeholder="ex:joaosantos@gmail.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[14px] leading-[20px] tracking-[0.25px] text-black/70">
                    O usuário so conseguirá realizar login com este email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      disabled={isDev}
                      type="single"
                      size="sm"
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                      }}
                      className="flex items-center justify-start gap-2"
                    >
                      <ToggleGroupItem
                        value="user"
                        aria-label="User"
                        className="rounded-full px-4 first:rounded-l-full"
                      >
                        <UserIcon className="h-4 w-4" />
                        User
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="admin"
                        aria-label="Admin"
                        className="rounded-full px-4 last:rounded-r-full"
                      >
                        <ShieldIcon className="h-4 w-4" />
                        Admin
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormDescription className="text-muted-foreground text-[14px] leading-[20px] tracking-[0.25px]">
                    {field.value === 'user'
                      ? 'Usuário comum, sem acesso à área administrativa.'
                      : field.value === 'admin'
                        ? 'Administrador com acesso total às funcionalidades do sistema.'
                        : ''}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Status */}
            <FormField
              control={form.control}
              name="accountStatus"
              render={({ field }) => (
                <FormItem
                  className={cn(
                    'sr-only grid gap-2',
                    mode === 'edit' && 'not-sr-only',
                  )}
                >
                  <div className="flex items-center gap-4">
                    <FormControl>
                      <Checkbox
                        disabled={isDev}
                        checked={!field.value} // inverso: true (ativo) → desmarcado
                        onCheckedChange={(checked) => field.onChange(!checked)} // inverso
                      />
                    </FormControl>
                    <FormLabel
                      className={cn(
                        'cursor-pointer',
                        field.value && 'text-muted-foreground',
                      )}
                    >
                      Inativar Usuário
                    </FormLabel>
                  </div>
                  <FormDescription className="text-muted-foreground text-[14px] leading-[20px] tracking-[0.25px]">
                    {!field.value
                      ? 'Ao desativar, o usuário será banido do sistema: ele não poderá mais fazer login e, caso já esteja autenticado, será desconectado assim que fizer a próxima requisição.'
                      : 'Este usuário está ativo no sistema e pode fazer login normalmente.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEditUser}
                disabled={form.formState.isSubmitting || loadingUpdateUser}
                className={cn('sr-only', mode === 'edit' && 'not-sr-only')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  isDev ||
                  loadingUpdateUser ||
                  loadingGetUser ||
                  loadingCreateUser
                }
              >
                {(form.formState.isSubmitting ||
                  loadingGetUser ||
                  loadingCreateUser ||
                  loadingUpdateUser) && (
                  <LoaderCircleIcon className="mr-2 animate-spin" />
                )}
                {resolveLabelButton()}
              </Button>
            </div>
          </form>
        </div>
      </Form>
    </div>
  )
}
