import { authenticateUserServer } from '@/utils/auth/auth-utils'

export default async function RoomDetailsAndReservation() {
  const { user } = await authenticateUserServer()

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
        Aqui você pode visualizar os detalhes da sala e fazer a reserva.
      </p>
    </div>
  )
}
