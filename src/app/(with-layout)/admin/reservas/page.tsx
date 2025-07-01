import { DataTableReservations } from '@/components/data-table/reservations/table-reservations'
import { Text } from '@/components/Text'
import { webserver } from '@/infra/webserver'
import { fetchListSpaceReservationsInServer } from '@/services/reservationService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { redirect } from 'next/navigation'

export default async function AdminReserves() {
  const [userResponse, reservationsListResponse] = await Promise.all([
    fetchCurrentUserInServer(),
    fetchListSpaceReservationsInServer({
      page: '1',
      pageSize: '10000',
    }),
  ])

  const user = userResponse.user

  // Verifica se o usuário está autenticado e tem a função de admin
  if (user?.role === 'user') {
    redirect(`${webserver.host}/espacos`)
  }

  const reservationsList = reservationsListResponse?.reservations

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <Text variant={'title-22-32-700'} className="my-4">
        Lista de Reservas
      </Text>

      <div className="container mx-auto py-10">
        <DataTableReservations
          initialData={reservationsList}
          className="mb-5"
          currentUser={user}
          allList={true}
        />
      </div>
    </div>
  )
}
