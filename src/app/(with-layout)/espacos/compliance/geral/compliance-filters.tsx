'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { Search, Users, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'

interface SupervisorFilter {
  name: string
  count: number
}

interface ComplianceFiltersProps {
  supervisors: SupervisorFilter[]
  currentSupervisorName?: string
  currentUserName?: string
  currentPosition?: string
  onlyNonCompliant: string
}

const positionOptions = [
  { value: 'all', label: 'Todos os cargos' },
  { value: 'manager', label: 'Gerente' },
  { value: 'assistant_manager', label: 'Subgerente' },
  { value: 'assistant', label: 'Assistente' },
]

export function ComplianceFilters({
  supervisors,
  currentSupervisorName,
  currentUserName,
  currentPosition,
  onlyNonCompliant,
}: ComplianceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentUserName || '')

  const buildUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams()

      // Sempre reseta para página 1 quando filtra
      params.set('page', '1')
      params.set('pageSize', searchParams.get('pageSize') || '10')

      // Mantém onlyNonCompliant
      if (onlyNonCompliant === 'true') {
        params.set('onlyNonCompliant', 'true')
      }

      // Valores atuais
      const currentValues = {
        supervisorName: searchParams.get('supervisorName') || undefined,
        userName: searchParams.get('userName') || undefined,
        position: searchParams.get('position') || undefined,
      }

      // Mescla com updates
      const newValues = { ...currentValues, ...updates }

      // Adiciona params que existem
      if (newValues.supervisorName) {
        params.set('supervisorName', newValues.supervisorName)
      }
      if (newValues.userName) {
        params.set('userName', newValues.userName)
      }
      if (newValues.position && newValues.position !== 'all') {
        params.set('position', newValues.position)
      }

      return `/espacos/compliance/geral?${params.toString()}`
    },
    [searchParams, onlyNonCompliant],
  )

  function handleSupervisorClick(supervisorName: string) {
    startTransition(() => {
      // Se clicar no mesmo supervisor, remove o filtro
      if (currentSupervisorName === supervisorName) {
        router.push(buildUrl({ supervisorName: undefined }))
      } else {
        router.push(buildUrl({ supervisorName }))
      }
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      router.push(buildUrl({ userName: searchValue || undefined }))
    })
  }

  function handlePositionChange(value: string) {
    startTransition(() => {
      router.push(buildUrl({ position: value === 'all' ? undefined : value }))
    })
  }

  function handleClearFilters() {
    setSearchValue('')
    startTransition(() => {
      router.push(
        `/espacos/compliance/geral?page=1&pageSize=10${onlyNonCompliant === 'true' ? '&onlyNonCompliant=true' : ''}`,
      )
    })
  }

  const hasActiveFilters =
    currentSupervisorName || currentUserName || currentPosition

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      {/* Filtros de Supervisor */}
      {supervisors.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Filtrar por Supervisor:
          </div>
          <div className="flex flex-wrap gap-2">
            {supervisors.map((supervisor) => (
              <Badge
                key={supervisor.name}
                variant={
                  currentSupervisorName === supervisor.name
                    ? 'default'
                    : 'outline'
                }
                className="hover:bg-primary/20 cursor-pointer px-3 py-1.5 text-sm transition-colors"
                onClick={() => handleSupervisorClick(supervisor.name)}
              >
                {transformTextIntoCapitalizedWords(supervisor.name)} (
                {supervisor.count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Busca por nome e filtro por cargo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar por nome do colaborador..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            Buscar
          </Button>
        </form>

        <Select
          value={currentPosition || 'all'}
          onValueChange={handlePositionChange}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por cargo" />
          </SelectTrigger>
          <SelectContent>
            {positionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botão limpar filtros */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Filtros ativos:</span>
          {currentSupervisorName && (
            <Badge variant="secondary">
              Supervisor:{' '}
              {transformTextIntoCapitalizedWords(currentSupervisorName)}
            </Badge>
          )}
          {currentUserName && (
            <Badge variant="secondary">Nome: {currentUserName}</Badge>
          )}
          {currentPosition && (
            <Badge variant="secondary">
              Cargo:{' '}
              {positionOptions.find((o) => o.value === currentPosition)?.label}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-destructive hover:text-destructive"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
