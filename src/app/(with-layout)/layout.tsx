import { BottomTabButton } from '@/components/BottomTabButton'
import { LogoutButton } from '@/components/LogoutButton'
import { LogoBbz } from '@/components/svg/logo-bbz'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { webserver } from '@/infra/webserver'
import { fetchCurrentUserInServer } from '@/services/userService'
import {
  CalendarCheck2Icon,
  CalendarDaysIcon,
  DoorOpenIcon,
  HomeIcon,
  Users2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user } = await fetchCurrentUserInServer()

  if (!isAuthenticated || !user) {
    return redirect(`${webserver.host}/login`)
  }

  const email = user?.email || null
  const currentYear = new Date().getFullYear()

  // Verifica se o usuário está autenticado e tem a função de admin
  const isAdmin = ['admin', 'dev'].includes(user?.role ?? '')

  // Verifica se o usuário pode ver reservas da equipe (admin, dev ou supervisor)
  const canViewTeamReservations =
    isAdmin || user?.teamPosition === 'supervisor'

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground flex h-20 w-full">
        <div className="wrapper-full relative flex w-full items-center justify-between">
          {/* Logo  */}
          <Link
            href={`${webserver.host}/espacos`}
            title="Ir para a página de salas"
            className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md p-1 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <LogoBbz invert className="w-[60px]" />
          </Link>

          <div className="flex flex-col items-center justify-center gap-1 lg:absolute lg:right-1/2 lg:translate-x-1/2">
            {/* Title */}
            <Text variant="title-18-24-700">Reserva de Espaços BBZ</Text>
            <Text variant="label-14-14-400">{email}</Text>
          </div>

          <div className="hidden items-center justify-center gap-2.5 lg:flex">
            <Link
              href={`${webserver.host}/espacos`}
              title="Ir para a página de salas"
              className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Button
                tabIndex={-1}
                variant="ghost"
                size="icon"
                className="lg:cursor-pointer"
              >
                <HomeIcon className="size-5" />
              </Button>
            </Link>

            <Link
              href={`${webserver.host}/espacos/minhas-reservas`}
              title="Ir para a página de minhas reservas"
              className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Button
                tabIndex={-1}
                variant="ghost"
                size="icon"
                className="lg:cursor-pointer"
              >
                <CalendarCheck2Icon className="size-5" />
              </Button>
            </Link>

            {/* Verifica se o usuário é admin */}
            {isAdmin && (
              <>
                <Link
                  href={`${webserver.host}/admin/usuarios`}
                  title="Ir para a página administrativa de usuários"
                  className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Button
                    tabIndex={-1}
                    variant="ghost"
                    size="icon"
                    className="lg:cursor-pointer"
                  >
                    <Users2Icon className="size-5" />
                  </Button>
                </Link>

                <Link
                  href={`${webserver.host}/admin/espacos`}
                  title="Ir para a página administrativa de espaços"
                  className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Button
                    tabIndex={-1}
                    variant="ghost"
                    size="icon"
                    className="lg:cursor-pointer"
                  >
                    <DoorOpenIcon className="size-5" />
                  </Button>
                </Link>

              </>
            )}

            {/* Link de reservas para admin, dev ou supervisor */}
            {canViewTeamReservations && (
              <Link
                href={`${webserver.host}/admin/reservas`}
                title="Ir para a página de reservas da equipe"
                className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Button
                  tabIndex={-1}
                  variant="ghost"
                  size="icon"
                  className="lg:cursor-pointer"
                >
                  <CalendarDaysIcon className="size-5" />
                </Button>
              </Link>
            )}

            {/* Criar botão de logout */}
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}

      {/* Footer desktop */}
      <footer className="wrapper-full mb-10 hidden w-full flex-col items-center justify-center lg:flex">
        <div className="bg-primary my-5 h-[1px] w-full" />
        <Text className="text-muted-foreground text-center">
          {currentYear} © BBZ Administração de Condomínio Ltda. Todos os
          direitos reservados.
        </Text>
      </footer>

      {/* Footer / Bottom Tab / mobile - tablet */}
      <footer className="fixed bottom-0 z-40 flex h-auto w-[100vw] items-center justify-center lg:hidden">
        <div className="bg-secondary flex h-auto w-full items-center justify-around p-2 pb-3 opacity-100 transition-all">
          <BottomTabButton label="Home" href={`${webserver.host}/espacos`}>
            <HomeIcon className="size-6" />
          </BottomTabButton>

          <BottomTabButton
            label="Reservas"
            href={`${webserver.host}/espacos/minhas-reservas`}
          >
            <CalendarCheck2Icon className="size-6" />
          </BottomTabButton>

          {/* Verifica se o usuário é admin */}
          {isAdmin && (
            <>
              <BottomTabButton
                label="Usuários"
                href={`${webserver.host}/admin/usuarios`}
              >
                <Users2Icon className="size-6" />
              </BottomTabButton>

              <BottomTabButton
                label="Espaços"
                href={`${webserver.host}/admin/espacos`}
              >
                <DoorOpenIcon className="size-6" />
              </BottomTabButton>

            </>
          )}

          {/* Link de reservas para admin, dev ou supervisor */}
          {canViewTeamReservations && (
            <BottomTabButton
              label="Reservas Equipe"
              href={`${webserver.host}/admin/reservas`}
              className="hidden md:flex"
            >
              <CalendarDaysIcon className="size-6" />
            </BottomTabButton>
          )}

          <LogoutButton variant="bottom-bar" />
        </div>
      </footer>
    </div>
  )
}
