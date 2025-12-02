import { webserver } from '@/infra/webserver'
import { fetchCurrentUserInServer } from '@/services/userService'
import { redirect } from 'next/navigation'

export default async function SupervisorTeamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, teamPosition } = await fetchCurrentUserInServer()

  // Verifica se o usuário está autenticado
  if (!user) {
    redirect(`${webserver.host}/login`)
  }

  // Admin, Dev e Manager podem acessar a equipe de qualquer supervisor
  if (
    user.role === 'admin' ||
    user.role === 'dev' ||
    teamPosition === 'manager'
  ) {
    return <>{children}</>
  }

  // Caso contrário, redireciona para espaços
  redirect(`${webserver.host}/espacos`)
}
