import { webserver } from '@/infra/webserver'
import { authenticateUserServer } from '@/utils/auth/auth-utils'
import { redirect } from 'next/navigation'

export default async function AdminUser() {
  const { user } = await authenticateUserServer()

  // Verifica se o usuário está autenticado e tem a função de admin
  if (user?.role === 'user') {
    redirect(`${webserver.host}/salas`)
  }

  const name = user?.name || 'Usuário'

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center justify-center gap-5"
    >
      <p className="text-7xl capitalize">{`Seja bem vindo ${name
        .split(' ')
        .shift()}!`}</p>

      <p className="text-2xl">
        Aqui você pode visualizar e gerenciar os usuários do sistema.
      </p>
    </div>
  )
}
