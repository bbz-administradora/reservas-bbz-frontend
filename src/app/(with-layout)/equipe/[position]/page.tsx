import { PositionMemberCard } from '@/components/team/PositionMemberCard'
import { PositionNominateForm } from '@/components/team/PositionNominateForm'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { fetchListPositionsInServer } from '@/services/positionService'
import { fetchCurrentUserInServer } from '@/services/userService'
import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  UserCog,
  UserMinus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Posições válidas
const VALID_POSITIONS = [
  'director',
  'supervisor',
  'manager',
  'assistant_manager',
  'assistant',
] as const

type PositionType = (typeof VALID_POSITIONS)[number]

// Mapa de ícones por posição
const POSITION_ICONS: Record<PositionType, typeof Crown> = {
  director: Crown,
  supervisor: ShieldCheck,
  manager: UserCog,
  assistant_manager: UserMinus,
  assistant: Users,
}

// Mapa de labels por posição
const POSITION_LABELS: Record<
  PositionType,
  { singular: string; plural: string }
> = {
  director: { singular: 'Diretor', plural: 'Diretores' },
  supervisor: { singular: 'Supervisor', plural: 'Supervisores' },
  manager: { singular: 'Gerente', plural: 'Gerentes' },
  assistant_manager: { singular: 'Subgerente', plural: 'Subgerentes' },
  assistant: { singular: 'Assistente', plural: 'Assistentes' },
}

// Mapa de quem pode NOMEAR cada posição
const CAN_NOMINATE: Record<
  PositionType,
  { roles: string[]; positions: PositionType[] }
> = {
  director: { roles: ['admin', 'dev'], positions: [] },
  supervisor: { roles: [], positions: ['director'] },
  manager: { roles: [], positions: ['supervisor'] },
  assistant_manager: { roles: [], positions: ['manager'] },
  assistant: { roles: [], positions: ['manager', 'assistant_manager'] },
}

// Mapa de quem pode REMOVER cada posição
// Admin/Dev podem remover qualquer um
// Superior hierárquico pode remover inferior
const CAN_REMOVE: Record<
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

interface PositionPageProps {
  params: Promise<{ position: string }>
}

export default async function PositionPage({ params }: PositionPageProps) {
  const { position } = await params

  // Valida se a posição é válida
  if (!VALID_POSITIONS.includes(position as PositionType)) {
    notFound()
  }

  const positionType = position as PositionType
  const Icon = POSITION_ICONS[positionType]
  const labels = POSITION_LABELS[positionType]

  // Buscar usuário logado e sua posição
  const { user, teamPosition } = await fetchCurrentUserInServer()

  // Buscar membros desta posição
  const positionsData = await fetchListPositionsInServer(positionType)

  // Verificar se o usuário pode NOMEAR esta posição
  const nominatePermissions = CAN_NOMINATE[positionType]
  const canNominate =
    nominatePermissions.roles.includes(user?.role || '') ||
    nominatePermissions.positions.includes(teamPosition as PositionType)

  // Verificar se o usuário pode REMOVER membros desta posição
  const removePermissions = CAN_REMOVE[positionType]
  const canRemove =
    removePermissions.roles.includes(user?.role || '') ||
    removePermissions.positions.includes(teamPosition as PositionType)

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Header com botão de voltar */}
      <div className="mt-10 flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/equipe">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Icon className="text-primary h-6 w-6" />
            <Text variant="title-22-32-700">{labels.plural}</Text>
          </div>
        </div>

        <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-2">
          <Text variant="title-16-18-500" className="text-muted-foreground">
            Total:
          </Text>
          <Text variant="title-18-24-700" className="text-primary">
            {positionsData?.total || 0}
          </Text>
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-muted/50 w-full max-w-6xl rounded-lg p-4">
        <Text variant="title-14-16-500" className="text-muted-foreground">
          {getPositionDescription(positionType)}
        </Text>
      </div>

      {/* Lista de membros */}
      <div className="w-full max-w-6xl space-y-3">
        {positionsData && positionsData.positions.length > 0 ? (
          positionsData.positions.map((member) => (
            <PositionMemberCard
              key={member.id}
              id={member.id}
              userId={member.userId}
              userName={member.userName}
              userEmail={member.userEmail}
              userAvatar={member.userAvatar}
              assignedByName={member.assignedByName}
              assignedByEmail={member.assignedByEmail}
              createdAt={member.createdAt}
              canRemove={canRemove}
            />
          ))
        ) : (
          <div className="bg-muted/30 flex flex-col items-center justify-center rounded-lg py-12">
            <Icon className="text-muted-foreground mb-4 h-12 w-12" />
            <Text
              variant="title-18-24-700"
              className="text-muted-foreground mb-2"
            >
              Nenhum {labels.singular.toLowerCase()} nomeado
            </Text>
            <Text variant="title-14-16-500" className="text-muted-foreground">
              {canNominate
                ? `Use o formulário abaixo para nomear o primeiro ${labels.singular.toLowerCase()}.`
                : `Você não tem permissão para nomear ${labels.plural.toLowerCase()}.`}
            </Text>
          </div>
        )}
      </div>

      {/* Formulário de nomeação (se tem permissão) */}
      {canNominate && (
        <>
          <Separator className="bg-primary w-full max-w-6xl" />
          <PositionNominateForm
            position={positionType}
            className="w-full max-w-6xl"
          />
        </>
      )}
    </div>
  )
}

// Descrição de cada posição
function getPositionDescription(position: PositionType): string {
  const descriptions: Record<PositionType, string> = {
    director:
      'Diretores são o topo da hierarquia da equipe de atendimento. Podem nomear Supervisores e têm acesso completo à gestão da equipe. Apenas Admin/Dev podem nomear Diretores.',
    supervisor:
      'Supervisores são nomeados pelo Diretor. Podem nomear Gerentes e acompanhar o trabalho das equipes sob sua supervisão.',
    manager:
      'Gerentes são nomeados pelos Supervisores. Podem nomear Subgerentes e Assistentes para auxiliar nas operações diárias.',
    assistant_manager:
      'Subgerentes são nomeados pelos Gerentes. Auxiliam na coordenação das atividades, podem nomear Assistentes e substituir o Gerente quando necessário.',
    assistant:
      'Assistentes são nomeados pelos Gerentes ou Subgerentes. São responsáveis pelo atendimento direto e operações do dia a dia.',
  }
  return descriptions[position]
}
