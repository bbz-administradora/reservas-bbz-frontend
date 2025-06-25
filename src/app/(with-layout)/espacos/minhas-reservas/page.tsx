import { DataTableReservations } from '@/components/data-table/reservations/table-reservations'
import { Text } from '@/components/Text'
import { webserver } from '@/infra/webserver'
import { fetchListSpaceReservationsInServer } from '@/services/reservationService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'

export default async function MySpaceReservations() {
  const { user } = await fetchCurrentUserInServer()

  const reservationsList = await fetchListSpaceReservationsInServer({
    page: '1',
    pageSize: '1000',
    userId: user?.id,
    includeUserAsGuest: 'true',
  })

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col gap-5 pt-5 pb-28 lg:pb-10"
    >
      <div className="relative my-4 flex w-full items-center justify-center">
        <Link href={`${webserver.host}/espacos`} className="absolute left-0">
          <ChevronLeftIcon className="text-accent size-10" />
        </Link>
        <Text as="h1" variant={'title-22-32-700'}>
          Meus Agendamentos
        </Text>
      </div>

      <div className="container mx-auto py-10">
        <DataTableReservations
          initialData={reservationsList?.reservations}
          className="mb-5"
          currentUser={user}
        />
      </div>
    </div>
  )
}
