import { webserver } from '@/infra/webserver'
import { fetchCurrentUserInServer } from '@/services/userService'
import { redirect } from 'next/navigation'

export default async function TeamManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, teamPosition } = await fetchCurrentUserInServer()

  // Verifica se o usuário está autenticado
  if (!user) {
    redirect(`${webserver.host}/login`)
  }

  // Admin e Dev podem acessar diretamente
  if (user.role === 'admin' || user.role === 'dev') {
    return <>{children}</>
  }

  // Usuário com role 'user' só pode acessar se for manager
  if (user.role === 'user' && teamPosition === 'manager') {
    return <>{children}</>
  }

  // Caso contrário, redireciona para espaços
  redirect(`${webserver.host}/espacos`)
}
