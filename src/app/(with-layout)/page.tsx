import { webserver } from '@/infra/webserver'
import { authenticateUserServer } from '@/utils/auth/auth-utils'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { user, isAuthenticated } = await authenticateUserServer()

  // ❗ Não estamos usando a home, então não queremos 404 aqui, então redirecionamos autenticados para a página de salas e não autenticados para a página de login
  if (!isAuthenticated) {
    redirect(`${webserver.host}/login`)
  } else redirect(`${webserver.host}/salas`)

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
        Aqui é a home page do sistema de reserva de salas BBZ, sera
        redirecionado automaticamente.
      </p>
    </div>
  )
}
