import { DataTableMembers } from '@/components/data-table/members/table-members'
import { MemberAddForm } from '@/components/forms/MemberAddForm'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  fetchListMembersInServer,
  fetchListSupervisorsInServer,
} from '@/services/teamService'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ArrowLeft, User, UserCog, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface SupervisorTeamPageProps {
  params: Promise<{
    supervisorId: string
  }>
}

export default async function SupervisorTeamPage({
  params,
}: SupervisorTeamPageProps) {
  const { supervisorId } = await params

  // Buscar supervisores e encontrar o supervisor específico
  const supervisorsData = await fetchListSupervisorsInServer()
  const supervisor = supervisorsData?.supervisors.find(
    (s) => s.userId === supervisorId,
  )

  // Se não encontrar o supervisor, retorna 404
  if (!supervisor) {
    notFound()
  }

  // Buscar membros deste supervisor específico
  const membersData = await fetchListMembersInServer(supervisorId)

  const supervisorName = transformTextIntoCapitalizedWords(
    supervisor.userName || 'Sem nome',
  )

  const managerName = supervisor.assignedByName
    ? transformTextIntoCapitalizedWords(supervisor.assignedByName)
    : null

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Header com botão de voltar */}
      <div className="flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/minha-equipe">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Users className="text-primary h-6 w-6" />
            <Text variant={'title-22-32-700'}>Equipe do Supervisor</Text>
          </div>
        </div>

        <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-2">
          <Text variant={'title-16-18-500'} className="text-muted-foreground">
            Membros:
          </Text>
          <Text variant={'title-18-24-700'} className="text-primary">
            {membersData?.totalCount || 0}
          </Text>
        </div>
      </div>

      {/* Info do Gerente */}
      {managerName && (
        <div className="bg-accent/10 border-accent flex w-full max-w-6xl items-center gap-4 rounded-lg border p-4">
          <div className="bg-accent text-accent-foreground flex h-12 w-12 items-center justify-center rounded-full">
            <UserCog className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <Text variant={'title-14-16-500'} className="text-muted-foreground">
              Gerente Responsável
            </Text>
            <Text variant={'title-16-18-500'} className="text-foreground">
              {managerName}
            </Text>
            <Text variant={'title-14-16-500'} className="text-muted-foreground">
              {supervisor.assignedByEmail}
            </Text>
          </div>
        </div>
      )}

      {/* Info do supervisor */}
      <div className="bg-primary/10 border-primary flex w-full max-w-6xl items-center gap-4 rounded-lg border p-4">
        <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full">
          <User className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <Text variant={'title-14-16-500'} className="text-muted-foreground">
            Supervisor
          </Text>
          <Text variant={'title-16-18-500'} className="text-foreground">
            {supervisorName}
          </Text>
          <Text variant={'title-14-16-500'} className="text-muted-foreground">
            {supervisor.userEmail}
          </Text>
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-muted/50 w-full max-w-6xl rounded-lg p-4">
        <Text variant={'title-14-16-500'} className="text-muted-foreground">
          Visualize e gerencie os membros da equipe de{' '}
          <strong>{supervisorName}</strong>. Você pode adicionar novos membros
          ou remover membros existentes.
        </Text>
      </div>

      {/* Tabela de membros */}
      <div className="w-full max-w-6xl">
        {membersData && membersData.members.length > 0 ? (
          <DataTableMembers
            initialData={membersData.members}
            className="mb-5"
          />
        ) : (
          <div className="bg-muted/30 flex flex-col items-center justify-center rounded-lg py-12">
            <Users className="text-muted-foreground mb-4 h-12 w-12" />
            <Text
              variant={'title-18-24-700'}
              className="text-muted-foreground mb-2"
            >
              Nenhum membro na equipe
            </Text>
            <Text variant={'title-14-16-500'} className="text-muted-foreground">
              Use o formulário abaixo para adicionar o primeiro membro à equipe
              de <strong>{supervisorName}</strong>.
            </Text>
          </div>
        )}
      </div>

      <Separator className="bg-primary w-full max-w-6xl" />

      {/* Formulário de adicionar membro */}
      <MemberAddForm className="w-full max-w-6xl" supervisorId={supervisorId} />
    </div>
  )
}
