import { Text } from '@/components/Text'
import { webserver } from '@/infra/webserver'
import { fetchListSpaceReservationsInServer } from '@/services/reservationService'
import { fetchSpaceInServer } from '@/services/spaceService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type Params = Promise<{
  id: string
}>

export default async function SpaceCheckInOutPage(props: { params: Params }) {
  const params = await props.params
  const id = params.id

  if (!id) {
    return redirect(`${webserver.host}/espacos`)
  }

  const [space, userResponse] = await Promise.all([
    fetchSpaceInServer(id),
    fetchCurrentUserInServer(),
  ])

  const { user } = userResponse

  if (!space || !user) {
    return redirect(`${webserver.host}/espacos`)
  }

  const reservationsList = await fetchListSpaceReservationsInServer({
    page: '1',
    pageSize: '10',
    userId: user?.id,
    includeUserAsGuest: 'true',
    spaceId: space.id,
  })

  console.log('🚀 ~ SpaceCheckInOutPage ~ reservationsList:', reservationsList)

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
          {`Check-in / Check-out – Sala ${space.name}`}
        </Text>
      </div>
    </div>
  )
}
