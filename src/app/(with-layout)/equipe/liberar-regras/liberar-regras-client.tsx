'use client'

import type { GetTeamMembers200MembersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { grantBookingException } from '@/api/endpoints/user/user'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { endOfWeek, format, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Loader2, Search, Shield, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

// Mapa de posições para labels em português
const POSITION_LABELS: Record<string, string> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  assistant_manager: 'Subgerente',
  assistant: 'Assistente',
}

interface LiberarRegrasClientProps {
  initialMembers: GetTeamMembers200MembersItem[]
}

export function LiberarRegrasClient({
  initialMembers,
}: LiberarRegrasClientProps) {
  const [members, setMembers] =
    useState<GetTeamMembers200MembersItem[]>(initialMembers)
  const [loadingMemberIds, setLoadingMemberIds] = useState<Set<string>>(
    new Set(),
  )
  const [searchQuery, setSearchQuery] = useState('')

  // Calcula o próximo sábado (final da semana)
  const saturdayOfWeek = endOfWeek(new Date(), { weekStartsOn: 0 })
  const formattedDate = format(saturdayOfWeek, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  })

  // Filtra membros pelo nome, email ou cargo
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members

    const query = searchQuery.toLowerCase().trim()
    return members.filter((member) => {
      const name = (member.name || '').toLowerCase()
      const email = (member.email || '').toLowerCase()
      const position = (POSITION_LABELS[member.position] || '').toLowerCase()
      return (
        name.includes(query) ||
        email.includes(query) ||
        position.includes(query)
      )
    })
  }, [members, searchQuery])

  // Verifica se a exceção está ativa (data >= agora)
  function isExceptionActive(bookingExceptionUntil: string | null): boolean {
    if (!bookingExceptionUntil) return false
    return isAfter(new Date(bookingExceptionUntil), new Date())
  }

  // Alterna a exceção de um membro específico usando função do Orval
  async function toggleException(member: GetTeamMembers200MembersItem) {
    const currentlyActive = isExceptionActive(member.bookingExceptionUntil)
    const active = !currentlyActive

    setLoadingMemberIds((prev) => new Set(prev).add(member.userId))

    try {
      const response = await grantBookingException(
        member.userId,
        { active },
        { credentials: 'include' },
      )

      if (response.status === 200) {
        // Atualizar estado local
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === member.userId
              ? {
                  ...m,
                  bookingExceptionUntil:
                    response.data.user.bookingExceptionUntil,
                }
              : m,
          ),
        )

        const displayName = member.name || member.email
        toast.success(
          active
            ? `Exceção concedida para ${displayName} até ${formattedDate}`
            : `Exceção revogada para ${displayName}`,
        )
      } else {
        toast.error('Erro ao atualizar exceção. Tente novamente.')
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente mais tarde.')
    } finally {
      setLoadingMemberIds((prev) => {
        const next = new Set(prev)
        next.delete(member.userId)
        return next
      })
    }
  }

  return (
    <div className="mt-5 flex w-full max-w-6xl flex-col gap-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="text-primary size-6" />
          <h1 className="font-manrope text-xl font-bold">
            Liberar Regras de Reserva
          </h1>
        </div>
        <p className="text-muted-foreground">
          Conceda exceções temporárias às regras de reserva para membros do seu
          time. A exceção permite reservas na semana atual sem as restrições de
          prazo e limites de dias.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-muted/50 flex items-start gap-3 rounded-lg border p-4">
        <Calendar className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Exceções válidas até: {formattedDate}</p>
          <p className="text-muted-foreground text-sm">
            A exceção expira automaticamente no final desta semana (sábado às
            23:59).
          </p>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground size-5" />
          <p className="font-medium">Membros do Time ({members.length})</p>
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Buscar por nome, email ou cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contador de resultados filtrados */}
        {searchQuery && (
          <p className="text-muted-foreground text-sm">
            {filteredMembers.length} de {members.length} membro(s) encontrado(s)
          </p>
        )}

        {members.length === 0 ? (
          <div className="bg-muted/30 rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum membro do time encontrado para gerenciar.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-muted/30 rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum membro encontrado com &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] divide-y overflow-y-auto rounded-lg border">
            {filteredMembers.map((member) => {
              const active = isExceptionActive(member.bookingExceptionUntil)
              const isUpdating = loadingMemberIds.has(member.userId)

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {member.name || member.email}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">
                      {POSITION_LABELS[member.position] || member.position}
                      {member.name && ` • ${member.email}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isUpdating ? (
                      <Loader2 className="text-muted-foreground size-4 animate-spin" />
                    ) : (
                      <>
                        <Label
                          htmlFor={`switch-${member.userId}`}
                          className="text-muted-foreground text-sm"
                        >
                          {active ? 'Ativo' : 'Inativo'}
                        </Label>
                        <Switch
                          id={`switch-${member.userId}`}
                          checked={active}
                          disabled={isUpdating}
                          onCheckedChange={() => toggleException(member)}
                        />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-muted/30 rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">
          <strong>O que a exceção libera:</strong>
          <br />• Permite reservar na semana atual (mesmo após sexta-feira)
          <br />• Ignora os limites de dias por cargo (2-3 dias/semana)
          <br />• Remove a obrigatoriedade de segunda ou sexta-feira
          <br />
          <br />
          <strong>O que a exceção NÃO altera:</strong>
          <br />• Continua valendo apenas 1 reserva de workstation por dia
        </p>
      </div>
    </div>
  )
}
