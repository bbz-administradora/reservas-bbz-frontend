'use client'

import type { GetTeamMembers200MembersItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  Loader2,
  Pencil,
  Search,
  Trash2,
  UserMinus,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { showToast } from '@/components/ShowToast'
import { env } from '@/infra/env'

// Mapa de posições para labels em português
const POSITION_LABELS: Record<string, string> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  assistant_manager: 'Subgerente',
  assistant: 'Assistente',
}

interface AbsenceItem {
  userId: string
  userName: string | null
  userEmail: string
  position: string | null
  supervisorName: string | null
  absenceStartDate: string
  absenceEndDate: string
  isActive: boolean
}

interface AfastamentosClientProps {
  initialMembers: GetTeamMembers200MembersItem[]
  initialAbsences: AbsenceItem[]
}

export function AfastamentosClient({
  initialMembers,
  initialAbsences,
}: AfastamentosClientProps) {
  const [members] = useState<GetTeamMembers200MembersItem[]>(initialMembers)
  const [absences, setAbsences] = useState<AbsenceItem[]>(initialAbsences)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] =
    useState<GetTeamMembers200MembersItem | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingAbsence, setEditingAbsence] = useState<AbsenceItem | null>(null)

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

  // Abre o modal para adicionar novo afastamento
  function handleSelectMember(member: GetTeamMembers200MembersItem) {
    setSelectedMember(member)
    setStartDate('')
    setEndDate('')
    setEditingAbsence(null)
    setIsDialogOpen(true)
    setSearchQuery('')
  }

  // Abre o modal para editar afastamento existente
  function handleEditAbsence(absence: AbsenceItem) {
    // Encontrar o membro correspondente
    const member = members.find((m) => m.userId === absence.userId) || {
      userId: absence.userId,
      name: absence.userName,
      email: absence.userEmail,
      position: absence.position as any,
      bookingExceptionUntil: null,
    }
    setSelectedMember(member)
    setStartDate(absence.absenceStartDate)
    setEndDate(absence.absenceEndDate)
    setEditingAbsence(absence)
    setIsDialogOpen(true)
  }

  // Salva o afastamento
  async function handleSaveAbsence() {
    if (!selectedMember) return

    if (!startDate || !endDate) {
      showToast({
        message: 'Preencha as datas de início e fim do afastamento',
        variant: 'error',
      })
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      showToast({
        message: 'A data de início não pode ser posterior à data de fim',
        variant: 'error',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await customFetch<{ message: string }>(
        `${env.NEXT_PUBLIC_API_URL}/v1/private/user/${selectedMember.userId}/absence`,
        {
          method: 'PUT',
          body: JSON.stringify({ startDate, endDate }),
        },
      )

      if (response.status < 200 || response.status >= 300) {
        const error = response.data as { message?: string }
        throw new Error(error?.message || 'Erro ao salvar afastamento')
      }

      showToast({
        message: editingAbsence
          ? 'Afastamento atualizado com sucesso!'
          : 'Afastamento registrado com sucesso!',
        variant: 'success',
      })

      // Atualiza a lista de afastamentos
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const start = new Date(startDate)
      const end = new Date(endDate)
      const isActive = today >= start && today <= end

      const newAbsence: AbsenceItem = {
        userId: selectedMember.userId,
        userName: selectedMember.name,
        userEmail: selectedMember.email,
        position: selectedMember.position,
        supervisorName: null,
        absenceStartDate: startDate,
        absenceEndDate: endDate,
        isActive,
      }

      if (editingAbsence) {
        setAbsences((prev) =>
          prev.map((a) =>
            a.userId === selectedMember.userId ? newAbsence : a,
          ),
        )
      } else {
        setAbsences((prev) => [...prev, newAbsence])
      }

      setIsDialogOpen(false)
      setSelectedMember(null)
      setEditingAbsence(null)
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : 'Erro ao salvar afastamento',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Remove o afastamento
  function handleRemoveAbsence(absence: AbsenceItem) {
    showToast({
      message: `Deseja realmente remover o afastamento de ${absence.userName || absence.userEmail}?`,
      variant: 'warning',
      duration: 30000,
      firstButton: {
        text: 'Cancelar',
        variant: 'ghost',
        onClick: () => {},
      },
      secondButton: {
        text: 'Remover',
        variant: 'destructive',
        onClick: () => confirmRemoveAbsence(absence),
      },
    })
  }

  // Confirma a remoção do afastamento
  async function confirmRemoveAbsence(absence: AbsenceItem) {
    setIsLoading(true)

    try {
      const response = await customFetch<{ message: string }>(
        `${env.NEXT_PUBLIC_API_URL}/v1/private/user/${absence.userId}/absence`,
        {
          method: 'PUT',
          body: JSON.stringify({ startDate: null, endDate: null }),
        },
      )

      if (response.status < 200 || response.status >= 300) {
        const error = response.data as { message?: string }
        throw new Error(error?.message || 'Erro ao remover afastamento')
      }

      showToast({
        message: 'Afastamento removido com sucesso!',
        variant: 'success',
      })

      // Remove da lista
      setAbsences((prev) => prev.filter((a) => a.userId !== absence.userId))
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao remover afastamento',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header com ícone e descrição */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-full p-3">
          <UserMinus className="text-primary size-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Afastamentos</h1>
          <p className="text-muted-foreground">
            Gerencie afastamentos (férias, licenças, etc.) dos membros da equipe
          </p>
        </div>
      </div>

      {/* Barra de busca para adicionar novo afastamento */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="search" className="flex items-center gap-2">
          <Search className="size-4" />
          Buscar membro para adicionar afastamento
        </Label>
        <div className="relative">
          <Input
            id="search"
            type="text"
            placeholder="Digite o nome, email ou cargo do membro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {/* Lista de sugestões */}
          {searchQuery.trim() && filteredMembers.length > 0 && (
            <div className="bg-background absolute z-10 mt-1 w-full rounded-md border shadow-lg">
              {filteredMembers.slice(0, 5).map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  className="hover:bg-muted flex w-full items-center gap-3 px-4 py-3 text-left"
                  onClick={() => handleSelectMember(member)}
                >
                  <Users className="text-muted-foreground size-5" />
                  <div className="flex-1">
                    <p className="font-medium">{member.name || 'Sem nome'}</p>
                    <p className="text-muted-foreground text-sm">
                      {member.email} •{' '}
                      {POSITION_LABELS[member.position] || member.position}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim() && filteredMembers.length === 0 && (
            <div className="bg-background absolute z-10 mt-1 w-full rounded-md border p-4 text-center shadow-lg">
              <p className="text-muted-foreground">Nenhum membro encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de afastamentos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {absences.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  Nenhum afastamento registrado
                </TableCell>
              </TableRow>
            ) : (
              absences.map((absence) => (
                <TableRow key={absence.userId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {absence.userName || 'Sem nome'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {absence.userEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {absence.position
                      ? POSITION_LABELS[absence.position] || absence.position
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground size-4" />
                      <span>
                        {format(
                          parseISO(absence.absenceStartDate),
                          'dd/MM/yyyy',
                          {
                            locale: ptBR,
                          },
                        )}{' '}
                        até{' '}
                        {format(
                          parseISO(absence.absenceEndDate),
                          'dd/MM/yyyy',
                          {
                            locale: ptBR,
                          },
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {absence.isActive ? (
                      <span className="bg-destructive/10 text-destructive inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                        Afastado
                      </span>
                    ) : (
                      <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                        Agendado
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAbsence(absence)}
                        disabled={isLoading}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAbsence(absence)}
                        disabled={isLoading}
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal para adicionar/editar afastamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAbsence ? 'Editar Afastamento' : 'Novo Afastamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  {selectedMember.name || selectedMember.email} •{' '}
                  {POSITION_LABELS[selectedMember.position] ||
                    selectedMember.position}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveAbsence} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
