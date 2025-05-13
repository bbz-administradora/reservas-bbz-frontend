import { DataTableUsers } from '@/components/data-table/users/table-users'
import { Text } from '@/components/Text'
import { Separator } from '@/components/ui/separator'
import { webserver } from '@/infra/webserver'
import {
  fetchCurrentUserInServer,
  fetchListUsersInServer,
} from '@/services/userService'
import { redirect } from 'next/navigation'

export default async function AdminUser() {
  const { user } = await fetchCurrentUserInServer()

  // Verifica se o usuário está autenticado e tem a função de admin
  if (user?.role === 'user') {
    redirect(`${webserver.host}/salas`)
  }

  const listUsers = await fetchListUsersInServer({
    page: '1',
    pageSize: '1000',
  })

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-10"
    >
      <Text variant={'title-22-32-700'} className="my-4">
        Lista de Usuários
      </Text>

      <div className="container mx-auto py-10">
        <DataTableUsers initialData={listUsers?.users} className="mb-5" />
      </div>

      <Separator className="bg-primary w-full" />

      <Text variant={'title-22-32-700'} className="my-4">
        Adicionar Usuário
      </Text>

      <Separator className="bg-primary w-full" />

      <Text variant={'title-22-32-700'} className="my-4">
        Editar Usuário
      </Text>
    </div>
  )
}
