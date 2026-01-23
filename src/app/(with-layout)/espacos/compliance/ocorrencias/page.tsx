'use client'

import { Text } from '@/components/Text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
import {
  EarlyCheckoutListResponse,
  EarlyCheckoutOccurrence,
  fetchEarlyCheckoutOccurrencesInServer,
} from '@/services/occurrenceService'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  User,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { JustifyModal } from './justify-modal'

// Mapeamento de cargos para labels em português
const positionLabels: Record<string, string> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  assistant_manager: 'Subgerente',
  assistant: 'Assistente',
}

// Mapeamento de status para labels
const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  justified: 'Justificada',
  dismissed: 'Desconsiderada',
}

// Cores para os status
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  justified: 'bg-green-100 text-green-700 hover:bg-green-100',
  dismissed: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
}

/**
 * Formata data para exibição
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  try {
    return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    })
  } catch {
    return '-'
  }
}

/**
 * Formata período para exibição
 */
function formatPeriod(start: string | null, end: string): string {
  if (!start) return 'Sem pendências'
  try {
    const startDate = format(parseISO(start), 'dd/MM/yyyy', { locale: ptBR })
    const endDate = format(parseISO(end), 'dd/MM/yyyy', { locale: ptBR })
    return `${startDate} a ${endDate}`
  } catch {
    return 'Período inválido'
  }
}

/**
 * Formata horas trabalhadas
 */
function formatWorkedHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h${m.toString().padStart(2, '0')}min`
}

export default function OcorrenciasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Estados
  const [data, setData] = useState<EarlyCheckoutListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal de justificativa
  const [selectedOccurrence, setSelectedOccurrence] =
    useState<EarlyCheckoutOccurrence | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filtros locais (para debounce)
  const [searchName, setSearchName] = useState(
    searchParams.get('userName') || '',
  )

  // Parâmetros da URL
  const page = searchParams.get('page') || '1'
  const pageSize = searchParams.get('pageSize') || '10'
  const status = searchParams.get('status') || 'all'
  const position = searchParams.get('position') || ''
  const userName = searchParams.get('userName') || ''

  /**
   * Busca dados da API
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchEarlyCheckoutOccurrencesInServer({
        page,
        pageSize,
        status: status as 'pending' | 'justified' | 'dismissed' | 'all',
        userName: userName || undefined,
        position: position as
          | 'manager'
          | 'assistant_manager'
          | 'assistant'
          | undefined,
      })

      if (result) {
        setData(result)
      } else {
        setError('Não foi possível carregar os dados')
      }
    } catch (err) {
      console.error('Erro ao buscar ocorrências:', err)
      setError('Erro ao carregar ocorrências')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, status, userName, position])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /**
   * Atualiza URL com novos parâmetros
   */
  function updateUrl(newParams: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    // Reset para página 1 quando filtros mudam
    if (!newParams.page) {
      params.set('page', '1')
    }
    startTransition(() => {
      router.push(`/espacos/compliance/ocorrencias?${params.toString()}`)
    })
  }

  /**
   * Busca por nome (com debounce via Enter)
   */
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      updateUrl({ userName: searchName })
    }
  }

  /**
   * Abre modal de justificativa
   */
  function handleOpenJustifyModal(occurrence: EarlyCheckoutOccurrence) {
    setSelectedOccurrence(occurrence)
    setIsModalOpen(true)
  }

  /**
   * Callback após justificar com sucesso
   */
  function handleJustifySuccess() {
    setIsModalOpen(false)
    setSelectedOccurrence(null)
    fetchData() // Recarrega dados
  }

  /**
   * Gera URL de paginação
   */
  function buildPageUrl(newPage: number): string {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    return `/espacos/compliance/ocorrencias?${params.toString()}`
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        id="main"
        className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
      >
        <div className="mt-20 flex flex-col items-center justify-center gap-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <Text variant="body-16-18-400" className="text-muted-foreground">
            Carregando ocorrências...
          </Text>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div
        id="main"
        className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
      >
        <div className="mt-20 flex flex-col items-center justify-center gap-6">
          <AlertCircle size={120} className="text-destructive" />
          <Text
            variant="headline-24-45-700"
            className="text-primary text-center break-words"
          >
            Erro ao Carregar
          </Text>
          <Text
            variant="body-16-18-400"
            className="text-muted-foreground max-w-md text-center"
          >
            {error ||
              'Não foi possível carregar as ocorrências. Tente novamente.'}
          </Text>
          <Button asChild>
            <Link href="/espacos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Espaços
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const { indicators, period, occurrences, pagination } = data
  const currentPage = pagination.page
  const totalPages = pagination.totalPages

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Header */}
      <div className="mt-10 flex w-full max-w-6xl flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/espacos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <Text variant="headline-24-45-700" className="text-primary">
              Ocorrências de Checkout Antecipado
            </Text>
            <Text variant="body-16-18-400" className="text-muted-foreground">
              Período: {formatPeriod(period.start, period.end)}
            </Text>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total
            </CardDescription>
            <CardTitle className="text-3xl">{indicators.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              Pendentes
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-700">
              {indicators.pending}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Justificadas
            </CardDescription>
            <CardTitle className="text-3xl text-green-700">
              {indicators.justified}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-gray-700">
              <XCircle className="h-4 w-4" />
              Desconsideradas
            </CardDescription>
            <CardTitle className="text-3xl text-gray-700">
              {indicators.dismissed}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          {/* Filtro de Status */}
          <Select
            value={status}
            onValueChange={(value) => updateUrl({ status: value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="justified">Justificadas</SelectItem>
              <SelectItem value="dismissed">Desconsideradas</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Cargo */}
          <Select
            value={position || 'all'}
            onValueChange={(value) =>
              updateUrl({ position: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              <SelectItem value="manager">Gerente</SelectItem>
              <SelectItem value="assistant_manager">Subgerente</SelectItem>
              <SelectItem value="assistant">Assistente</SelectItem>
            </SelectContent>
          </Select>

          {/* Busca por nome */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
            />
          </div>
        </div>

        <Text variant="label-14-16-400" className="text-muted-foreground">
          {pagination.totalItems} ocorrência(s)
        </Text>
      </div>

      {/* Tabela - Desktop */}
      <Card className="hidden w-full max-w-6xl md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Horas Trabalhadas</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {occurrences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <Text variant="body-16-18-400">
                        Nenhuma ocorrência encontrada
                      </Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                occurrences.map((occurrence) => (
                  <TableRow key={occurrence.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {transformTextIntoCapitalizedWords(
                            occurrence.userName,
                          ) || 'Sem nome'}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {occurrence.userEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {positionLabels[occurrence.position || ''] ||
                          occurrence.position ||
                          '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="text-muted-foreground h-4 w-4" />
                        <span>
                          {transformTextIntoCapitalizedWords(
                            occurrence.supervisorName,
                          ) || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {formatDate(occurrence.checkOutAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium text-red-600">
                          {formatWorkedHours(occurrence.workedHours)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={statusColors[occurrence.status]}>
                        {statusLabels[occurrence.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {occurrence.status === 'pending' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenJustifyModal(occurrence)}
                        >
                          Justificar
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {occurrence.justifiedByName || '-'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cards - Mobile */}
      <div className="flex w-full max-w-6xl flex-col gap-4 md:hidden">
        {occurrences.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <Text variant="body-16-18-400">
                Nenhuma ocorrência encontrada
              </Text>
            </CardContent>
          </Card>
        ) : (
          occurrences.map((occurrence) => (
            <Card
              key={occurrence.id}
              className={
                occurrence.status === 'pending'
                  ? 'border-yellow-200 bg-yellow-50'
                  : occurrence.status === 'justified'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
              }
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between">
                    <div>
                      <Text variant="title-16-18-500" className="text-primary">
                        {transformTextIntoCapitalizedWords(
                          occurrence.userName,
                        ) || 'Sem nome'}
                      </Text>
                      <Text
                        variant="label-14-16-400"
                        className="text-muted-foreground"
                      >
                        {occurrence.userEmail}
                      </Text>
                    </div>
                    <Badge className={statusColors[occurrence.status]}>
                      {statusLabels[occurrence.status]}
                    </Badge>
                  </div>

                  {/* Informações */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Text
                        variant="label-14-16-400"
                        className="text-muted-foreground"
                      >
                        Cargo
                      </Text>
                      <Badge variant="secondary" className="mt-1">
                        {positionLabels[occurrence.position || ''] || '-'}
                      </Badge>
                    </div>
                    <div>
                      <Text
                        variant="label-14-16-400"
                        className="text-muted-foreground"
                      >
                        Horas Trabalhadas
                      </Text>
                      <Text variant="title-16-18-500" className="text-red-600">
                        {formatWorkedHours(occurrence.workedHours)}
                      </Text>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Text
                        variant="label-14-16-400"
                        className="text-muted-foreground"
                      >
                        Supervisor
                      </Text>
                      <Text variant="body-16-18-400">
                        {transformTextIntoCapitalizedWords(
                          occurrence.supervisorName,
                        ) || '-'}
                      </Text>
                    </div>
                    <div>
                      <Text
                        variant="label-14-16-400"
                        className="text-muted-foreground"
                      >
                        Data do Checkout
                      </Text>
                      <Text variant="body-16-18-400">
                        {formatDate(occurrence.checkOutAt)}
                      </Text>
                    </div>
                  </div>

                  {/* Ação */}
                  {occurrence.status === 'pending' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOpenJustifyModal(occurrence)}
                    >
                      Justificar Ocorrência
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination className="w-full max-w-6xl">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={currentPage > 1 ? buildPageUrl(currentPage - 1) : '#'}
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber: number
              if (totalPages <= 5) {
                pageNumber = i + 1
              } else if (currentPage <= 3) {
                pageNumber = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i
              } else {
                pageNumber = currentPage - 2 + i
              }
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href={buildPageUrl(pageNumber)}
                    isActive={pageNumber === currentPage}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                href={
                  currentPage < totalPages ? buildPageUrl(currentPage + 1) : '#'
                }
                aria-disabled={currentPage >= totalPages}
                className={
                  currentPage >= totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Modal de Justificativa */}
      <JustifyModal
        occurrence={selectedOccurrence}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOccurrence(null)
        }}
        onSuccess={handleJustifySuccess}
      />
    </div>
  )
}
