'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { ListRooms200RoomsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useDeleteImage } from '@/api/endpoints/image/image'
import { useDeleteRoom } from '@/api/endpoints/room/room'
import { showToast } from '@/components/ShowToast'
import { useRoomFormMode } from '@/context/RoomFormModeProvider'
import { cn } from '@/utils/mergeClassNames'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ImagePlusIcon, PencilIcon, TrashIcon } from 'lucide-react'
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
            disabled={isDeletingImage || isDeletingRoom}
            variant="ghost"
            size="icon"
            onClick={handleWarningDelete}
            className="group hover:bg-destructive hover:text-destructive-foreground text-destructive"
          >
            <TrashIcon />
          </Button>
        </div>
      )
    },
  },
]
