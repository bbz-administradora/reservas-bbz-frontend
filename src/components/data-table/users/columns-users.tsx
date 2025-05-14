'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { ListUsers201UsersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useDeleteUser } from '@/api/endpoints/user/user'
import { showToast } from '@/components/ShowToast'
import { useUserFormMode } from '@/context/UserFormModeProvider'
import { cn } from '@/utils/mergeClassNames'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash, UserRoundPen } from 'lucide-react'
import { Button } from '../../ui/button'
import { DataTableColumnHeader } from '../data-table-column-header'

export const usersTitlesColumns = {
  name: 'Nome',
  email: 'Email',
  role: 'Role',
  accountStatus: 'Status',
  createdAt: 'Criado em',
}

export const columnsUsers: ColumnDef<ListUsers201UsersItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={usersTitlesColumns.name} />
    ),
    cell: ({ row }) => (
      <span className="break-words whitespace-normal">
        {transformTextIntoCapitalizedWords(row.original.name || 'N/A')}
      </span>
    ),
  },
  {
    accessorKey: 'email',
    header: () => (
      <span className="text-primary">{usersTitlesColumns.email}</span>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={usersTitlesColumns.role} />
    ),
  },
  {
    accessorKey: 'accountStatus',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={usersTitlesColumns.accountStatus}
      />
    ),
    cell: ({ row }) => (
      <span
        className={cn(
          row.original.accountStatus ? 'text-green-700' : 'text-destructive',
        )}
      >
        {row.original.accountStatus ? 'Active' : 'Inactive'}
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
        title={usersTitlesColumns.createdAt}
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
    id: 'actions', // Identificador único para a coluna
    cell: ({ row }) => {
      const { setMode, mode, setSelectedUserId, selectedUserId } =
        useUserFormMode()

      const userId = row.original.id

      const { isMutating, trigger: deleteUser } = useDeleteUser(userId, {
        swr: {
          onSuccess: (response) => {
            switch (response.status) {
              case 200: {
                showToast({
                  message: 'Usuário apagado com sucesso.',
                  duration: 5000,
                  variant: 'success',
                })

                revalidateTags(['delete-user'])
                setMode('add')
                setSelectedUserId(null)

                break
              }
              default: {
                showToast({
                  message: 'Ops... Falha ao apagar usuário, tente novamente.',
                  duration: 5000,
                  variant: 'error',
                })

                break
              }
            }
          },

          onError: () => {
            showToast({
              message: 'Ops... Falha ao apagar usuário, tente novamente.',
              duration: 5000,
              variant: 'error',
            })
          },
        },
      })

      const handleWarningDelete = () => {
        showToast({
          message:
            'Você tem certeza que deseja apagar este usuário? Essa ação não pode ser desfeita.',
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
              deleteUser()
            },
          },
        })
      }

      const handleEditMode = () => {
        if (mode === 'add') {
          setMode('edit')
        }

        setSelectedUserId(userId)

        // Aguarda próximo tick para garantir que o DOM já atualizou
        setTimeout(() => {
          const target = document.getElementById('form-edit-user')
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }

      return (
        <div className="flex justify-end gap-2">
          <Button
            disabled={isMutating}
            variant="ghost"
            size="icon"
            onClick={handleWarningDelete}
            className="group hover:bg-destructive hover:text-destructive-foreground text-destructive"
          >
            <Trash />
          </Button>
          <Button
            disabled={mode === 'edit' && userId === selectedUserId}
            size="icon"
            onClick={handleEditMode}
          >
            <UserRoundPen />
          </Button>
        </div>
      )
    },
  },
]
