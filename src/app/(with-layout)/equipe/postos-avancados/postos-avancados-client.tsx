'use client'

import type {
  GetTeamMembers200MembersItem,
  ListOutposts200OutpostsItem,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Building2,
  Calendar,
  Loader2,
  MapPin,
  Pencil,
  Search,
  StopCircle,
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

// Dias da semana para exibição
const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}

// Dias úteis para seleção (0-6)
const WEEKDAYS_OPTIONS = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

interface PostosAvancadosClientProps {
  initialMembers: GetTeamMembers200MembersItem[]
  initialOutposts: ListOutposts200OutpostsItem[]
}

export function PostosAvancadosClient({
  initialMembers,
  initialOutposts,
}: PostosAvancadosClientProps) {
  const [members] = useState<GetTeamMembers200MembersItem[]>(initialMembers)
  const [outposts, setOutposts] =
    useState<ListOutposts200OutpostsItem[]>(initialOutposts)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'ended' | 'all'>(
    'active',
  )

  // Form state
  const [selectedMember, setSelectedMember] =
    useState<GetTeamMembers200MembersItem | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingOutpost, setEditingOutpost] =
    useState<ListOutposts200OutpostsItem | null>(null)

  // Verifica se o posto NÃO está encerrado (ativo ou agendado para o futuro)
  function isOutpostNotEnded(outpost: ListOutposts200OutpostsItem): boolean {
    if (!outpost.endDate) {
      return true // Sem data fim = não encerrado
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const end = new Date(outpost.endDate)
    end.setHours(0, 0, 0, 0)

    return today <= end // Se hoje <= endDate, não está encerrado
  }

  // Verifica se o posto está ativamente em vigor (hoje está no período)
  function isOutpostCurrentlyActive(
    outpost: ListOutposts200OutpostsItem,
  ): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(outpost.startDate)
    start.setHours(0, 0, 0, 0)

    if (outpost.endDate) {
      const end = new Date(outpost.endDate)
      end.setHours(0, 0, 0, 0)
      return today >= start && today <= end
    }

    return today >= start
  }

  // Filtra postos pelo status e busca
  const filteredOutposts = useMemo(() => {
    return outposts.filter((outpost) => {
      // Filtro de status: "active" mostra não-encerrados, "ended" mostra encerrados
      const notEnded = isOutpostNotEnded(outpost)
      if (statusFilter === 'active' && !notEnded) return false
      if (statusFilter === 'ended' && notEnded) return false

      // Filtro de busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const userName = (outpost.userName || '').toLowerCase()
        const userEmail = (outpost.userEmail || '').toLowerCase()
        const clientNameLower = (outpost.clientName || '').toLowerCase()
        return (
          userName.includes(query) ||
          userEmail.includes(query) ||
          clientNameLower.includes(query)
        )
      }

      return true
    })
  }, [outposts, statusFilter, searchQuery])

  // Filtra membros para busca no modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return []

    const query = memberSearchQuery.toLowerCase().trim()
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
  }, [members, memberSearchQuery])

  // Abre modal para novo posto
  function handleNewOutpost() {
    setSelectedMember(null)
    setClientName('')
    setClientAddress('')
    setStartDate('')
    setEndDate('')
    setSelectedWeekdays([])
    setEditingOutpost(null)
    setMemberSearchQuery('')
    setIsDialogOpen(true)
  }

  // Seleciona membro para o posto
  function handleSelectMember(member: GetTeamMembers200MembersItem) {
    setSelectedMember(member)
    setMemberSearchQuery('')
  }

  // Abre modal para editar posto
  function handleEditOutpost(outpost: ListOutposts200OutpostsItem) {
    const member = members.find((m) => m.userId === outpost.userId) || {
      userId: outpost.userId,
      name: outpost.userName,
      email: outpost.userEmail,
      position: outpost.userPosition as any,
      bookingExceptionUntil: null,
    }
    setSelectedMember(member)
    setClientName(outpost.clientName)
    setClientAddress(outpost.clientAddress)
    setStartDate(outpost.startDate)
    setEndDate(outpost.endDate || '')
    setSelectedWeekdays(outpost.weekdays)
    setEditingOutpost(outpost)
    setMemberSearchQuery('')
    setIsDialogOpen(true)
  }

  // Toggle weekday selection
  function handleToggleWeekday(day: number) {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  // Salva o posto avançado
  async function handleSaveOutpost() {
    if (!selectedMember) {
      showToast({
        message: 'Selecione um membro para o posto avançado',
        variant: 'error',
      })
      return
    }

    if (!clientName.trim() || clientName.length < 2) {
      showToast({
        message: 'O nome do cliente deve ter pelo menos 2 caracteres',
        variant: 'error',
      })
      return
    }

    if (!clientAddress.trim() || clientAddress.length < 5) {
      showToast({
        message: 'O endereço deve ter pelo menos 5 caracteres',
        variant: 'error',
      })
      return
    }

    if (!startDate) {
      showToast({
        message: 'Informe a data de início',
        variant: 'error',
      })
      return
    }

    if (selectedWeekdays.length === 0) {
      showToast({
        message: 'Selecione pelo menos um dia da semana',
        variant: 'error',
      })
      return
    }

    if (endDate && new Date(startDate) > new Date(endDate)) {
      showToast({
        message: 'A data de início não pode ser posterior à data de fim',
        variant: 'error',
      })
      return
    }

    setIsLoading(true)

    try {
      if (editingOutpost) {
        // Atualizar posto existente
        const response = await customFetch<{ message: string; outpost: any }>(
          `${env.NEXT_PUBLIC_API_URL}/v1/private/outposts/${editingOutpost.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              clientName: clientName.trim(),
              clientAddress: clientAddress.trim(),
              endDate: endDate || null,
              weekdays: selectedWeekdays.sort((a, b) => a - b),
            }),
          },
        )

        if (response.status < 200 || response.status >= 300) {
          const error = response.data as { message?: string }
          throw new Error(error?.message || 'Erro ao atualizar posto avançado')
        }

        showToast({
          message: 'Posto avançado atualizado com sucesso!',
          variant: 'success',
        })

        // Atualiza a lista
        setOutposts((prev) =>
          prev.map((o) =>
            o.id === editingOutpost.id
              ? {
                  ...o,
                  clientName: clientName.trim(),
                  clientAddress: clientAddress.trim(),
                  endDate: endDate || null,
                  weekdays: selectedWeekdays.sort((a, b) => a - b),
                  updatedAt: new Date().toISOString(),
                }
              : o,
          ),
        )
      } else {
        // Criar novo posto
        const response = await customFetch<{ message: string; outpost: any }>(
          `${env.NEXT_PUBLIC_API_URL}/v1/private/outposts`,
          {
            method: 'POST',
            body: JSON.stringify({
              userId: selectedMember.userId,
              clientName: clientName.trim(),
              clientAddress: clientAddress.trim(),
              startDate,
              endDate: endDate || null,
              weekdays: selectedWeekdays.sort((a, b) => a - b),
            }),
          },
        )

        if (response.status < 200 || response.status >= 300) {
          const error = response.data as { message?: string }
          throw new Error(error?.message || 'Erro ao criar posto avançado')
        }

        showToast({
          message: 'Posto avançado criado com sucesso!',
          variant: 'success',
        })

        // Adiciona na lista
        const newOutpost: ListOutposts200OutpostsItem = {
          id: response.data.outpost?.id || crypto.randomUUID(),
          userId: selectedMember.userId,
          userName: selectedMember.name,
          userEmail: selectedMember.email,
          userPosition: selectedMember.position,
          clientName: clientName.trim(),
          clientAddress: clientAddress.trim(),
          startDate,
          endDate: endDate || null,
          weekdays: selectedWeekdays.sort((a, b) => a - b),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: '',
        }
        setOutposts((prev) => [newOutpost, ...prev])
      }

      setIsDialogOpen(false)
      setEditingOutpost(null)
      setSelectedMember(null)
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao salvar posto avançado',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Encerra o posto avançado
  function handleEndOutpost(outpost: ListOutposts200OutpostsItem) {
    showToast({
      message: `Deseja realmente encerrar o posto avançado de ${outpost.userName || outpost.userEmail}?`,
      variant: 'warning',
      duration: 30000,
      firstButton: {
        text: 'Cancelar',
        variant: 'ghost',
        onClick: () => {},
      },
      secondButton: {
        text: 'Encerrar',
        variant: 'destructive',
        onClick: () => confirmEndOutpost(outpost),
      },
    })
  }

  async function confirmEndOutpost(outpost: ListOutposts200OutpostsItem) {
    setIsLoading(true)

    try {
      const response = await customFetch<{ message: string }>(
        `${env.NEXT_PUBLIC_API_URL}/v1/private/outposts/${outpost.id}`,
        {
          method: 'DELETE',
        },
      )

      if (response.status < 200 || response.status >= 300) {
        const error = response.data as { message?: string }
        throw new Error(error?.message || 'Erro ao encerrar posto avançado')
      }

      showToast({
        message: 'Posto avançado encerrado com sucesso!',
        variant: 'success',
      })

      // Atualiza a lista - o posto continua existindo mas com endDate = ontem
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      setOutposts((prev) =>
        prev.map((o) =>
          o.id === outpost.id
            ? {
                ...o,
                endDate: yesterdayStr,
                updatedAt: new Date().toISOString(),
              }
            : o,
        ),
      )
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao encerrar posto avançado',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Formata os dias da semana para exibição
  function formatWeekdays(weekdays: number[]): string {
    return weekdays
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_LABELS[d])
      .join(', ')
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header com ícone e descrição */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-full p-3">
          <Building2 className="text-primary size-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Postos Avançados</h1>
          <p className="text-muted-foreground">
            Gerencie membros alocados em clientes externos (isentos de regras
            internas)
          </p>
        </div>
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar por nome, email ou cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as 'active' | 'ended' | 'all')
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="ended">Encerrados</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNewOutpost}>
          <Building2 className="mr-2 size-4" />
          Novo Posto
        </Button>
      </div>

      {/* Tabela de postos avançados */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOutposts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  Nenhum posto avançado encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredOutposts.map((outpost) => {
                const notEnded = isOutpostNotEnded(outpost)
                const currentlyActive = isOutpostCurrentlyActive(outpost)
                return (
                  <TableRow key={outpost.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {outpost.userName || 'Sem nome'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {outpost.userEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{outpost.clientName}</p>
                        <p className="text-muted-foreground flex items-center gap-1 text-sm">
                          <MapPin className="size-3" />
                          {outpost.clientAddress}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="text-muted-foreground size-4" />
                        <span>
                          {format(parseISO(outpost.startDate), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                          {outpost.endDate ? (
                            <>
                              {' '}
                              até{' '}
                              {format(parseISO(outpost.endDate), 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              {' '}
                              (sem fim)
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatWeekdays(outpost.weekdays)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!notEnded ? (
                        <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                          Encerrado
                        </span>
                      ) : currentlyActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600">
                          Agendado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOutpost(outpost)}
                          disabled={isLoading || !notEnded}
                          title={notEnded ? 'Editar' : 'Posto encerrado'}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEndOutpost(outpost)}
                          disabled={isLoading || !notEnded}
                          title={
                            notEnded ? 'Encerrar posto' : 'Posto encerrado'
                          }
                        >
                          <StopCircle className="text-destructive size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal para criar/editar posto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOutpost ? 'Editar Posto Avançado' : 'Novo Posto Avançado'}
            </DialogTitle>
            <DialogDescription>
              {editingOutpost
                ? 'Altere os dados do posto avançado. O membro e data de início não podem ser alterados.'
                : 'Configure um membro para trabalhar em posto avançado (cliente externo).'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Seleção de membro (apenas para novo) */}
            {!editingOutpost ? (
              <div className="grid gap-2">
                <Label htmlFor="member" className="flex items-center gap-2">
                  <Users className="size-4" />
                  Membro
                </Label>
                {selectedMember ? (
                  <div className="bg-muted flex items-center justify-between rounded-md p-3">
                    <div>
                      <p className="font-medium">
                        {selectedMember.name || 'Sem nome'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {selectedMember.email} •{' '}
                        {POSITION_LABELS[selectedMember.position] ||
                          selectedMember.position}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMember(null)}
                    >
                      Trocar
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="memberSearch"
                      type="text"
                      placeholder="Digite para buscar um membro..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                    />
                    {memberSearchQuery.trim() && filteredMembers.length > 0 && (
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
                              <p className="font-medium">
                                {member.name || 'Sem nome'}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {member.email} •{' '}
                                {POSITION_LABELS[member.position] ||
                                  member.position}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {memberSearchQuery.trim() &&
                      filteredMembers.length === 0 && (
                        <div className="bg-background absolute z-10 mt-1 w-full rounded-md border p-4 text-center shadow-lg">
                          <p className="text-muted-foreground">
                            Nenhum membro encontrado
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted rounded-md p-3">
                <Label className="text-muted-foreground mb-1 text-xs">
                  Membro (não editável)
                </Label>
                <p className="font-medium">
                  {selectedMember?.name || 'Sem nome'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {selectedMember?.email}
                </p>
              </div>
            )}

            {/* Nome do cliente */}
            <div className="grid gap-2">
              <Label htmlFor="clientName">Nome do Cliente/Posto</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Ex: Empresa XYZ"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Endereço */}
            <div className="grid gap-2">
              <Label htmlFor="clientAddress">Endereço Completo</Label>
              <Input
                id="clientAddress"
                type="text"
                placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo/SP"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!!editingOutpost}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">
                  Data de Fim{' '}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid gap-2">
              <Label>Dias da Semana no Posto</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS_OPTIONS.map((day) => (
                  <label
                    key={day.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                      selectedWeekdays.includes(day.value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={selectedWeekdays.includes(day.value)}
                      onCheckedChange={() => handleToggleWeekday(day.value)}
                      className="sr-only"
                    />
                    <span className="text-sm">{day.label.substring(0, 3)}</span>
                  </label>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Selecione os dias em que o membro estará no posto avançado
              </p>
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
            <Button onClick={handleSaveOutpost} disabled={isLoading}>
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
