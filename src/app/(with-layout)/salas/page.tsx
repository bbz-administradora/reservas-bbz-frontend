import { fetchCurrentUserInServer } from '@/services/userService'

export default async function Rooms() {
  const { user } = await fetchCurrentUserInServer()

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
        Aqui você pode visualizar as salas disponíveis para reserva.
      </p>
    </div>
  )
}
