'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { ListMembers200MembersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { removeMember } from '@/api/endpoints/team/team'
import { showToast } from '@/components/ShowToast'
import { Button } from '@/components/ui/button'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DataTableColumnHeader } from '../data-table-column-header'

export const membersTitlesColumns = {
  userName: 'Nome',
  userEmail: 'Email',
  assignedByName: 'Adicionado por',
  createdAt: 'Data de Adição',
}

function RemoveMemberButton({ member }: { member: ListMembers200MembersItem }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleRemoveMember() {
    showToast({
      message: `Deseja realmente remover ${transformTextIntoCapitalizedWords(member.userName || member.userEmail)} da equipe?`,
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
            const response = await removeMember(member.userId)

            if (response.status === 200) {
              showToast({
                message: 'Membro removido com sucesso!',
                duration: 5000,
                variant: 'success',
              })
              revalidateTags(['list-members'])
            } else if (response.status === 403) {
              showToast({
                message: 'Você não tem permissão para remover este membro.',
                duration: 5000,
                variant: 'error',
              })
            } else if (response.status === 404) {
              showToast({
                message: 'Membro não encontrado.',
                duration: 5000,
                variant: 'error',
              })
            } else {
              showToast({
                message: 'Erro ao remover membro. Tente novamente.',
                duration: 5000,
                variant: 'error',
              })
            }
          } catch {
            showToast({
              message: 'Erro ao remover membro. Tente novamente.',
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
      onClick={handleRemoveMember}
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

export const columnsMembers: ColumnDef<ListMembers200MembersItem>[] = [
  {
    accessorKey: 'userName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={membersTitlesColumns.userName}
      />
    ),
    cell: ({ row }) => {
      const member = row.original
      return (
        <span className="break-words whitespace-normal">
          {transformTextIntoCapitalizedWords(member.userName || 'N/A')}
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
      <span className="text-primary">{membersTitlesColumns.userEmail}</span>
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
        title={membersTitlesColumns.assignedByName}
      />
    ),
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className="flex flex-col">
          <span className="break-words whitespace-normal">
            {transformTextIntoCapitalizedWords(member.assignedByName || 'N/A')}
          </span>
          <span className="text-muted-foreground text-xs">
            {member.assignedByEmail}
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
        title={membersTitlesColumns.createdAt}
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
      const member = row.original
      return (
        <div className="flex justify-end">
          <RemoveMemberButton member={member} />
        </div>
      )
    },
  },
]
