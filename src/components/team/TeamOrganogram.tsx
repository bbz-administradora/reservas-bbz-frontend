'use client'

import type { GetOrganogram200TreeItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { Text } from '@/components/Text'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/utils/mergeClassNames'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronRight,
  Crown,
  Mail,
  ShieldCheck,
  UserCog,
  UserMinus,
  Users,
} from 'lucide-react'

// Mapa de ícones por posição
const POSITION_ICONS: Record<string, LucideIcon> = {
  director: Crown,
  supervisor: ShieldCheck,
  manager: UserCog,
  assistant_manager: UserMinus,
  assistant: Users,
}

// Mapa de labels por posição
const POSITION_LABELS: Record<string, { singular: string; plural: string }> = {
  director: { singular: 'Diretor', plural: 'Diretores' },
  supervisor: { singular: 'Supervisor', plural: 'Supervisores' },
  manager: { singular: 'Gerente', plural: 'Gerentes' },
  assistant_manager: { singular: 'Subgerente', plural: 'Subgerentes' },
  assistant: { singular: 'Assistente', plural: 'Assistentes' },
}

// Mapa de cores por posição (background)
const POSITION_BG_COLORS: Record<string, string> = {
  director: 'bg-amber-100 dark:bg-amber-950/50',
  supervisor: 'bg-blue-100 dark:bg-blue-950/50',
  manager: 'bg-emerald-100 dark:bg-emerald-950/50',
  assistant_manager: 'bg-purple-100 dark:bg-purple-950/50',
  assistant: 'bg-rose-100 dark:bg-rose-950/50',
}

// Mapa de cores por posição (ícone)
const POSITION_ICON_COLORS: Record<string, string> = {
  director: 'text-amber-600 dark:text-amber-400',
  supervisor: 'text-blue-600 dark:text-blue-400',
  manager: 'text-emerald-600 dark:text-emerald-400',
  assistant_manager: 'text-purple-600 dark:text-purple-400',
  assistant: 'text-rose-600 dark:text-rose-400',
}

// Mapa de cores para a borda lateral
const POSITION_BORDER_COLORS: Record<string, string> = {
  director: 'border-l-amber-500',
  supervisor: 'border-l-blue-500',
  manager: 'border-l-emerald-500',
  assistant_manager: 'border-l-purple-500',
  assistant: 'border-l-rose-500',
}

interface OrganogramMemberItemProps {
  member: GetOrganogram200TreeItem
  level?: number
}

function OrganogramMemberItem({
  member,
  level = 0,
}: OrganogramMemberItemProps) {
  const Icon = POSITION_ICONS[member.position] || Users
  const label = POSITION_LABELS[member.position]?.singular || member.position
  const bgColor = POSITION_BG_COLORS[member.position] || 'bg-gray-100'
  const iconColor = POSITION_ICON_COLORS[member.position] || 'text-gray-600'
  const borderColor =
    POSITION_BORDER_COLORS[member.position] || 'border-l-gray-500'
  const hasSubordinates =
    member.subordinates &&
    (member.subordinates as GetOrganogram200TreeItem[]).length > 0

  // Gerar iniciais para o avatar
  function getInitials(name: string | null, email: string): string {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  // Se não tem subordinados, renderiza apenas o card sem accordion
  if (!hasSubordinates) {
    return (
      <div
        className={cn(
          'border-border rounded-lg border border-l-4 p-4',
          bgColor,
          borderColor,
          level > 0 && 'ml-4 sm:ml-6',
        )}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium">
            {getInitials(member.userName, member.userEmail)}
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2">
              <Icon size={16} className={cn('shrink-0', iconColor)} />
              <Text variant="title-14-16-500" className="text-muted-foreground">
                {label}
              </Text>
            </div>
            <Text
              variant="title-16-18-500"
              className="text-foreground truncate"
            >
              {member.userName || 'Sem nome'}
            </Text>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{member.userEmail}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Se tem subordinados, renderiza com accordion
  return (
    <div className={cn(level > 0 && 'ml-4 sm:ml-6')}>
      <Accordion type="single" collapsible>
        <AccordionItem
          value={member.id}
          className={cn(
            'border-border rounded-lg border border-l-4',
            bgColor,
            borderColor,
          )}
        >
          <AccordionTrigger className="px-4 hover:no-underline [&>svg:last-child]:hidden [&[data-state=open]>svg]:rotate-90">
            <div className="flex flex-1 items-center gap-3">
              {/* Avatar */}
              <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                {getInitials(member.userName, member.userEmail)}
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={cn('shrink-0', iconColor)} />
                  <Text
                    variant="title-14-16-500"
                    className="text-muted-foreground"
                  >
                    {label}
                  </Text>
                </div>
                <Text
                  variant="title-16-18-500"
                  className="text-foreground truncate"
                >
                  {member.userName || 'Sem nome'}
                </Text>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{member.userEmail}</span>
                </div>
              </div>

              {/* Contador de subordinados e seta */}
              <div className="flex items-center gap-2">
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                  {member.subordinatesCount}
                </span>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground shrink-0 transition-transform duration-200"
                />
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            <div className="flex flex-col gap-3 pt-2">
              {(member.subordinates as GetOrganogram200TreeItem[]).map(
                (subordinate) => (
                  <OrganogramMemberItem
                    key={subordinate.id}
                    member={subordinate}
                    level={level + 1}
                  />
                ),
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

interface TeamOrganogramProps {
  tree: GetOrganogram200TreeItem[]
  stats: {
    total: number
    byPosition: {
      director: number
      supervisor: number
      manager: number
      assistant_manager: number
      assistant: number
    }
  }
}

export function TeamOrganogram({ tree, stats }: TeamOrganogramProps) {
  if (tree.length === 0) {
    return (
      <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg p-8">
        <Users size={48} className="text-muted-foreground mb-4" />
        <Text variant="title-16-18-500" className="text-muted-foreground">
          Nenhum membro na equipe ainda
        </Text>
        <Text
          variant="title-14-16-500"
          className="text-muted-foreground/70 mt-1"
        >
          Nomeie membros para ver o organograma
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Estatísticas resumidas */}
      <div className="bg-muted/30 flex flex-wrap items-center justify-center gap-4 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <Text variant="title-14-16-500" className="text-foreground">
            <strong>{stats.total}</strong> membros na equipe
          </Text>
        </div>
        <div className="bg-border hidden h-4 w-px sm:block" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          {Object.entries(stats.byPosition).map(([position, count]) => {
            if (count === 0) return null
            const Icon = POSITION_ICONS[position]
            const iconColor = POSITION_ICON_COLORS[position]
            const label = POSITION_LABELS[position]?.plural || position
            return (
              <div key={position} className="flex items-center gap-1">
                <Icon size={14} className={iconColor} />
                <span className="text-muted-foreground text-xs">
                  {count}{' '}
                  {count === 1 ? POSITION_LABELS[position]?.singular : label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Árvore hierárquica */}
      <div className="flex flex-col gap-4">
        {tree.map((member) => (
          <OrganogramMemberItem key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}
