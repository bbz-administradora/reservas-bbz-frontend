import { DataTableSpaces } from '@/components/data-table/spaces/table-spaces'
import { SpaceAddUpdateForm } from '@/components/forms/SpaceAddUpdateForm'
import { SpaceAddUpdateImageForm } from '@/components/forms/SpaceAddUpdateImageForm'
import { Text } from '@/components/Text'
import { fetchListSpacesInServer } from '@/services/spaceService'
import { Separator } from '@radix-ui/react-select'

export default async function AdminSpaces() {
  const listSpaces = await fetchListSpacesInServer({
    page: '1',
    pageSize: '1000',
  })

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <Text variant={'title-22-32-700'} className="my-4">
        Lista de Espaços
      </Text>

      <div className="container mx-auto py-10">
        <DataTableSpaces initialData={listSpaces?.spaces} />
      </div>

      <Separator className="bg-primary w-full" />

      <SpaceAddUpdateForm />

      <SpaceAddUpdateImageForm />
    </div>
  )
}
