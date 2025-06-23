import { UserFormModeProvider } from '@/context/UserFormModeProvider'
import { webserver } from '@/infra/webserver'
import { fetchCurrentUserInServer } from '@/services/userService'
import { redirect } from 'next/navigation'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await fetchCurrentUserInServer()

  // Verifica se o usuário está autenticado e tem a função de admin
  if (user?.role === 'user') {
    redirect(`${webserver.host}/espacos`)
  }
  return <UserFormModeProvider>{children}</UserFormModeProvider>
}
