import { SpaceFormModeProvider } from '@/context/SpaceFormModeProvider'
import { webserver } from '@/infra/webserver'
import { fetchCurrentUserInServer } from '@/services/userService'
import { redirect } from 'next/navigation'

export default async function SpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await fetchCurrentUserInServer()

  // Verifica se o usuário está autenticado e tem a função de admin
  if (user?.role === 'user') {
    redirect(`${webserver.host}/espacos`)
  }
  return <SpaceFormModeProvider>{children}</SpaceFormModeProvider>
}
