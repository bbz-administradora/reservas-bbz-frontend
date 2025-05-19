import { RoomExplorer } from '@/components/RoomExplorer'
import { CardDecoration } from '@/components/svg/card-decoration'
import { Text } from '@/components/Text'
import { Separator } from '@/components/ui/separator'
import { fetchAvailableRoomsInServer } from '@/services/roomSlotService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { format } from 'date-fns'
import {
  CalendarCheck2Icon,
  CalendarClockIcon,
  DoorOpenIcon,
  UserRoundIcon,
} from 'lucide-react'

export default async function RoomsHome() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const listAvailableRooms = await fetchAvailableRoomsInServer({
    page: '1',
    pageSize: '9',
    date: today,
  })

  const { user } = await fetchCurrentUserInServer()

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Card de informações */}
      <div className="mt-10 mb-5 grid w-full max-w-6xl grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <div className="bg-muted flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
            <UserRoundIcon size={56} className="text-primary z-10" />
          </div>
          <Text
            variant="title-16-18-500"
            className="text-primary mt-4 text-center break-words"
          >
            {user?.name}
          </Text>
          <Text
            variant="title-18-24-700"
            className="text-primary text-center break-words break-all"
          >
            {user?.email}
          </Text>
        </div>

        <div className="bg-secondary flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
            <DoorOpenIcon size={56} className="text-primary z-10" />
          </div>
          <Text
            variant="title-16-18-500"
            className="text-primary mt-4 text-center break-words"
          >
            Salas disponíveis
          </Text>
          <Text
            variant="title-18-24-700"
            className="text-primary text-center break-words"
          >
            {listAvailableRooms?.totalCount}
          </Text>
        </div>

        <div className="bg-secondary flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
            <CalendarCheck2Icon size={56} className="text-primary z-10" />
          </div>
          <Text
            variant="title-16-18-500"
            className="text-primary mt-4 text-center break-words"
          >
            Minhas Reservas Realizadas
          </Text>
          <Text
            variant="title-18-24-700"
            className="text-primary text-center break-words"
          >
            2
          </Text>
        </div>

        <div className="bg-secondary flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
            <CalendarClockIcon size={56} className="text-primary z-10" />
          </div>
          <Text
            variant="title-16-18-500"
            className="text-primary mt-4 text-center break-words"
          >
            Próxima Reserva
          </Text>
          <Text
            variant="title-18-24-700"
            className="text-primary text-center break-words"
          >
            01/05/2025 às 10:00
          </Text>
        </div>
      </div>
      <Separator className="bg-primary w-full" />
      <div className="my-4 w-full">
        <Text variant={'title-22-32-700'}>Explorar Salas</Text>
        <Text className="mt-2.5 max-w-3xl">
          Filtre as salas por data e horário disponível, toque em um de seus
          períodos mais usados para agilizar ou simplesmente role os cards
          abaixo e clique na sala desejada para reservar.
        </Text>

        <RoomExplorer initialData={listAvailableRooms} className="pt-5" />
      </div>
    </div>
  )
}
