import { DataTableRoomSlots } from '@/components/data-table/room-slots/table-room-slots'
import { InviteParticipantsForm } from '@/components/forms/invite-participants-form'
import { ImageGallery } from '@/components/ImageGallery'
import { Text } from '@/components/Text'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { webserver } from '@/infra/webserver'
import { fetchAvailableRoomSlotsByRoom } from '@/services/roomSlotService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { ChevronLeftIcon, UserRoundIcon } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type Params = Promise<{
  id: string
}>
type SearchParams = Promise<{
  startDate?: string
  endDate?: string
}>

export async function generateMetadata(props: {
  params: Params
  searchParams: SearchParams
}): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams
  const id = params.id

  if (!id || !searchParams.startDate || !searchParams.endDate) {
    return {
      title: 'Redirecionando | BBZ Reservas',
      description: 'Redirecionando para a página de salas',
    }
  }

  const roomData = await fetchAvailableRoomSlotsByRoom(id, {
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
  })

  if (!roomData) {
    return {
      title: 'Sala não encontrada | BBZ Reservas',
      description: 'Sala de reunião não encontrada',
    }
  }

  return {
    title: `${roomData.room.name} | BBZ Reservas`,
    description: roomData.room.description || 'Sala de reunião',
    openGraph: {
      images:
        roomData.room.imagens.length > 0
          ? [
              {
                url: `${process.env.NEXT_PUBLIC_BUCKET || ''}/${roomData.room.imagens[0]}`,
                width: 1200,
                height: 630,
              },
            ]
          : [],
    },
  }
}

export default async function RoomDetailsAndReservation(props: {
  params: Params
  searchParams: SearchParams
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const id = params.id
  const startDate = searchParams.startDate
  const endDate = searchParams.endDate

  if (!id || !startDate || !endDate) {
    return redirect(`${webserver.host}/salas`)
  }

  const roomData = await fetchAvailableRoomSlotsByRoom(id, {
    startDate,
    endDate,
  })

  if (!roomData) {
    return redirect(`${webserver.host}/salas`)
  }

  const { user } = await fetchCurrentUserInServer()

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col gap-5 pt-5 pb-28 lg:pb-10"
    >
      <div className="relative my-4 flex w-full items-center justify-center">
        <Link href={`${webserver.host}/salas`} className="absolute left-0">
          <ChevronLeftIcon className="text-accent size-10" />
        </Link>
        <Text as="h1" variant={'title-22-32-700'}>
          {roomData.room.name}
        </Text>
      </div>

      {/* Componente de galeria de imagens */}
      <ImageGallery images={roomData.room.imagens} />

      {/* Componente de descrição da sala */}
      <Text variant={'body-16-18-400'} className="my-5 max-w-3xl">
        {roomData.room.description}
      </Text>

      {/* Componente de recursos da sala */}
      <div className="my-5 flex flex-wrap justify-center gap-3 lg:justify-start">
        <Badge className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2.5 rounded-full px-5 py-2 transition-colors">
          <UserRoundIcon />
          {`${roomData.room.capacidade} pessoa${
            roomData.room.capacidade === 1 ? '' : 's'
          }`}
        </Badge>
        {roomData.room.recursos.map((recurso, index) => (
          <Badge
            key={index}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2.5 rounded-full px-5 py-2 transition-colors"
          >
            {recurso}
          </Badge>
        ))}
      </div>

      <div className="container mx-auto pt-10">
        <DataTableRoomSlots
          startDate={startDate}
          endDate={endDate}
          roomId={id}
          user={user}
          roomData={roomData}
          className="mb-5"
        />
      </div>

      <Separator className="bg-primary my-5" />

      <div className="flex flex-col gap-2">
        <Text variant="title-16-18-700" className="mb-2">
          Convidar participantes:
        </Text>
        <InviteParticipantsForm />
      </div>
    </div>
  )
}
