'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { ListManagers200ManagersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { removeManager } from '@/api/endpoints/team/team'
import { showToast } from '@/components/ShowToast'
import { Button } from '@/components/ui/button'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DataTableColumnHeader } from '../data-table-column-header'

export const managersTitlesColumns = {
  userName: 'Nome',
  userEmail: 'Email',
  assignedByName: 'Nomeado por',
  createdAt: 'Data de Nomeação',
}

function RemoveManagerButton({
  manager,
}: {
  manager: ListManagers200ManagersItem
}) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleRemoveManager() {
    showToast({
      message: `Deseja realmente remover ${transformTextIntoCapitalizedWords(manager.userName || manager.userEmail)} da posição de gerente?`,
      duration: Infinity,
      variant: 'warning',
      firstButton: {
        text: 'Cancelar',
        variant: 'ghost',
        onClick: () => ({}),
      },
      secondButton: {
        text: 'Remover',
        variant: 'destructive',
        onClick: async () => {
          setIsLoading(true)
          try {
            const response = await removeManager(manager.userId)

            if (response.status === 200) {
              showToast({
                message: 'Gerente removido com sucesso!',
                duration: 5000,
                variant: 'success',
              })
              revalidateTags(['list-managers'])
            } else {
              showToast({
                message: 'Erro ao remover gerente. Tente novamente.',
                duration: 5000,
                variant: 'error',
              })
            }
          } catch (error) {
            showToast({
              message: 'Erro ao remover gerente. Tente novamente.',
              duration: 5000,
              variant: 'error',
            })
          } finally {
            setIsLoading(false)
          }
        },
      },
    })
  }

  return (
    <Button
      disabled={isLoading}
      variant="ghost"
      size="icon"
      onClick={handleRemoveManager}
      className="group text-destructive hover:bg-destructive hover:text-destructive-foreground"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
}

export const columnsManagers: ColumnDef<ListManagers200ManagersItem>[] = [
  {
    accessorKey: 'userName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={managersTitlesColumns.userName}
      />
    ),
    cell: ({ row }) => {
      const manager = row.original
      return (
        <span className="break-words whitespace-normal">
          {transformTextIntoCapitalizedWords(manager.userName || 'N/A')}
        </span>
      )
    },
  },
  {
    accessorKey: 'userEmail',
    header: () => (
      <span className="text-primary">{managersTitlesColumns.userEmail}</span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.userEmail}</span>
    ),
  },
  {
    accessorKey: 'assignedByName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={managersTitlesColumns.assignedByName}
      />
    ),
    cell: ({ row }) => {
      const manager = row.original
      return (
        <div className="flex flex-col">
          <span className="break-words whitespace-normal">
            {transformTextIntoCapitalizedWords(manager.assignedByName || 'N/A')}
          </span>
          <span className="text-muted-foreground text-xs">
            {manager.assignedByEmail}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={managersTitlesColumns.createdAt}
      />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt
      const formattedDate = format(new Date(date), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      })
      return <span>{formattedDate}</span>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const manager = row.original
      return (
        <div className="flex justify-end">
          <RemoveManagerButton manager={manager} />
        </div>
      )
    },
  },
]
