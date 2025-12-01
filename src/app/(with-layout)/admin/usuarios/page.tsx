import { DataTableUsers } from '@/components/data-table/users/table-users'
import { UserAddUpdateForm } from '@/components/forms/UserAddUpdateForm'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { fetchListUsersInServer } from '@/services/userService'
import { UsersIcon } from 'lucide-react'
import Link from 'next/link'

export default async function AdminUser() {
  const listUsers = await fetchListUsersInServer({
    page: '1',
    pageSize: '1000',
  })

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <div className="flex w-full max-w-6xl items-center justify-between">
        <Text variant={'title-22-32-700'} className="my-4">
          Lista de Usuários
        </Text>

        <Button asChild>
          <Link href="/admin/usuarios/gerentes-equipe">
            <UsersIcon className="mr-2 h-4 w-4" />
            Gerentes de Equipe
          </Link>
        </Button>
      </div>

      <div className="container mx-auto py-10">
        <DataTableUsers initialData={listUsers?.users} className="mb-5" />
      </div>

      <Separator className="bg-primary w-full" />

      <UserAddUpdateForm className="my-4" />
    </div>
  )
}
