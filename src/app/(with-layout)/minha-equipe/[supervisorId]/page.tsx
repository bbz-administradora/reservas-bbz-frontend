import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { fetchListSupervisorsInServer } from '@/services/teamService'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { ArrowLeft, Construction, User, Users } from 'lucide-react'
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

  const supervisorName = transformTextIntoCapitalizedWords(
    supervisor.userName || 'Sem nome',
  )

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
      </div>

      {/* Info do supervisor */}
      <div className="bg-muted/50 flex w-full max-w-6xl items-center gap-4 rounded-lg p-4">
        <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full">
          <User className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <Text variant={'title-16-18-500'} className="text-foreground">
            {supervisorName}
          </Text>
          <Text variant={'title-14-16-500'} className="text-muted-foreground">
            {supervisor.userEmail}
          </Text>
        </div>
      </div>

      {/* Conteúdo em construção */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="bg-muted rounded-full p-6">
          <Construction className="text-primary h-16 w-16" />
        </div>

        <Text variant="title-22-32-700" className="text-primary">
          Funcionalidade em Construção
        </Text>

        <Text
          variant="title-16-18-500"
          className="text-muted-foreground max-w-md"
        >
          Em breve você poderá visualizar e gerenciar os membros da equipe de{' '}
          <strong>{supervisorName}</strong>. Adicione, remova e visualize os
          membros vinculados.
        </Text>

        <Button asChild className="mt-4">
          <Link href="/minha-equipe">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Supervisores
          </Link>
        </Button>
      </div>
    </div>
  )
}
