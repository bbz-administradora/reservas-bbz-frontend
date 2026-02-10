import { DataTableReservations } from '@/components/data-table/reservations/table-reservations'
import { Text } from '@/components/Text'
import { webserver } from '@/infra/webserver'
import { fetchListSpaceReservationsInServer } from '@/services/reservationService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { redirect } from 'next/navigation'

export default async function AdminReserves() {
  // Primeiro buscar usuário para verificar permissões
  const userResponse = await fetchCurrentUserInServer()
  const user = userResponse.user

  // Verifica se o usuário tem permissão (admin, dev ou supervisor)
  const isAdmin = ['admin', 'dev'].includes(user?.role ?? '')
  const isSupervisor = user?.teamPosition === 'supervisor'

  if (!isAdmin && !isSupervisor) {
    redirect(`${webserver.host}/espacos`)
  }

  // Se for supervisor, buscar apenas reservas da equipe
  const reservationsListResponse = await fetchListSpaceReservationsInServer({
    page: '1',
    pageSize: '10000',
    ...(isSupervisor && !isAdmin ? { teamOnly: 'true' } : {}),
  })

  const reservationsList = reservationsListResponse?.reservations

  // Título diferente para supervisor
  const pageTitle =
    isSupervisor && !isAdmin ? 'Reservas da Equipe' : 'Lista de Reservas'

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <Text variant={'title-22-32-700'} className="my-4">
        {pageTitle}
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
