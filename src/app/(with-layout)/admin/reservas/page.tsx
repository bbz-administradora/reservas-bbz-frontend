import { DataTableReservations } from '@/components/data-table/reservations/table-reservations'
import { Text } from '@/components/Text'
import { fetchListSpaceReservationsInServer } from '@/services/reservationService'

export default async function AdminReserves() {
  const reservationsList = await fetchListSpaceReservationsInServer({
    page: '1',
    pageSize: '10000',
  })

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
          initialData={reservationsList?.reservations}
          className="mb-5"
          currentUser={null}
        />
      </div>
    </div>
  )
}
