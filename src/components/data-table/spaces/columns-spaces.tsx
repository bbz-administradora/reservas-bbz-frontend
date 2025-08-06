'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { ListSpaces200SpacesItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useDeleteImage } from '@/api/endpoints/image/image'
import {
  useDeleteSpace,
  useOpenDoor,
  useSpaceQrcode,
} from '@/api/endpoints/space/space'
import { DoorCodeDialog } from '@/components/DoorCodeDialog'
import { showToast } from '@/components/ShowToast'
import { useSpaceFormMode } from '@/context/SpaceFormModeProvider'
import { env } from '@/infra/env'
import { cn } from '@/utils/mergeClassNames'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ImagePlusIcon,
  LockOpenIcon,
  PencilIcon,
  QrCodeIcon,
  TrashIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { DataTableColumnHeader } from '../data-table-column-header'

export const spacesTitlesColumns = {
  name: 'Nome',
  description: 'Descrição',
  type: 'Tipo',
  recursos: 'Recursos',
  capacidade: 'Capacidade',
  isActive: 'Status',
  createdAt: 'Criado em',
  userName: 'Criado por',
  imagens: 'Imagens',
  floor: 'Andar',
  zone: 'Zona',
  position: 'Posição',
  qrcodeUrl: 'QrCode',
  actions: 'Ações',
}

export const columnsSpaces: ColumnDef<ListSpaces200SpacesItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={spacesTitlesColumns.name} />
    ),
    cell: ({ row }) => (
      <span className="break-words whitespace-normal">
        {transformTextIntoCapitalizedWords(row.original.name || 'N/A')}
      </span>
    ),
  },
  {
    accessorKey: 'description',
    header: () => (
      <span className="text-primary capitalize">
        {spacesTitlesColumns.description}
      </span>
    ),
    cell: (info) => (
      <span className="line-clamp-4 break-words whitespace-normal lg:line-clamp-3">
        {info.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={spacesTitlesColumns.type} />
    ),
    cell: ({ row }) => {
      const type = row.original.type || 'N/A'
      let displayType = 'N/A'

      if (type === 'room') {
        displayType = 'Sala'
      } else if (type === 'workstation') {
        displayType = 'Estação de Trabalho'
      } else {
        displayType = transformTextIntoCapitalizedWords(type)
      }

      return (
        <span className="break-words whitespace-normal">{displayType}</span>
      )
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue.length === 0) return true
      const type = row.getValue(columnId) as string
      return filterValue.includes(type)
    },
  },
  {
    accessorKey: 'recursos',
    header: () => (
      <span className="text-primary">
        {transformTextIntoCapitalizedWords(spacesTitlesColumns.recursos)}
      </span>
    ),
    // filtro customizado para array de strings
    filterFn: (row, columnId, filterValue) => {
      const raw = row.getValue<string[] | string>(columnId)
      // normaliza para array
      const items = Array.isArray(raw)
        ? raw
        : String(raw)
            .split(',')
            .map((item) => item.trim())

      // retorna true se qualquer item contiver o termo (case-insensitive)
      return items.some((item) =>
        item.toLowerCase().includes(String(filterValue).toLowerCase()),
      )
    },
    // sua cell atualizada
    cell: (info) => {
      const raw = info.getValue<string[] | string>()
      const items = Array.isArray(raw)
        ? raw.map((i) => i.trim())
        : String(raw)
            .split(',')
            .map((i) => i.trim())
      const formatted = items
        .map(
          (item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase(),
        )
        .join(', ')
      return <div className="break-words whitespace-normal">{formatted}</div>
    },
  },
  {
    accessorKey: 'capacidade',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={spacesTitlesColumns.capacidade}
      />
    ),
    cell: ({ row }) => {
      const raw = row.original.capacidade
      const capacity = typeof raw === 'string' ? parseInt(raw, 10) : raw

      return <span>{capacity}</span>
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={spacesTitlesColumns.isActive}
      />
    ),
    cell: ({ row }) => (
      <span
        className={cn(
          row.original.isActive ? 'text-green-700' : 'text-destructive',
        )}
      >
        {row.original.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      const isActive = filterValue[0] === true
      return row.getValue(columnId) === isActive
    },
    sortingFn: (rowA, rowB, columnId) => {
      return rowA.getValue(columnId) === rowB.getValue(columnId)
        ? 0
        : rowA.getValue(columnId)
          ? -1
          : 1
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={spacesTitlesColumns.createdAt}
      />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt || ''
      const formattedDate = format(new Date(date), 'dd/MM/yyyy', {
        locale: ptBR,
      })
      return <span>{formattedDate}</span>
    },
  },
  {
    accessorKey: 'userName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={spacesTitlesColumns.userName}
      />
    ),
    cell: ({ row }) => (
      <span className="break-words whitespace-normal">
        {transformTextIntoCapitalizedWords(row.original.userName || 'N/A')}
      </span>
    ),
  },
  {
    accessorKey: 'imagens',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={spacesTitlesColumns.imagens}
      />
    ),
    cell: ({ row }) => {
      // row.original.images é string[] (lista de paths ou URLs)
      const raw = row.original.imagens
      const items = Array.isArray(raw)
        ? raw
        : String(raw)
            .split(',')
            .map((i) => i.trim())
            .filter(Boolean)

      // exibe apenas a quantidade
      return <span>{items.length}</span>
    },
  },
  {
    accessorKey: 'floor',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={spacesTitlesColumns.floor}
      />
    ),
    cell: ({ row }) => {
      const floor = row.original.floor
      return <span>{floor || '-'}</span>
    },
  },
  {
    accessorKey: 'zone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={spacesTitlesColumns.zone} />
    ),
    cell: ({ row }) => {
      const zone = row.original.zone
      return <span>{zone || '-'}</span>
    },
  },
  {
    accessorKey: 'position',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={spacesTitlesColumns.position}
      />
    ),
    cell: ({ row }) => {
      const position = row.original.position
      return <span>{position || '-'}</span>
    },
  },
  {
    accessorKey: 'qrcodeUrl',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={spacesTitlesColumns.qrcodeUrl}
      />
    ),
    cell: ({ row }) => {
      const qrcodeUrl = row.original.qrcodeUrl
      return (
        <span className={cn(qrcodeUrl ? 'text-green-700' : 'text-destructive')}>
          {qrcodeUrl ? 'Sim' : 'Não'}
        </span>
      )
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue.length === 0) return true
      const hasQrCode = row.getValue(columnId) !== null
      return filterValue.includes(hasQrCode ? 'sim' : 'não')
    },
  },
  {
    id: 'actions', // Identificador único para a coluna
    cell: ({ row }) => {
      const {
        setMode,
        mode,
        setSelectedSpaceId,
        selectedSpaceId,
        toggleResetForm,
      } = useSpaceFormMode()

      const spaceId = row.original.id
      const spaceImages = row.original.imagens || []
      const hasImages = Array.isArray(spaceImages) && spaceImages.length > 0

      // Estado para controlar o diálogo do código de abertura
      const [isDoorCodeDialogOpen, setIsDoorCodeDialogOpen] = useState(false)
      const [doorCodeInfo, setDoorCodeInfo] = useState<{
        doorCode?: string
        expiresAt?: string
        isLoading: boolean
      }>({
        doorCode: undefined,
        expiresAt: undefined,
        isLoading: false,
      })

      // Hook para excluir imagens do S3
      const { trigger: deleteImage, isMutating: isDeletingImage } =
        useDeleteImage({
          swr: {
            onSuccess: (response) => {
              if (response.status !== 200) {
                console.error(
                  '❗ Erro ao deletar imagem:',
                  response.data.message,
                )
              }
            },
            onError: (error) => {
              console.error('💥 Erro ao deletar imagem:', error)
            },
          },
        })

      // Hook para excluir o espaço
      const { isMutating: isDeletingSpace, trigger: deleteSpace } =
        useDeleteSpace(spaceId, {
          swr: {
            onSuccess: (response) => {
              switch (response.status) {
                case 200: {
                  showToast({
                    message: 'Espaço apagado com sucesso.',
                    duration: 5000,
                    variant: 'success',
                  })

                  revalidateTags(['delete-space'])
                  setMode('add')
                  setSelectedSpaceId(null)
                  toggleResetForm()

                  window.scrollTo({ top: 0, behavior: 'smooth' })

                  break
                }
                default: {
                  showToast({
                    message: 'Ops... Falha ao apagar espaço, tente novamente.',
                    duration: 5000,
                    variant: 'error',
                  })

                  break
                }
              }
            },

            onError: () => {
              showToast({
                message: 'Ops... Falha ao apagar espaço, tente novamente.',
                duration: 5000,
                variant: 'error',
              })
            },
          },
        })

      // Hook para gerar código de abertura da porta
      const { trigger: generateDoorCode, isMutating: isGeneratingCode } =
        useOpenDoor(
          { spaceName: row.original.name, reservationId: row.original.id },
          {
            swr: {
              onSuccess: (response) => {
                if (response?.status === 200 && response?.data?.doorCode) {
                  // Atualizar os dados do código e manter o diálogo aberto
                  setDoorCodeInfo({
                    doorCode: response.data.doorCode,
                    expiresAt: response.data.expiresAt,
                    isLoading: false,
                  })
                } else {
                  // Esconder o diálogo e mostrar toast de erro
                  setIsDoorCodeDialogOpen(false)
                  setDoorCodeInfo({
                    doorCode: undefined,
                    expiresAt: undefined,
                    isLoading: false,
                  })
                  showToast({
                    message:
                      'Não foi possível gerar o código de abertura. Tente novamente.',
                    duration: 5000,
                    variant: 'error',
                  })
                }
              },
              onError: (error) => {
                // Esconder o diálogo e mostrar toast de erro
                setIsDoorCodeDialogOpen(false)
                setDoorCodeInfo({
                  doorCode: undefined,
                  expiresAt: undefined,
                  isLoading: false,
                })
                console.error('💥 Erro ao gerar código de abertura:', error)
                showToast({
                  message: 'Erro ao gerar código de abertura. Tente novamente.',
                  duration: 5000,
                  variant: 'error',
                })
              },
            },
          },
        )

      // Hook para gerar QR Code para o espaço
      const { trigger: generateQrCode, isMutating: isGeneratingQrCode } =
        useSpaceQrcode(spaceId, {
          swr: {
            onSuccess: (response) => {
              if (response?.status === 200 && response?.data?.qrcodeUrl) {
                // Faz o download do QR Code gerado
                downloadQrCode(response.data.qrcodeUrl)

                // Revalidar para atualizar a informação na tabela
                revalidateTags(['update-space-qr-code'])

                showToast({
                  message: 'QR Code gerado com sucesso!',
                  duration: 3000,
                  variant: 'success',
                })
              } else {
                showToast({
                  message: 'Não foi possível gerar o QR Code. Tente novamente.',
                  duration: 5000,
                  variant: 'error',
                })
              }
            },
            onError: (error) => {
              console.error('💥 Erro ao gerar QR Code:', error)
              showToast({
                message: 'Erro ao gerar QR Code. Tente novamente.',
                duration: 5000,
                variant: 'error',
              })
            },
          },
        })

      // Função para lidar com a exclusão de imagens e do espaço
      const handleDelete = async () => {
        try {
          // Se o espaço tem imagens, deleta cada uma delas primeiro
          if (hasImages) {
            // Feedback visual para o usuário
            showToast({
              message: 'Removendo imagens associadas ao espaço...',
              duration: 3000,
              variant: 'info',
            })

            // Deleta todas as imagens em sequência
            for (const imagePath of spaceImages) {
              try {
                await deleteImage({ imagePath })
              } catch (error) {
                console.error(`💥 Erro ao deletar imagem ${imagePath}:`, error)
                // Continue mesmo se houver erro em uma imagem
              }
            }
          }

          // Após excluir todas as imagens (ou se não houver imagens), exclui o espaço
          deleteSpace()
        } catch (error) {
          console.error('💥 Erro ao processar exclusão:', error)
          showToast({
            message: 'Erro ao excluir espaço. Tente novamente.',
            duration: 5000,
            variant: 'error',
          })
        }
      }

      const handleWarningDelete = () => {
        showToast({
          message:
            'Você tem certeza que deseja apagar este espaço? Essa ação não pode ser desfeita.',
          duration: Infinity,
          variant: 'warning',
          firstButton: {
            text: 'Cancelar',
            variant: 'ghost',
            onClick: () => ({}),
          },
          secondButton: {
            text: 'Apagar',
            variant: 'destructive',
            onClick: () => {
              handleDelete()
            },
          },
        })
      }

      const handleEditMode = () => {
        setMode('edit')
        setSelectedSpaceId(spaceId)

        // Aguarda próximo tick para garantir que o DOM já atualizou
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth',
          })
        }, 100)
      }

      const handleImageMode = () => {
        setMode('image')
        setSelectedSpaceId(spaceId)

        // Aguarda próximo tick para garantir que o DOM já atualizou
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth',
          })
        }, 100)
      }

      const handleWarningOpenDoor = () => {
        showToast({
          message:
            'Como administrador, você pode gerar um código de abertura para este espaço sem necessidade de agendamento.',
          duration: Infinity,
          variant: 'warning',
          firstButton: {
            text: 'Cancelar',
            variant: 'ghost',
            onClick: () => ({}),
          },
          secondButton: {
            text: 'Gerar Código',
            variant: 'default',
            onClick: () => {
              // Mostrar diálogo imediatamente com estado de loading
              setDoorCodeInfo({
                doorCode: undefined,
                expiresAt: undefined,
                isLoading: true,
              })
              setIsDoorCodeDialogOpen(true)

              generateDoorCode()
            },
          },
        })
      }

      // Função para fazer download do QR Code
      const downloadQrCode = (url: string) => {
        try {
          // Extraindo o nome do arquivo da URL
          // Formato da URL esperado: 'images/espacos/qrcode/qrcode-espaco-bbz-${spaceId}.png'
          const fileName =
            url.split('/').pop() || `qrcode-espaco-bbz-${spaceId}.png`

          // Montando a URL completa com o bucket
          const fullUrl = url.startsWith('http')
            ? url
            : `${env.NEXT_PUBLIC_BUCKET}/${url}`

          // Cria um elemento de âncora temporário
          const link = document.createElement('a')
          link.href = fullUrl
          link.target = '_blank'
          link.download = fileName

          // Adiciona ao DOM, clica e remove
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          console.log('📥 Download iniciado:', fileName)
        } catch (error) {
          console.error('💥 Erro ao fazer download do QR Code:', error)
          showToast({
            message: 'Erro ao baixar o QR Code. Tente novamente.',
            duration: 5000,
            variant: 'error',
          })
        }
      }

      // Função para lidar com o clique no botão de QR Code
      const handleQrCode = () => {
        const qrcodeUrl = row.original.qrcodeUrl

        if (qrcodeUrl) {
          // Se já existe um QR Code, apenas faz o download
          downloadQrCode(qrcodeUrl)

          showToast({
            message: 'Fazendo download do QR Code...',
            duration: 3000,
            variant: 'info',
          })
        } else {
          // Se não existe, mostra confirmação para gerar
          showToast({
            message: 'Deseja gerar um QR Code para este espaço?',
            duration: Infinity,
            variant: 'warning',
            firstButton: {
              text: 'Cancelar',
              variant: 'ghost',
              onClick: () => ({}),
            },
            secondButton: {
              text: 'Gerar',
              variant: 'default',
              onClick: () => {
                showToast({
                  message: 'Gerando QR Code...',
                  duration: 3000,
                  variant: 'info',
                })

                // Chama a API para gerar o QR Code
                generateQrCode()
              },
            },
          })
        }
      }

      return (
        <div className="flex min-w-[80px] flex-wrap items-center justify-end gap-2">
          <Button
            disabled={
              (mode === 'image' && spaceId === selectedSpaceId) ||
              isDeletingImage ||
              isDeletingSpace
            }
            variant="outline"
            size="icon"
            onClick={handleImageMode}
          >
            <ImagePlusIcon />
          </Button>
          <Button
            disabled={
              (mode === 'edit' && spaceId === selectedSpaceId) ||
              isDeletingImage ||
              isDeletingSpace
            }
            size="icon"
            onClick={handleEditMode}
          >
            <PencilIcon />
          </Button>
          <Button
            disabled={isGeneratingCode || isDeletingImage || isDeletingSpace}
            variant="ghost"
            size="icon"
            onClick={handleWarningOpenDoor}
          >
            <LockOpenIcon />
          </Button>
          <Button
            disabled={isGeneratingQrCode || isDeletingImage || isDeletingSpace}
            variant="ghost"
            size="icon"
            onClick={handleQrCode}
          >
            <QrCodeIcon />
          </Button>
          <Button
            disabled={isDeletingImage || isDeletingSpace}
            variant="ghost"
            size="icon"
            onClick={handleWarningDelete}
            className="group hover:bg-destructive hover:text-destructive-foreground text-destructive"
          >
            <TrashIcon />
          </Button>

          {/* Componente Dialog para exibir o código de abertura da porta */}
          <DoorCodeDialog
            isOpen={isDoorCodeDialogOpen}
            onOpenChange={setIsDoorCodeDialogOpen}
            doorCode={doorCodeInfo?.doorCode}
            expiresAt={doorCodeInfo?.expiresAt}
            spaceName={row.original.name}
            isLoading={doorCodeInfo?.isLoading}
          />
        </div>
      )
    },
  },
]
