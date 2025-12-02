import { DataTableMembers } from '@/components/data-table/members/table-members'
import { MemberAddForm } from '@/components/forms/MemberAddForm'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  fetchListMembersInServer,
  fetchListSupervisorsInServer,
} from '@/services/teamService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ArrowLeft, ArrowRight, User, UserCog, Users } from 'lucide-react'
import Link from 'next/link'

export default async function MyTeamPage() {
  const { user, teamPosition } = await fetchCurrentUserInServer()

  // Se for Supervisor → Mostra direto a tela da equipe dele (membros)
  const isSupervisor = user?.role === 'user' && teamPosition === 'supervisor'

  // Se for Admin/Dev/Manager → Mostra lista de supervisores para escolher
  const showSupervisorsList =
    user?.role === 'admin' || user?.role === 'dev' || teamPosition === 'manager'

  // Buscar supervisores se for Admin/Dev/Manager
  const supervisorsData = showSupervisorsList
    ? await fetchListSupervisorsInServer()
    : null

  // Se for supervisor, buscar seus membros e informações do gerente
  const membersData = isSupervisor ? await fetchListMembersInServer() : null

  // Buscar informações do supervisor atual para obter o gerente
  const currentSupervisorData = isSupervisor
    ? await fetchListSupervisorsInServer()
    : null
  const currentSupervisor = currentSupervisorData?.supervisors.find(
    (s) => s.userId === user?.id,
  )

  // Ordenar supervisores por nome (alfabética)
  const sortedSupervisors = supervisorsData?.supervisors
    ? [...supervisorsData.supervisors].sort((a, b) => {
        const nameA = (a.userName || a.userEmail).toLowerCase()
        const nameB = (b.userName || b.userEmail).toLowerCase()
        return nameA.localeCompare(nameB, 'pt-BR')
      })
    : []

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Header com botão de voltar */}
      <div className="flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/espacos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Users className="text-primary h-6 w-6" />
            <Text variant={'title-22-32-700'}>
              {isSupervisor ? 'Minha Equipe' : 'Equipes dos Supervisores'}
            </Text>
          </div>
        </div>

        {showSupervisorsList && (
          <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-2">
            <Text variant={'title-16-18-500'} className="text-muted-foreground">
              Supervisores:
            </Text>
            <Text variant={'title-18-24-700'} className="text-primary">
              {supervisorsData?.totalCount || 0}
            </Text>
          </div>
        )}

        {isSupervisor && (
          <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-2">
            <Text variant={'title-16-18-500'} className="text-muted-foreground">
              Membros:
            </Text>
            <Text variant={'title-18-24-700'} className="text-primary">
              {membersData?.totalCount || 0}
            </Text>
          </div>
        )}
      </div>

      {/* Info do Gerente - exibido quando é supervisor */}
      {isSupervisor && currentSupervisor?.assignedByName && (
        <div className="bg-accent/10 border-accent flex w-full max-w-6xl items-center gap-4 rounded-lg border p-4">
          <div className="bg-accent text-accent-foreground flex h-12 w-12 items-center justify-center rounded-full">
            <UserCog className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <Text variant={'title-14-16-500'} className="text-muted-foreground">
              Seu Gerente
            </Text>
            <Text variant={'title-16-18-500'} className="text-foreground">
              {transformTextIntoCapitalizedWords(
                currentSupervisor.assignedByName,
              )}
            </Text>
            <Text variant={'title-14-16-500'} className="text-muted-foreground">
              {currentSupervisor.assignedByEmail}
            </Text>
          </div>
        </div>
      )}

      {/* Descrição */}
      <div className="bg-muted/50 w-full max-w-6xl rounded-lg p-4">
        <Text variant={'title-14-16-500'} className="text-muted-foreground">
          {isSupervisor
            ? 'Gerencie os membros da sua equipe de atendimento. Adicione, remova e visualize os membros vinculados a você.'
            : 'Selecione um supervisor para visualizar e gerenciar os membros da equipe dele.'}
        </Text>
      </div>

      {/* Conteúdo */}
      {showSupervisorsList ? (
        // Admin/Dev/Manager → Lista de supervisores em cards
        <div className="w-full max-w-6xl">
          {sortedSupervisors.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedSupervisors.map((supervisor) => (
                <Link
                  key={supervisor.id}
                  href={`/minha-equipe/${supervisor.userId}`}
                  className="bg-card hover:bg-accent/10 border-border group flex items-center gap-4 rounded-lg border p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full">
                    <User className="h-6 w-6" />
                  </div>

                  <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                    <Text
                      variant="title-16-18-500"
                      className="text-foreground truncate font-semibold"
                    >
                      {transformTextIntoCapitalizedWords(
                        supervisor.userName || 'Sem nome',
                      )}
                    </Text>
                    <Text
                      variant="title-14-16-500"
                      className="text-muted-foreground truncate"
                    >
                      {supervisor.userEmail}
                    </Text>
                  </div>

                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-muted/30 flex flex-col items-center justify-center rounded-lg py-12">
              <Users className="text-muted-foreground mb-4 h-12 w-12" />
              <Text
                variant={'title-18-24-700'}
                className="text-muted-foreground mb-2"
              >
                Nenhum supervisor nomeado
              </Text>
              <Text
                variant={'title-14-16-500'}
                className="text-muted-foreground"
              >
                Nomeie supervisores na página de Gestão de Equipe para
                visualizá-los aqui.
              </Text>
              <Button asChild className="mt-4">
                <Link href="/gestao-equipe">Ir para Gestão de Equipe</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Supervisor → Tela da equipe dele
        <div className="w-full max-w-6xl">
          {/* Tabela de membros */}
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
              <Text
                variant={'title-14-16-500'}
                className="text-muted-foreground"
              >
                Use o formulário abaixo para adicionar o primeiro membro da sua
                equipe.
              </Text>
            </div>
          )}

          <Separator className="bg-primary my-5 w-full" />

          {/* Formulário de adicionar membro */}
          <MemberAddForm className="w-full" />
        </div>
      )}
    </div>
  )
}
