import { fetchOutpostsInServer } from '@/services/outpostService'
import { fetchTeamMembersForOutpostsInServer } from '@/services/teamService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { AlertCircle, ShieldX } from 'lucide-react'
import { redirect } from 'next/navigation'
import { PostosAvancadosClient } from './postos-avancados-client'

export default async function PostosAvancadosPage() {
  // Buscar usuário para verificar permissões
  const { user, isAuthenticated } = await fetchCurrentUserInServer()

  if (!isAuthenticated || !user) {
    redirect('/login')
  }

  // Verificar se o usuário tem permissão (admin, dev, diretor ou supervisor)
  const canManageOutposts =
    user.role === 'admin' ||
    user.role === 'dev' ||
    user.teamPosition === 'director' ||
    user.teamPosition === 'supervisor'

  if (!canManageOutposts) {
    return (
      <div
        id="main"
        className="wrapper flex flex-1 flex-col items-center justify-center gap-4 p-8"
      >
        <ShieldX className="text-destructive size-12" />
        <p className="text-muted-foreground max-w-md text-center">
          Você não tem permissão para acessar esta funcionalidade. Apenas
          supervisores, diretores e administradores podem gerenciar postos
          avançados.
        </p>
      </div>
    )
  }

  // Buscar membros do time e postos avançados em paralelo
  const [teamData, outpostsData] = await Promise.all([
    fetchTeamMembersForOutpostsInServer(),
    fetchOutpostsInServer({ status: 'all' }),
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

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <div className="w-full max-w-6xl">
        <PostosAvancadosClient
          initialMembers={teamData.members}
          initialOutposts={outpostsData?.outposts ?? []}
        />
      </div>
    </div>
  )
}
