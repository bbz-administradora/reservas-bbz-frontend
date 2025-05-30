'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { ListRooms200RoomsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useDeleteImage } from '@/api/endpoints/image/image'
import { useDeleteRoom, useOpenDoor } from '@/api/endpoints/room/room'
import { DoorCodeDialog } from '@/components/DoorCodeDialog'
import { showToast } from '@/components/ShowToast'
import { useRoomFormMode } from '@/context/RoomFormModeProvider'
import { cn } from '@/utils/mergeClassNames'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ImagePlusIcon,
  LockOpenIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { DataTableColumnHeader } from '../data-table-column-header'

export const roomsTitlesColumns = {
  name: 'Nome',
  description: 'Descrição',
  recursos: 'Recursos',
  capacidade: 'Capacidade',
  isActive: 'Status',
  createdAt: 'Criado em',
  userName: 'Criado por',
  imagens: 'Imagens',
  actions: 'Ações',
}

export const columnsRooms: ColumnDef<ListRooms200RoomsItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={roomsTitlesColumns.name} />
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
        {roomsTitlesColumns.description}
      </span>
    ),
    cell: (info) => (
      <span className="line-clamp-4 break-words whitespace-normal lg:line-clamp-3">
        {info.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'recursos',
    header: () => (
      <span className="text-primary">
        {transformTextIntoCapitalizedWords(roomsTitlesColumns.recursos)}
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
        title={roomsTitlesColumns.capacidade}
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
        title={roomsTitlesColumns.isActive}
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
        title={roomsTitlesColumns.createdAt}
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
        title={roomsTitlesColumns.userName}
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
        title={roomsTitlesColumns.imagens}
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
    id: 'actions', // Identificador único para a coluna
    cell: ({ row }) => {
      const {
        setMode,
        mode,
        setSelectedRoomId,
        selectedRoomId,
        toggleResetForm,
      } = useRoomFormMode()

      const roomId = row.original.id
      const roomImages = row.original.imagens || []
      const hasImages = Array.isArray(roomImages) && roomImages.length > 0

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

      // Hook para excluir a sala
      const { isMutating: isDeletingRoom, trigger: deleteRoom } = useDeleteRoom(
        roomId,
        {
          swr: {
            onSuccess: (response) => {
              switch (response.status) {
                case 200: {
                  showToast({
                    message: 'Sala apagada com sucesso.',
                    duration: 5000,
                    variant: 'success',
                  })

                  revalidateTags(['delete-room'])
                  setMode('add')
                  setSelectedRoomId(null)
                  toggleResetForm()

                  window.scrollTo({ top: 0, behavior: 'smooth' })

                  break
                }
                default: {
                  showToast({
                    message: 'Ops... Falha ao apagar sala, tente novamente.',
                    duration: 5000,
                    variant: 'error',
                  })

                  break
                }
              }
            },

            onError: () => {
              showToast({
                message: 'Ops... Falha ao apagar sala, tente novamente.',
                duration: 5000,
                variant: 'error',
              })
            },
          },
        },
      )

      // Hook para gerar código de abertura da porta
      const { trigger: generateDoorCode, isMutating: isGeneratingCode } =
        useOpenDoor(
          { roomName: row.original.name },
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

      // Função para lidar com a exclusão de imagens e da sala
      const handleDelete = async () => {
        try {
          // Se a sala tem imagens, deleta cada uma delas primeiro
          if (hasImages) {
            // Feedback visual para o usuário
            showToast({
              message: 'Removendo imagens associadas à sala...',
              duration: 3000,
              variant: 'info',
            })

            // Deleta todas as imagens em sequência
            for (const imagePath of roomImages) {
              try {
                await deleteImage({ imagePath })
              } catch (error) {
                console.error(`💥 Erro ao deletar imagem ${imagePath}:`, error)
                // Continue mesmo se houver erro em uma imagem
              }
            }
          }

          // Após excluir todas as imagens (ou se não houver imagens), exclui a sala
          deleteRoom()
        } catch (error) {
          console.error('💥 Erro ao processar exclusão:', error)
          showToast({
            message: 'Erro ao excluir sala. Tente novamente.',
            duration: 5000,
            variant: 'error',
          })
        }
      }

      const handleWarningDelete = () => {
        showToast({
          message:
            'Você tem certeza que deseja apagar esta sala? Essa ação não pode ser desfeita.',
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
        setSelectedRoomId(roomId)

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
        setSelectedRoomId(roomId)

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
            'Como administrador, você pode gerar um código de abertura para esta sala sem necessidade de agendamento.',
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

      return (
        <div className="flex min-w-[80px] flex-wrap items-center justify-end gap-2">
          <Button
            disabled={
              (mode === 'image' && roomId === selectedRoomId) ||
              isDeletingImage ||
              isDeletingRoom
            }
            variant="outline"
            size="icon"
            onClick={handleImageMode}
          >
            <ImagePlusIcon />
          </Button>
          <Button
            disabled={
              (mode === 'edit' && roomId === selectedRoomId) ||
              isDeletingImage ||
              isDeletingRoom
            }
            size="icon"
            onClick={handleEditMode}
          >
            <PencilIcon />
          </Button>
          <Button
            disabled={isGeneratingCode || isDeletingImage || isDeletingRoom}
            variant="ghost"
            size="icon"
            onClick={handleWarningOpenDoor}
            // TODO: retirar hidden ao liberar quarta entrega de reservas
            className="hidden"
          >
            <LockOpenIcon />
          </Button>
          <Button
            disabled={isDeletingImage || isDeletingRoom}
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
            roomName={row.original.name}
            isLoading={doorCodeInfo?.isLoading}
          />
        </div>
      )
    },
  },
]
