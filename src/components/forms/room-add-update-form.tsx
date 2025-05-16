'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import {
  useCreateRoom,
  useGetRoom,
  useUpdateRoom,
} from '@/api/endpoints/room/room'
import { Text } from '@/components/Text'
import { useRoomFormMode } from '@/context/RoomFormModeProvider'
import { cn } from '@/utils/mergeClassNames'
import { areStringArraysEqual } from '@/utils/textUtils'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { showToast } from '../ShowToast'
import { Badge } from '../ui/badge'
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
import { Textarea } from '../ui/textarea'

const addUpdateRoomFormSchema = z.object({
  name: z
    .string({ required_error: 'O preenchimento do nome é obrigatório.' })
    .min(3, 'O nome da sala deve ter pelo menos 3 caracteres.')
    .max(100, 'O nome da sala deve ter no máximo 100 caracteres.'),

  description: z
    .string({ required_error: 'O preenchimento da descrição é obrigatório.' })
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .default(''),

  recursos: z.array(z.string()).default([]),

  capacidade: z.coerce
    .number({ required_error: 'O preenchimento da capacidade é obrigatório.' })
    .int('A capacidade deve ser um número inteiro.')
    .positive('A capacidade deve ser um número positivo.'),

  isActive: z.boolean().default(true),
})

type RoomAddUpdateFormSchemaProps = z.input<typeof addUpdateRoomFormSchema>

export interface RoomAddUpdateFormProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function RoomAddUpdateForm({ className }: RoomAddUpdateFormProps) {
  const { mode, setMode, selectedRoomId, setSelectedRoomId, resetForm } =
    useRoomFormMode()

  // React Hook Form
  const form = useForm<RoomAddUpdateFormSchemaProps>({
    resolver: zodResolver(addUpdateRoomFormSchema),
    defaultValues: {
      name: '',
      description: '',
      recursos: [],
      capacidade: 0,
      isActive: true,
    },
  })

  // Hook para obter os dados da sala
  const swrKey =
    mode === 'edit' && selectedRoomId ? ['get-room', selectedRoomId] : null
  const {
    data: dataGetRoom,
    isLoading: loadingGetRoom,
    mutate,
  } = useGetRoom(selectedRoomId as string, {
    swr: {
      swrKey,
      onSuccess: (response) => {
        if (response.status === 200) {
          const { room } = response.data

          form.reset({
            name: room.name,
            description: room.description ?? '',
            recursos: room.recursos ?? [],
            capacidade: room.capacidade,
            isActive: room.isActive,
          })

          setSelectedRoomId(room.id)

          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth',
          })
        } else {
          showToast({
            message: 'Ops... Falha ao carregar dados da Sala.',
            duration: 5000,
            variant: 'error',
          })

          setMode('add')
          setSelectedRoomId(null)
          form.reset()
        }
      },
      onError: () => {
        showToast({
          message: 'Ops... Falha ao carregar dados da Sala.',
          duration: 5000,
          variant: 'error',
        })

        setMode('add')
        setSelectedRoomId(null)
        form.reset()
      },
    },
  })

  // Hook para atualizar a sala
  const { isMutating: loadingUpdateRoom, trigger: updateRoom } = useUpdateRoom(
    selectedRoomId as string,
    {
      swr: {
        onSuccess: (response) => {
          if (response.status === 200) {
            const { room } = response.data

            revalidateTags(['update-room'])
            setMode('add')
            setSelectedRoomId(null)
            handleResetForm()

            showToast({
              message: `Sala ${room.name} atualizado com sucesso.`,
              duration: 5000,
              variant: 'success',
            })
          } else if (response.status === 409) {
            showToast({
              message: 'Ops... Já existe uma sala com este nome.',
              duration: 5000,
              variant: 'error',
            })
          } else {
            showToast({
              message: 'Ops... Falha ao atualizar dados da Sala.',
              duration: 5000,
              variant: 'error',
            })
          }
        },
        onError: () => {
          showToast({
            message: 'Ops... Falha ao atualizar dados da Sala.',
            duration: 5000,
            variant: 'error',
          })
        },
      },
    },
  )

  // Hook para criar a sala
  const { isMutating: loadingCreateRoom, trigger: createRoom } = useCreateRoom({
    swr: {
      onSuccess: (response) => {
        if (response.status === 201) {
          const { room } = response.data

          revalidateTags(['create-room'])

          handleResetForm()

          showToast({
            message: `Sala ${room.name} criada com sucesso.`,
            duration: 5000,
            variant: 'success',
          })
        } else if (response.status === 409) {
          showToast({
            message: 'Ops... Já existe uma Sala com este nome.',
            duration: 5000,
            variant: 'error',
          })
        } else {
          showToast({
            message: 'Ops... Falha ao criar sala.',
            duration: 5000,
            variant: 'error',
          })
        }
      },
      onError: () => {
        showToast({
          message: 'Ops... Falha ao criar sala.',
          duration: 5000,
          variant: 'error',
        })
      },
    },
  })

  function resolveLabelButton() {
    switch (true) {
      case loadingCreateRoom:
        return 'Adicionando...'
      case loadingUpdateRoom:
        return 'Atualizando...'
      case loadingGetRoom:
        return 'Carregando...'
      default:
        return mode === 'add' ? 'Adicionar' : 'Atualizar'
    }
  }

  function resolveTitle() {
    switch (true) {
      case loadingCreateRoom:
        return 'Adicionando Sala...'
      case loadingUpdateRoom:
        return 'Atualizando Sala...'
      case loadingGetRoom:
        return 'Carregando Sala...'
      default:
        return mode === 'add' ? 'Adicionar Sala' : 'Editar Sala'
    }
  }

  const title = resolveTitle()

  // Função para cancelar a edição da sala
  function handleResetForm() {
    setMode('add')
    setSelectedRoomId(null)
    form.reset({
      name: '',
      description: '',
      recursos: [],
      capacidade: 0,
      isActive: true,
    })

    // Rola a página para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onSubmit(values: RoomAddUpdateFormSchemaProps) {
    if (mode === 'add') {
      createRoom(values)
      return
    }

    if (mode === 'edit') {
      const original = dataGetRoom?.data.room

      if (!original) {
        showToast({
          message: 'Ops... Falha ao carregar dados da Sala.',
          duration: 5000,
          variant: 'error',
        })
        return
      }

      const diff: Partial<RoomAddUpdateFormSchemaProps> = {}

      if (original.name.trim() !== values.name.trim()) {
        diff.name = values.name
      }

      if (original.description?.trim() !== values.description?.trim()) {
        diff.description = values.description
      }

      if (!areStringArraysEqual(original.recursos, values.recursos)) {
        diff.recursos = values.recursos
      }

      if (original.capacidade !== values.capacidade) {
        diff.capacidade = values.capacidade
      }

      if (original.isActive !== values.isActive) {
        diff.isActive = values.isActive
      }

      if (Object.keys(diff).length === 0) {
        showToast({
          message:
            'Os dados atuais da sala não foram alterados. Faça uma alteração para atualizar.',
          duration: 5000,
          variant: 'info',
        })
        return
      }
      updateRoom(diff)
    }

    handleResetForm()
  }

  // Efeito para atualizar o formulário quando o modo for 'edit' e o ID da Sala estiver definido
  useEffect(() => {
    if (mode === 'edit' && selectedRoomId) {
      mutate()
    }
  }, [selectedRoomId])

  useEffect(() => {
    handleResetForm()
  }, [resetForm])

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col items-center',
        mode === 'image' && 'sr-only',
        className,
      )}
    >
      <Text variant="title-22-32-700" className="my-4 text-center">
        {title}
      </Text>

      {/* Formulário de adição e edição de sala */}
      <Form {...form}>
        <form
          id="form-edit-user"
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto grid w-full max-w-2xl gap-5"
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
                    type="text"
                    placeholder="Ex: Sala de reunião 1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descrição */}
          <FormField
            name="description"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    rows={8}
                    placeholder="Ex: Sala de reunião com capacidade para 10 pessoas."
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-muted-foreground text-[14px] leading-[20px] tracking-[0.25px]">
                  No máximo 500 caracteres. A descrição é opcional.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recursos */}
          <FormField
            control={form.control}
            name="recursos"
            render={({ field }) => {
              const [resourceInput, setResourceInput] = useState<string>('')
              const resources = field.value ?? []

              const handleAdd = () => {
                const trimmed = resourceInput.trim()
                if (!trimmed) return
                // add new resource and clear input
                field.onChange([...resources, trimmed])
                setResourceInput('')
              }

              const handleRemove = (index: number) => {
                field.onChange(resources.filter((_, i) => i !== index))
              }

              return (
                <FormItem className="grid gap-2">
                  <FormLabel>Recursos</FormLabel>

                  {/* input + botão */}
                  <div className="flex flex-col gap-2 md:flex-row">
                    <FormControl className="flex-1">
                      <Input
                        placeholder='Ex: TV 55"'
                        value={resourceInput}
                        onChange={(e) => setResourceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        className="h-9 min-h-[36px]"
                      />
                    </FormControl>
                    <Button
                      size="sm"
                      type="button"
                      variant="secondary"
                      onClick={handleAdd}
                      className="h-9"
                    >
                      Adicionar recurso
                    </Button>
                  </div>

                  {/* lista de chips */}
                  <div
                    className={cn(
                      'flex flex-wrap gap-3',
                      resources.length > 0 && 'my-5 md:mt-2.5',
                    )}
                  >
                    {resources.map((item, idx) => (
                      <Badge
                        key={idx}
                        className="bg-accent text-accent-foreground hover:bg-accent relative h-8 overflow-visible rounded-full px-4 capitalize"
                      >
                        {item}
                        <div
                          className="bg-destructive text-destructive-foreground border-destructive-foreground absolute top-[-10px] right-[-10px] cursor-pointer rounded-full border-1 p-0.5"
                          onClick={() => handleRemove(idx)}
                        >
                          <X size={14} />
                        </div>
                      </Badge>
                    ))}
                  </div>

                  <FormDescription className="text-muted-foreground text-[14px] leading-[20px] tracking-[0.25px]">
                    Adicionar recurso é opcional.
                  </FormDescription>

                  <FormMessage />
                </FormItem>
              )
            }}
          />

          {/* Capacidade */}
          <FormField
            control={form.control}
            name="capacidade"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Capacidade</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ex: 6" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Is Active */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Checkbox
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
                    {mode === 'edit' ? 'Inativar sala' : 'Criar sala inativa'}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              disabled={
                form.formState.isSubmitting ||
                loadingUpdateRoom ||
                loadingGetRoom ||
                loadingCreateRoom
              }
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                loadingUpdateRoom ||
                loadingGetRoom ||
                loadingCreateRoom
              }
            >
              {(form.formState.isSubmitting ||
                loadingGetRoom ||
                loadingCreateRoom ||
                loadingUpdateRoom) && (
                <LoaderCircleIcon className="mr-2 animate-spin" />
              )}
              {resolveLabelButton()}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
