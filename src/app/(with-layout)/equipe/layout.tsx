import { webserver } from '@/infra/webserver'
import { fetchCurrentUserInServer } from '@/services/userService'
import { redirect } from 'next/navigation'

type PositionType =
  | 'director'
  | 'supervisor'
  | 'manager'
  | 'assistant_manager'
  | 'assistant'

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, teamPosition: rawTeamPosition } =
    await fetchCurrentUserInServer()

  // Cast para o novo tipo de posição (backend já retorna os valores novos)
  const teamPosition = rawTeamPosition as PositionType | null

  // Verifica se o usuário está autenticado
  if (!user) {
    redirect(`${webserver.host}/login`)
  }

  // Admin e Dev podem acessar (podem nomear Director)
  if (user.role === 'admin' || user.role === 'dev') {
    return <>{children}</>
  }

  // Director pode acessar (pode nomear Supervisor)
  if (teamPosition === 'director') {
    return <>{children}</>
  }

  // Supervisor pode acessar (pode nomear Manager)
  if (teamPosition === 'supervisor') {
    return <>{children}</>
  }

  // Manager pode acessar (pode nomear Assistant Manager e Assistant)
  if (teamPosition === 'manager') {
    return <>{children}</>
  }

  // Assistant Manager pode acessar (pode nomear Assistant)
  if (teamPosition === 'assistant_manager') {
    return <>{children}</>
  }

  // Caso contrário, redireciona para espaços
  redirect(`${webserver.host}/espacos`)
}
