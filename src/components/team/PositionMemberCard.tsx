'use client'

import { useRemovePosition } from '@/api/endpoints/team/team'
import { showToast } from '@/components/ShowToast'
import { Text } from '@/components/Text'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Trash2, UserCog } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PositionMemberCardProps {
  id: string
  userId: string
  userName: string | null
  userEmail: string
  userAvatar: string | null
  assignedByName: string | null
  assignedByEmail: string
  createdAt: string
  canRemove: boolean
}

export function PositionMemberCard({
  userId,
  userName,
  userEmail,
  assignedByName,
  assignedByEmail,
  createdAt,
  canRemove,
}: PositionMemberCardProps) {
  const router = useRouter()

  const { trigger: removePosition, isMutating } = useRemovePosition(userId, {
    swr: {
      onSuccess: (response) => {
        showToast({
          message: response.data.message,
          variant: 'success',
        })
        router.refresh()
      },
      onError: (error: any) => {
        const errorMessage = error?.message || 'Erro ao remover membro'
        const errorAction = error?.action || 'Tente novamente mais tarde'

        showToast({
          message: `${errorMessage}. ${errorAction}`,
          variant: 'error',
        })
      },
    },
  })

  // Gerar iniciais para o avatar fallback
  function getInitials(name: string | null, email: string) {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  // Formatar data de nomeação
  const formattedDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <div className="bg-card border-border flex items-center justify-between rounded-lg border p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Avatar simples com iniciais */}
        <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium">
          {getInitials(userName, userEmail)}
        </div>

        <div className="flex flex-col">
          <Text variant="title-16-18-500" className="text-foreground">
            {userName || 'Sem nome'}
          </Text>
          <Text variant="title-14-16-500" className="text-muted-foreground">
            {userEmail}
          </Text>
          <div className="mt-1 flex items-center gap-1">
            <UserCog className="text-muted-foreground h-3 w-3" />
            <Text variant="title-14-16-500" className="text-muted-foreground">
              Nomeado por {assignedByName || assignedByEmail} • {formattedDate}
            </Text>
          </div>
        </div>
      </div>

      {canRemove && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isMutating}
            >
              {isMutating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover membro?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover{' '}
                <strong>{userName || userEmail}</strong> da equipe? Esta ação
                não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => removePosition({})}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
