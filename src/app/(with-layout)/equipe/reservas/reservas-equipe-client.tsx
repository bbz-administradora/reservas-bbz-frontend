'use client'

import type {
  GetTeamMembers200MembersItem,
  ListSpaceReservations200ReservationsItem,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { listSpaceReservations } from '@/api/endpoints/reservation/reservation'
import { DataTableReservations } from '@/components/data-table/reservations/table-reservations'
import { Input } from '@/components/ui/input'
import { addWeeks, endOfWeek, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Loader2, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

// Mapa de posições para labels em português
const POSITION_LABELS: Record<string, string> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  assistant_manager: 'Subgerente',
  assistant: 'Assistente',
}

interface ReservasEquipeClientProps {
  initialMembers: GetTeamMembers200MembersItem[]
}

export function ReservasEquipeClient({
  initialMembers,
}: ReservasEquipeClientProps) {
  const [members] = useState<GetTeamMembers200MembersItem[]>(initialMembers)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] =
    useState<GetTeamMembers200MembersItem | null>(null)
  const [reservations, setReservations] = useState<
    ListSpaceReservations200ReservationsItem[]
  >([])
  const [isLoadingReservations, setIsLoadingReservations] = useState(false)

  // Calcula o período: início da semana atual (domingo) até o final da próxima semana (sábado)
  const today = new Date()
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 }) // Domingo
  const endOfNextWeek = endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 }) // Sábado da próxima semana

  const formattedPeriod = `${format(startOfCurrentWeek, "dd 'de' MMMM", { locale: ptBR })} a ${format(endOfNextWeek, "dd 'de' MMMM", { locale: ptBR })}`

  // Filtra membros pelo nome, email ou cargo
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return []

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

  // Busca reservas ao selecionar um membro
  async function handleSelectMember(member: GetTeamMembers200MembersItem) {
    setSelectedMember(member)
    setSearchQuery('')
    setIsLoadingReservations(true)

    try {
      const response = await listSpaceReservations(
        {
          userId: member.userId,
          startDate: format(startOfCurrentWeek, 'yyyy-MM-dd'),
          endDate: format(endOfNextWeek, 'yyyy-MM-dd'),
          pageSize: '100',
        },
        { credentials: 'include' },
      )

      if (response.status === 200) {
        setReservations(response.data.reservations || [])
      } else {
        setReservations([])
      }
    } catch {
      setReservations([])
    } finally {
      setIsLoadingReservations(false)
    }
  }

  // Limpa a seleção
  function handleClearSelection() {
    setSelectedMember(null)
    setReservations([])
  }

  return (
    <div className="mt-5 flex w-full max-w-6xl flex-col gap-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="text-primary size-6" />
          <h1 className="font-manrope text-xl font-bold">Reservas da Equipe</h1>
        </div>
        <p className="text-muted-foreground">
          Consulte as reservas dos membros da sua equipe. Selecione um membro
          para ver suas reservas do período.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-muted/50 flex items-start gap-3 rounded-lg border p-4">
        <Calendar className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Período exibido: {formattedPeriod}</p>
          <p className="text-muted-foreground text-sm">
            Mostrando reservas do início da semana atual até o final da próxima
            semana.
          </p>
        </div>
      </div>

      {/* Busca e seleção de membro */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Search className="text-muted-foreground size-5" />
          <p className="font-medium">
            {selectedMember
              ? `Membro selecionado: ${selectedMember.name || selectedMember.email}`
              : `Buscar Membro (${members.length} disponíveis)`}
          </p>
        </div>

        {/* Campo de Busca */}
        {!selectedMember && (
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Digite o nome, email ou cargo para buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Lista de resultados da busca */}
        {!selectedMember && filteredMembers.length > 0 && (
          <div className="max-h-[300px] divide-y overflow-y-auto rounded-lg border">
            {filteredMembers.map((member) => (
              <button
                key={member.userId}
                type="button"
                onClick={() => handleSelectMember(member)}
                className="hover:bg-muted/50 flex w-full items-center justify-between gap-4 p-4 text-left transition-colors"
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
                <span className="text-primary text-sm">Selecionar →</span>
              </button>
            ))}
          </div>
        )}

        {/* Mensagem quando não há resultados */}
        {!selectedMember && searchQuery && filteredMembers.length === 0 && (
          <div className="bg-muted/30 rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum membro encontrado com &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {/* Membro selecionado */}
        {selectedMember && (
          <div className="bg-primary/5 flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {selectedMember.name || selectedMember.email}
              </p>
              <p className="text-muted-foreground truncate text-sm">
                {POSITION_LABELS[selectedMember.position] ||
                  selectedMember.position}
                {selectedMember.name && ` • ${selectedMember.email}`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              Alterar membro
            </button>
          </div>
        )}
      </div>

      {/* Tabela de reservas */}
      {selectedMember && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground size-5" />
            <p className="font-medium">
              Reservas de {selectedMember.name || selectedMember.email} (
              {reservations.length})
            </p>
          </div>

          {isLoadingReservations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary size-8 animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-muted/30 rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">
                Nenhuma reserva encontrada para o período.
              </p>
            </div>
          ) : (
            <DataTableReservations
              initialData={reservations}
              allList={true}
              className="rounded-lg border"
            />
          )}
        </div>
      )}

      {/* Instrução inicial */}
      {!selectedMember && !searchQuery && (
        <div className="bg-muted/30 rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Digite o nome de um membro acima para buscar suas reservas.
          </p>
        </div>
      )}
    </div>
  )
}
