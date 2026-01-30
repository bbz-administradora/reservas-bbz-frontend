import { fetchTeamMembersInServer } from '@/services/teamService'
import {
  fetchCurrentUserInServer,
  fetchUserAbsencesInServer,
} from '@/services/userService'
import { AlertCircle, ShieldX } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AfastamentosClient } from './afastamentos-client'

export default async function AfastamentosPage() {
  // Buscar usuário para verificar permissões
  const { user, isAuthenticated } = await fetchCurrentUserInServer()

  if (!isAuthenticated || !user) {
    redirect('/login')
  }

  // Verificar se o usuário tem permissão (admin, dev, diretor ou supervisor)
  const canManageAbsences =
    user.role === 'admin' ||
    user.role === 'dev' ||
    user.teamPosition === 'director' ||
    user.teamPosition === 'supervisor'

  if (!canManageAbsences) {
    return (
      <div
        id="main"
        className="wrapper flex flex-1 flex-col items-center justify-center gap-4 p-8"
      >
        <ShieldX className="text-destructive size-12" />
        <p className="text-muted-foreground max-w-md text-center">
          Você não tem permissão para acessar esta funcionalidade. Apenas
          supervisores, diretores e administradores podem gerenciar
          afastamentos.
        </p>
      </div>
    )
  }

  // Buscar membros do time e afastamentos em paralelo
  const [teamData, absencesData] = await Promise.all([
    fetchTeamMembersInServer(),
    fetchUserAbsencesInServer({ includeExpired: 'true' }),
  ])

  if (!teamData) {
    return (
      <div
        id="main"
        className="wrapper flex flex-1 flex-col items-center justify-center gap-4 p-8"
      >
        <AlertCircle className="text-destructive size-12" />
        <p className="text-muted-foreground max-w-md text-center">
          Erro ao carregar membros do time. Tente novamente mais tarde.
        </p>
      </div>
    )
  }

  // Mapeia os afastamentos para o formato esperado pelo client
  const absences =
    absencesData?.absences.map((absence) => ({
      userId: absence.userId,
      userName: absence.userName,
      userEmail: absence.userEmail,
      position: absence.position,
      supervisorName: absence.supervisorName,
      absenceStartDate: absence.absenceStartDate,
      absenceEndDate: absence.absenceEndDate,
      isActive: absence.isActive,
    })) ?? []

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <div className="w-full max-w-6xl">
        <AfastamentosClient
          initialMembers={teamData.members}
          initialAbsences={absences}
        />
      </div>
    </div>
  )
}
