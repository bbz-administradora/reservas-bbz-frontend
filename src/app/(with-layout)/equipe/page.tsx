import { CardDecoration } from '@/components/svg/card-decoration'
import { TeamOrganogram } from '@/components/team/TeamOrganogram'
import { Text } from '@/components/Text'
import {
  fetchListPositionsInServer,
  fetchOrganogramInServer,
} from '@/services/positionService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { Crown, ShieldCheck, UserCog, UserMinus, Users } from 'lucide-react'
import Link from 'next/link'

// Mapa de ícones por posição
const POSITION_ICONS = {
  director: Crown,
  supervisor: ShieldCheck,
  manager: UserCog,
  assistant_manager: UserMinus,
  assistant: Users,
}

// Mapa de labels por posição
const POSITION_LABELS = {
  director: { singular: 'Diretor', plural: 'Diretores' },
  supervisor: { singular: 'Supervisor', plural: 'Supervisores' },
  manager: { singular: 'Gerente', plural: 'Gerentes' },
  assistant_manager: { singular: 'Subgerente', plural: 'Subgerentes' },
  assistant: { singular: 'Assistente', plural: 'Assistentes' },
}

// Mapa de cores por posição
const POSITION_COLORS = {
  director: 'bg-amber-500 hover:bg-amber-600',
  supervisor: 'bg-blue-500 hover:bg-blue-600',
  manager: 'bg-emerald-500 hover:bg-emerald-600',
  assistant_manager: 'bg-purple-500 hover:bg-purple-600',
  assistant: 'bg-rose-500 hover:bg-rose-600',
}

type PositionType =
  | 'director'
  | 'supervisor'
  | 'manager'
  | 'assistant_manager'
  | 'assistant'

export default async function TeamDashboardPage() {
  const { user, teamPosition: rawTeamPosition } =
    await fetchCurrentUserInServer()

  // Cast para o novo tipo de posição (backend já retorna os valores novos)
  const teamPosition = rawTeamPosition as PositionType | null

  // Define quais posições o usuário pode gerenciar baseado na hierarquia
  const canManagePositions: PositionType[] = []

  if (user?.role === 'admin' || user?.role === 'dev') {
    // Admin/Dev podem gerenciar todas as posições
    canManagePositions.push(
      'director',
      'supervisor',
      'manager',
      'assistant_manager',
      'assistant',
    )
  } else if (teamPosition === 'director') {
    // Director pode gerenciar de supervisor pra baixo
    canManagePositions.push(
      'supervisor',
      'manager',
      'assistant_manager',
      'assistant',
    )
  } else if (teamPosition === 'supervisor') {
    // Supervisor pode gerenciar manager pra baixo
    canManagePositions.push('manager', 'assistant_manager', 'assistant')
  } else if (teamPosition === 'manager') {
    // Manager pode gerenciar assistant_manager e assistant
    canManagePositions.push('assistant_manager', 'assistant')
  } else if (teamPosition === 'assistant_manager') {
    // Assistant Manager pode gerenciar apenas assistant
    canManagePositions.push('assistant')
  }

  // Buscar contagem de cada posição que o usuário pode gerenciar
  const positionCounts: Record<PositionType, number> = {
    director: 0,
    supervisor: 0,
    manager: 0,
    assistant_manager: 0,
    assistant: 0,
  }

  // Buscar contagens em paralelo
  const [_, organogram] = await Promise.all([
    Promise.all(
      canManagePositions.map(async (position) => {
        const data = await fetchListPositionsInServer(position)
        positionCounts[position] = data?.total || 0
      }),
    ),
    fetchOrganogramInServer(),
  ])

  // Determinar o cargo do usuário para exibição
  const getUserRoleLabel = () => {
    if (user?.role === 'admin') return 'Administrador'
    if (user?.role === 'dev') return 'Desenvolvedor'
    if (teamPosition)
      return POSITION_LABELS[teamPosition as PositionType].singular
    return 'Usuário'
  }

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Header */}
      <div className="mt-10 flex w-full max-w-6xl flex-col gap-2">
        <Text variant="title-22-32-700" className="text-primary">
          Gestão de Equipe
        </Text>
        <Text variant="title-14-16-500" className="text-muted-foreground">
          Você está logado como <strong>{getUserRoleLabel()}</strong>. Gerencie
          as posições da equipe de atendimento abaixo.
        </Text>
      </div>

      {/* Grid de cards de posições */}
      <div className="mt-5 grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canManagePositions.map((position) => {
          const Icon = POSITION_ICONS[position]
          const labels = POSITION_LABELS[position]
          const colorClass = POSITION_COLORS[position]
          const count = positionCounts[position]

          return (
            <Link
              key={position}
              href={`/equipe/${position}`}
              className={`${colorClass} flex flex-col items-center gap-2.5 rounded-lg p-6 shadow-xl transition-colors`}
            >
              <div className="relative flex items-center justify-center">
                <CardDecoration className="absolute bottom-[-15px] left-[-15px] text-white/20" />
                <Icon size={48} className="z-10 text-white" />
              </div>
              <Text
                variant="title-18-24-700"
                className="mt-4 text-center text-white"
              >
                {labels.plural}
              </Text>
              <Text variant="title-14-16-500" className="text-white/80">
                {count} {count === 1 ? 'nomeado' : 'nomeados'}
              </Text>
            </Link>
          )
        })}
      </div>

      {/* Informação sobre hierarquia */}
      <div className="bg-muted/50 mt-5 w-full max-w-6xl rounded-lg p-4">
        <Text variant="title-14-16-500" className="text-muted-foreground">
          <strong>Hierarquia de nomeação:</strong> Admin → Diretor → Supervisor
          → Gerente → Subgerente/Assistente
        </Text>
      </div>

      {/* Organograma da equipe */}
      {organogram && (
        <div className="mt-8 w-full max-w-6xl">
          <Text variant="title-18-24-700" className="text-primary mb-4">
            Organograma da Equipe
          </Text>
          <TeamOrganogram tree={organogram.tree} stats={organogram.stats} />
        </div>
      )}
    </div>
  )
}
