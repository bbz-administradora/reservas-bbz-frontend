import { DataTableReservations } from '@/components/data-table/reservations/table-reservations'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { webserver } from '@/infra/webserver'
import { fetchListSpaceReservationsInServer } from '@/services/reservationService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'

export default async function MySpaceReservations() {
  const { user } = await fetchCurrentUserInServer()

  // Verifica se o usuário está autenticado e tem a função de admin
  const isAdmin = ['admin', 'dev'].includes(user?.role ?? '')

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
      {/* Link para a página administrativa de reservas - visível apenas para administradores e mobile */}
      {isAdmin && (
        <Link
          href={`${webserver.host}/admin/reservas`}
          title="Ir para a página administrativa de reservas"
          className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:hidden"
        >
          <Button tabIndex={-1} className="w-full" variant={'secondary'}>
            Gerenciar Todas as Reservas
          </Button>
        </Link>
      )}
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
