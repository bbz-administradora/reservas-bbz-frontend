import { webserver } from '@/infra/webserver'
import { fetchCurrentUserInServer } from '@/services/userService'
import { redirect } from 'next/navigation'

// Posições válidas
const VALID_POSITIONS = [
  'director',
  'supervisor',
  'manager',
  'assistant_manager',
  'assistant',
] as const

type PositionType = (typeof VALID_POSITIONS)[number]

// Mapa de quem pode gerenciar cada posição
const POSITION_PERMISSIONS: Record<
  PositionType,
  { roles: string[]; positions: PositionType[] }
> = {
  director: { roles: ['admin', 'dev'], positions: [] },
  supervisor: { roles: ['admin', 'dev'], positions: ['director'] },
  manager: { roles: ['admin', 'dev'], positions: ['director', 'supervisor'] },
  assistant_manager: {
    roles: ['admin', 'dev'],
    positions: ['director', 'supervisor', 'manager'],
  },
  assistant: {
    roles: ['admin', 'dev'],
    positions: ['director', 'supervisor', 'manager', 'assistant_manager'],
  },
}

interface PositionLayoutProps {
  children: React.ReactNode
  params: Promise<{ position: string }>
}

export default async function PositionLayout({
  children,
  params,
}: PositionLayoutProps) {
  const { position } = await params

  // Valida se a posição é válida
  if (!VALID_POSITIONS.includes(position as PositionType)) {
    redirect(`${webserver.host}/equipe`)
  }

  const { user, teamPosition } = await fetchCurrentUserInServer()

  // Verifica se o usuário está autenticado
  if (!user) {
    redirect(`${webserver.host}/login`)
  }

  const permissions = POSITION_PERMISSIONS[position as PositionType]

  // Verifica se a role do usuário permite acesso
  if (permissions.roles.includes(user.role)) {
    return <>{children}</>
  }

  // Verifica se a posição do usuário permite acesso
  if (
    teamPosition &&
    permissions.positions.includes(teamPosition as PositionType)
  ) {
    return <>{children}</>
  }

  // Caso contrário, redireciona para o dashboard de equipe
  redirect(`${webserver.host}/equipe`)
}
