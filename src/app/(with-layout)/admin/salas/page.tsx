import { DataTableRooms } from '@/components/data-table/rooms/table-rooms'
import { RoomAddUpdateForm } from '@/components/forms/room-add-update-form'
import { Text } from '@/components/Text'
import { fetchListRoomsInServer } from '@/services/roomService'
import { Separator } from '@radix-ui/react-select'

export default async function AdminRooms() {
  const listRooms = await fetchListRoomsInServer({
    page: '1',
    pageSize: '1000',
  })

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <Text variant={'title-22-32-700'} className="my-4">
        Lista de Salas
      </Text>

      <div className="container mx-auto py-10">
        <DataTableRooms initialData={listRooms?.rooms} />
      </div>

      <Separator className="bg-primary w-full" />

      <RoomAddUpdateForm />
    </div>
  )
}
