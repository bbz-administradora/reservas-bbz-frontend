'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { useDeleteImage, useUploadImage } from '@/api/endpoints/image/image'
import { useGetRoom, useUpdateRoom } from '@/api/endpoints/room/room'
import { Text } from '@/components/Text'
import { useRoomFormMode } from '@/context/RoomFormModeProvider'
import { env } from '@/infra/env'
import { ImageShimmerPlaceholder, resizeImageToWebp } from '@/utils/imagesUtils'
import { cn } from '@/utils/mergeClassNames'
import { CircleCheckIcon, ImageUpIcon, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { showToast } from '../ShowToast'
import { Button } from '../ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '../ui/form'
import { Input } from '../ui/input'

// largura e altura da imagem maxima da sala
const MAX_IMAGE_UPLOAD = 5
const TARGET_WIDTH_IMAGE = 1024
const TARGET_HEIGHT_IMAGE = 576
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export interface RoomAddUpdateFormProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function RoomAddUpdateImageForm({ className }: RoomAddUpdateFormProps) {
  const { mode, setMode, selectedRoomId, setSelectedRoomId, toggleResetForm } =
    useRoomFormMode()
  const [imagesData, setImagesData] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // React Hook Form - without schema validation since we handle it manually
  const form = useForm({
    defaultValues: {
      imagens: [] as string[],
    },
  })

  // Hook para obter os dados da sala
  const swrKey =
    mode === 'image' && selectedRoomId ? ['get-room', selectedRoomId] : null
  const {
    data: getRoomData,
    isLoading: loadingGetRoom,
    mutate: getRoom,
  } = useGetRoom(selectedRoomId as string, {
    swr: {
      swrKey,
      onSuccess: (response) => {
        if (response.status === 200) {
          const { room } = response.data
          setSelectedRoomId(room.id)
          setImagesData(room.imagens ?? [])
          form.setValue('imagens', room.imagens ?? [])
        } else {
          showToast({
            message: 'Ops... Falha ao carregar imagens da Sala.',
            duration: 5000,
            variant: 'error',
          })

          handleResetUpdateImagesRoom()
        }
      },
      onError: () => {
        showToast({
          message: 'Ops... Falha ao carregar imagens da Sala.',
          duration: 5000,
          variant: 'error',
        })

        handleResetUpdateImagesRoom()
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

            showToast({
              message: `Imagens da sala ${room.name} atualizada com sucesso.`,
              duration: 5000,
              variant: 'success',
            })
          } else {
            showToast({
              message: 'Ops... Falha ao atualizar imagens da Sala.',
              duration: 5000,
              variant: 'error',
            })
          }
        },
        onError: () => {
          showToast({
            message: 'Ops... Falha ao atualizar imagens da Sala.',
            duration: 5000,
            variant: 'error',
          })
        },
      },
    },
  )

  // Hook para deletar a imagem antiga do S3 (caso exista)
  const { trigger: deleteImage, isMutating: loadingDeleteImage } =
    useDeleteImage({
      swr: {
        onSuccess: (response) => {
          if (response.status !== 200) {
            console.error('❗ Erro ao deletar imagem:', response.data.message)
          }
        },
        onError: (error) => {
          console.error('💥 Erro ao deletar imagem antiga:', error)
        },
      },
    })

  // Hook para enviar a imagem para S3
  const { trigger: uploadImage, isMutating: loadingUploadImage } =
    useUploadImage(
      { folder: 'salas', group: 'sala', subtitle: 'bbz' },
      {
        swr: {
          onSuccess: (response) => {
            if (response.status !== 201) {
              showToast({
                message: response.data.message || 'Erro ao enviar imagem.',
                duration: 5000,
                variant: 'error',
              })
            }
          },
          onError: (error) => {
            console.error('💥 Erro ao enviar imagem para S3:', error)
            showToast({
              message: 'Erro ao enviar imagem. Tente novamente.',
              duration: 5000,
              variant: 'error',
            })
          },
        },
      },
    )

  function resolveTitle() {
    switch (true) {
      case isProcessing ||
        loadingUpdateRoom ||
        loadingGetRoom ||
        loadingUploadImage ||
        loadingDeleteImage:
        return 'Atualizando Sala...'
      default:
        return `Atualizar Imagens da Sala - ${getRoomData?.data?.room?.name}`
    }
  }

  const title = resolveTitle()

  // Função para cancelar a edição da sala
  function handleResetUpdateImagesRoom() {
    setMode('add')
    setSelectedRoomId(null)
    setImagesData([])
    form.reset({ imagens: [] })
    toggleResetForm()

    // Rola a página para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const selectedFiles = Array.from(files) as File[]

    const total = imagesData.length + selectedFiles.length

    //  📌 Validação de quantidade de imagens com MAX_IMAGE_UPLOAD
    if (total > MAX_IMAGE_UPLOAD) {
      showToast({
        message:
          imagesData.length > 0
            ? `A sala possui ${imagesData.length} image${imagesData.length > 1 ? 'ns' : 'm'}. Você pode adicionar mais ${
                MAX_IMAGE_UPLOAD - imagesData.length
              } image${MAX_IMAGE_UPLOAD - imagesData.length > 1 ? 'ns' : 'm'}.`
            : `Você pode adicionar até 5 imagens. Você esta adicionando ${
                selectedFiles.length
              } imagens.`,
        duration: 5000,
        variant: 'error',
      })

      // limpa o input para permitir reenvio dos mesmos arquivos
      e.target.value = ''
      return
    }

    //  📌 Validação de tamanho com MAX_FILE_SIZE
    const hasInvalidSize = selectedFiles.some(
      (file) => file.size > MAX_FILE_SIZE,
    )
    if (hasInvalidSize) {
      showToast({
        message: 'Uma ou mais imagens excedem o tamanho máximo de 10MB.',
        duration: 5000,
        variant: 'error',
      })
      e.target.value = ''
      return
    }

    //  📌 Validação de tipo com ACCEPTED_IMAGE_TYPES
    const hasInvalidType = selectedFiles.some(
      (file) => !ACCEPTED_IMAGE_TYPES.includes(file.type),
    )
    if (hasInvalidType) {
      showToast({
        message:
          'Uma ou mais imagens têm um formato inválido. Use JPG, PNG ou WebP.',
        duration: 5000,
        variant: 'error',
      })
      e.target.value = ''
      return
    }

    try {
      setIsProcessing(true)
      const resizedImages: string[] = []
      const originalImagesData = [...imagesData]

      for (const file of selectedFiles) {
        // 📌 Redimensiona a imagem para WebP antes de enviar
        const resizedFile = await resizeImageToWebp(
          file,
          TARGET_WIDTH_IMAGE,
          TARGET_HEIGHT_IMAGE,
        )
        // 📌 Envia a imagem para o endpoint de upload
        const result = await uploadImage({ file: resizedFile })
        if (result.status === 201) {
          // 📌 Se a imagem foi enviada com sucesso, armazena em resizedImages
          const { imagePath } = result.data
          resizedImages.push(imagePath)
        }
      }

      if (resizedImages.length === 0) {
        showToast({
          message: 'Nenhuma imagem foi enviada com sucesso.',
          duration: 5000,
          variant: 'error',
        })
        return
      }

      // 📌 Atualizo imagesData com as novas imagens do S3
      const updatedImages = [...imagesData, ...resizedImages]

      // 📌 Atualizo o banco de dados das salas
      if (mode === 'image' && selectedRoomId) {
        try {
          const updateResult = await updateRoom({ imagens: updatedImages })

          if (updateResult.status !== 200) {
            // Rollback: Se houve erro na atualização do banco, excluo as imagens enviadas
            for (const imagePath of resizedImages) {
              await deleteImage({ imagePath })
            }
            // Restauro o estado anterior
            setImagesData(originalImagesData)
            form.setValue('imagens', originalImagesData)

            showToast({
              message: 'Erro ao salvar imagens. As imagens foram removidas.',
              duration: 5000,
              variant: 'error',
            })
            return
          }

          // Se correu bem, atualiza o estado local e form
          setImagesData(updatedImages)
          form.setValue('imagens', updatedImages)

          // 📌 Revalido tag para atualizar a tabela se tudo deu certo
          revalidateTags(['update-room-image'])
        } catch (error) {
          // Rollback: Se houve exceção, excluo as imagens enviadas
          for (const imagePath of resizedImages) {
            await deleteImage({ imagePath })
          }
          // Restauro o estado anterior
          setImagesData(originalImagesData)
          form.setValue('imagens', originalImagesData)

          showToast({
            message: 'Erro ao salvar imagens. As imagens foram removidas.',
            duration: 5000,
            variant: 'error',
          })
        }
      }
    } catch (error) {
      console.error('Erro ao processar imagens:', error)
      showToast({
        message: 'Erro ao processar uma ou mais imagens.',
        duration: 5000,
        variant: 'error',
      })
    } finally {
      setIsProcessing(false)
      e.target.value = ''
    }
  }

  async function handleRemoveImage(index: number) {
    if (isProcessing) return

    try {
      setIsProcessing(true)
      const currentImages = [...imagesData]
      const imageToDeletePath = currentImages[index]

      if (!imageToDeletePath) return

      // 📌 Remove a imagem no índice
      currentImages.splice(index, 1)

      // 📌 Atualiza banco de dados
      if (mode === 'image' && selectedRoomId) {
        try {
          const result = await updateRoom({ imagens: currentImages })

          if (result.status === 200) {
            // 📌 Só deleta a imagem do S3 após sucesso na atualização do banco
            await deleteImage({ imagePath: imageToDeletePath })

            // 📌 Atualiza estado local e form
            setImagesData(currentImages)
            form.setValue('imagens', currentImages)

            // 📌 Revalida tag para atualizar a tabela
            revalidateTags(['update-room-image'])
          } else {
            showToast({
              message: 'Erro ao remover imagem.',
              duration: 5000,
              variant: 'error',
            })
          }
        } catch (error) {
          console.error('Erro ao atualizar banco após remoção:', error)
          showToast({
            message: 'Erro ao remover imagem.',
            duration: 5000,
            variant: 'error',
          })
        }
      }
    } catch (error) {
      console.error('Erro ao remover imagem:', error)
      showToast({
        message: 'Erro ao remover imagem.',
        duration: 5000,
        variant: 'error',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Efeito para atualizar o formulário quando o modo for 'image' e o ID da Sala estiver definido
  useEffect(() => {
    if (mode === 'image' && selectedRoomId) {
      getRoom()
    }
  }, [selectedRoomId])

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col items-center',
        mode !== 'image' && 'sr-only',
        className,
      )}
    >
      <Text variant="title-22-32-700" className="my-4 max-w-3xl text-center">
        {title}
      </Text>

      {/* Formulário de adição e edição de sala */}
      <Form {...form}>
        <div
          id="form-edit-images"
          className="mx-auto grid w-full max-w-2xl gap-5"
        >
          {/* Imagens */}
          <FormField
            control={form.control}
            name="imagens"
            render={() => (
              <FormItem className="group mb-4">
                {/* Label geral */}
                <span className="text-sm leading-none font-medium">
                  Imagens
                </span>

                {/* Label clicável */}
                <FormLabel className="border-input bg-background text-muted-foreground flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border px-4 py-2 transition-colors">
                  {imagesData.length > 0 ? (
                    <>
                      <span className="text-foreground">
                        Você carregou {imagesData.length} image
                        {imagesData.length > 1 ? 'ns' : 'm'}
                      </span>
                      <CircleCheckIcon className="text-primary ml-auto h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Clique aqui para adicionar imagens</span>
                      <ImageUpIcon className="ml-auto h-4 w-4 opacity-50" />
                    </>
                  )}
                </FormLabel>

                {/* Input escondido */}
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImage}
                    disabled={
                      isProcessing ||
                      loadingUpdateRoom ||
                      loadingUploadImage ||
                      loadingDeleteImage
                    }
                  />
                </FormControl>

                {/* Descrição */}
                <FormDescription className="text-muted-foreground text-[14px] leading-[20px] tracking-[0.25px]">
                  {imagesData.length > 0 && imagesData.length < MAX_IMAGE_UPLOAD
                    ? `Adicione no máximo ${MAX_IMAGE_UPLOAD - imagesData.length} imagens.`
                    : `Adicione até ${MAX_IMAGE_UPLOAD} imagens`}
                </FormDescription>

                {/* Lista de imagens */}
                {imagesData.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-6 gap-3 md:grid-cols-5">
                    {imagesData.map((item, idx) => {
                      return (
                        <div
                          key={idx}
                          className="relative col-span-2 md:col-span-1"
                        >
                          <div
                            className={cn(
                              'bg-destructive text-destructive-foreground border-destructive-foreground absolute top-[-10px] right-[-10px] z-10 cursor-pointer rounded-full border-1 p-0.5',
                              (isProcessing ||
                                loadingUpdateRoom ||
                                loadingDeleteImage) &&
                                'cursor-not-allowed opacity-50',
                            )}
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <X size={14} />
                          </div>
                          <div className="relative h-24 flex-1 overflow-hidden rounded-lg">
                            <Image
                              src={`${env.NEXT_PUBLIC_BUCKET}/${item}`}
                              alt={`Imagem ${idx + 1}`}
                              fill
                              placeholder={ImageShimmerPlaceholder()}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Cancel Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetUpdateImagesRoom}
              disabled={
                isProcessing ||
                loadingUpdateRoom ||
                loadingUploadImage ||
                loadingDeleteImage
              }
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
