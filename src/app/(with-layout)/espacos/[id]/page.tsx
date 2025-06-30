import { DataTableSpaceRoomSlots } from '@/components/data-table/space-slots/table-space-room-slots'
import { DataTableSpaceWorkstationSlots } from '@/components/data-table/space-slots/table-space-workstation-slots'
import { InviteParticipantsForm } from '@/components/forms/InviteParticipantsForm'
import { ImageGallery } from '@/components/ImageGallery'
import { Text } from '@/components/Text'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { webserver } from '@/infra/webserver'
import { fetchAvailableSpaceSlotsBySpace } from '@/services/spaceSlotService'
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
      description: 'Redirecionando para a página de espaços',
    }
  }

  const spaceData = await fetchAvailableSpaceSlotsBySpace(id, {
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
  })

  if (!spaceData) {
    return {
      title: 'Espaço não encontrado | BBZ Reservas',
      description: 'Espaço não encontrado',
    }
  }

  return {
    title: `${spaceData.space.name} | BBZ Reservas`,
    description: spaceData.space.description || 'Espaço',
    openGraph: {
      images:
        spaceData.space.imagens.length > 0
          ? [
              {
                url: `${process.env.NEXT_PUBLIC_BUCKET || ''}/${spaceData.space.imagens[0]}`,
                width: 1200,
                height: 630,
              },
            ]
          : [],
    },
  }
}

export default async function SpaceDetailsAndReservation(props: {
  params: Params
  searchParams: SearchParams
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const id = params.id
  const startDate = searchParams.startDate
  const endDate = searchParams.endDate

  if (!id || !startDate || !endDate) {
    return redirect(`${webserver.host}/espacos`)
  }

  const spaceData = await fetchAvailableSpaceSlotsBySpace(id, {
    startDate,
    endDate,
  })

  const { user } = await fetchCurrentUserInServer()

  if (!spaceData || !user) {
    return redirect(`${webserver.host}/espacos`)
  }

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
          {spaceData.space.name}
        </Text>
      </div>

      {/* Componente de galeria de imagens */}
      {spaceData.space.type === 'room' && (
        <ImageGallery images={spaceData.space.imagens} />
      )}

      {/* Componente de descrição do espaço */}
      <Text variant={'body-16-18-400'} className="my-5 max-w-3xl">
        {spaceData.space.description}
      </Text>

      {/* Componente de recursos do espaço */}
      <div className="my-5 flex flex-wrap justify-center gap-3 lg:justify-start">
        <Badge className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2.5 rounded-full px-5 py-2 transition-colors">
          <UserRoundIcon />
          {`${spaceData.space.capacidade} pessoa${
            spaceData.space.capacidade === 1 ? '' : 's'
          }`}
        </Badge>
        {spaceData.space.recursos.map((recurso, index) => (
          <Badge
            key={index}
            className="bg-accent text-accent-foreground hover:bg-accent/80 gap-2.5 rounded-full px-5 py-2 transition-colors"
          >
            {recurso}
          </Badge>
        ))}
      </div>

      <div className="container mx-auto pt-10">
        {spaceData.space.type === 'room' ? (
          <DataTableSpaceRoomSlots
            startDate={startDate}
            endDate={endDate}
            spaceId={id}
            user={user}
            spaceData={spaceData}
            className="mb-5"
          />
        ) : (
          <DataTableSpaceWorkstationSlots
            startDate={startDate}
            endDate={endDate}
            spaceId={id}
            user={user}
            spaceData={spaceData}
            className="mb-5"
          />
        )}
      </div>

      {spaceData.space.type === 'room' && (
        <Separator className="bg-primary my-5" />
      )}

      <div className="flex flex-col gap-2">
        {spaceData.space.type === 'room' && (
          <Text variant="title-16-18-700" className="mb-2">
            Convidar participantes:
          </Text>
        )}
        <InviteParticipantsForm
          spaceId={id}
          spaceType={spaceData.space.type}
          startDate={startDate}
          endDate={endDate}
          user={user}
        />
      </div>
    </div>
  )
}
