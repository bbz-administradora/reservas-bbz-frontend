'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { ListSupervisors200SupervisorsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { removeSupervisor } from '@/api/endpoints/team/team'
import { showToast } from '@/components/ShowToast'
import { Button } from '@/components/ui/button'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DataTableColumnHeader } from '../data-table-column-header'

export const supervisorsTitlesColumns = {
  userName: 'Nome',
  userEmail: 'Email',
  assignedByName: 'Nomeado por',
  createdAt: 'Data de Nomeação',
}

function RemoveSupervisorButton({
  supervisor,
}: {
  supervisor: ListSupervisors200SupervisorsItem
}) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleRemoveSupervisor() {
    showToast({
      message: `Deseja realmente remover ${transformTextIntoCapitalizedWords(supervisor.userName || supervisor.userEmail)} da posição de supervisor?`,
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
            const response = await removeSupervisor(supervisor.userId)

            if (response.status === 200) {
              showToast({
                message: 'Supervisor removido com sucesso!',
                duration: 5000,
                variant: 'success',
              })
              revalidateTags(['list-supervisors'])
            } else if (response.status === 403) {
              showToast({
                message: 'Você não tem permissão para remover este supervisor.',
                duration: 5000,
                variant: 'error',
              })
            } else if (response.status === 404) {
              showToast({
                message: 'Supervisor não encontrado.',
                duration: 5000,
                variant: 'error',
              })
            } else {
              showToast({
                message: 'Erro ao remover supervisor. Tente novamente.',
                duration: 5000,
                variant: 'error',
              })
            }
          } catch {
            showToast({
              message: 'Erro ao remover supervisor. Tente novamente.',
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
      onClick={handleRemoveSupervisor}
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

export const columnsSupervisors: ColumnDef<ListSupervisors200SupervisorsItem>[] =
  [
    {
      accessorKey: 'userName',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={supervisorsTitlesColumns.userName}
        />
      ),
      cell: ({ row }) => {
        const supervisor = row.original
        return (
          <span className="break-words whitespace-normal">
            {transformTextIntoCapitalizedWords(supervisor.userName || 'N/A')}
          </span>
        )
      },
      filterFn: (row, id, value) => {
        const userName = row.getValue(id) as string | null
        if (!userName) return false
        return userName.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      accessorKey: 'userEmail',
      header: () => (
        <span className="text-primary">
          {supervisorsTitlesColumns.userEmail}
        </span>
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
          title={supervisorsTitlesColumns.assignedByName}
        />
      ),
      cell: ({ row }) => {
        const supervisor = row.original
        return (
          <div className="flex flex-col">
            <span className="break-words whitespace-normal">
              {transformTextIntoCapitalizedWords(
                supervisor.assignedByName || 'N/A',
              )}
            </span>
            <span className="text-muted-foreground text-xs">
              {supervisor.assignedByEmail}
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
          title={supervisorsTitlesColumns.createdAt}
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
        const supervisor = row.original
        return (
          <div className="flex justify-end">
            <RemoveSupervisorButton supervisor={supervisor} />
          </div>
        )
      },
    },
  ]
