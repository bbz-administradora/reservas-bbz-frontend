import { WeeklyComplianceDetailsParams } from '@/api/endpoints/bBZAppBackendAPI.schemas'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchWeeklyComplianceDetailsInServer } from '@/services/reservationService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Mail,
  User,
  UserCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Mapeamento de cargos para labels em português
const positionLabels: Record<string, string> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  assistant_manager: 'Subgerente',
  assistant: 'Assistente',
}

interface SearchParams {
  page?: string
  pageSize?: string
  onlyNonCompliant?: string
}

export default async function ComplianceEquipePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  // Validação de permissão: apenas supervisor, diretor, dev ou admin
  const { user } = await fetchCurrentUserInServer()
  const allowedRoles = ['dev', 'admin']
  const allowedPositions = ['supervisor', 'director']

  const hasPermission =
    allowedRoles.includes(user?.role || '') ||
    allowedPositions.includes(user?.teamPosition || '')

  if (!hasPermission) {
    redirect('/espacos')
  }

  const params = await searchParams
  const page = params.page || '1'
  const pageSize = params.pageSize || '10'
  const onlyNonCompliant = params.onlyNonCompliant || 'false'

  const queryParams: WeeklyComplianceDetailsParams = {
    page,
    pageSize,
    onlyNonCompliant,
  }

  const data = await fetchWeeklyComplianceDetailsInServer(queryParams)

  // Se não há dados ou erro, mostrar mensagem de erro
  if (!data) {
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
            Acesso Negado
          </Text>
          <Text
            variant="body-16-18-400"
            className="text-muted-foreground max-w-md text-center"
          >
            Você não tem permissão para visualizar esta página. Apenas
            supervisores podem acessar os detalhes de compliance da equipe.
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

  // Formatar datas para exibição
  const weekStart = format(new Date(data.nextWeekStart), "dd 'de' MMMM", {
    locale: ptBR,
  })
  const weekEnd = format(new Date(data.nextWeekEnd), "dd 'de' MMMM", {
    locale: ptBR,
  })

  // Usar os contadores totais do backend
  // Nota: após regenerar os tipos com `npm run generate:api`, remover os casts
  const totalMembers = data.totalCount
  const compliantCount =
    (data as { compliantCount?: number }).compliantCount ?? 0
  const nonCompliantCount =
    (data as { nonCompliantCount?: number }).nonCompliantCount ?? 0

  // Gerar páginas para paginação
  const currentPage = parseInt(page)
  const totalPages = data.totalPages

  function buildUrl(newPage: number) {
    const params = new URLSearchParams()
    params.set('page', String(newPage))
    params.set('pageSize', pageSize)
    if (onlyNonCompliant === 'true') {
      params.set('onlyNonCompliant', 'true')
    }
    return `/espacos/compliance/equipe?${params.toString()}`
  }

  // Determinar se é o próprio supervisor ou admin/dev visualizando
  const isSupervisor = user?.teamPosition === 'supervisor'
  const supervisorDisplayName = isSupervisor
    ? user?.name || 'Você'
    : 'Supervisor'

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
              Compliance da Equipe
            </Text>
            <Text variant="body-16-18-400" className="text-muted-foreground">
              Período: {weekStart} - {weekEnd}
            </Text>
          </div>
        </div>

        {/* Badge do Supervisor */}
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <UserCheck className="h-5 w-5 text-blue-600" />
          <Text variant="body-16-18-400" className="text-blue-800">
            {isSupervisor ? (
              <>
                Você está visualizando <strong>sua equipe</strong>
              </>
            ) : (
              <>
                Visualizando como <strong>{user?.role}</strong>
              </>
            )}
          </Text>
        </div>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Membros
            </CardDescription>
            <CardTitle className="text-3xl">{totalMembers}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Em Dia
            </CardDescription>
            <CardTitle className="text-3xl text-green-700">
              {compliantCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              Pendentes
            </CardDescription>
            <CardTitle className="text-3xl text-red-700">
              {nonCompliantCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtro */}
      <div className="flex w-full max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Text variant="title-16-18-500" className="text-muted-foreground">
          Mostrando {data.members.length} de {data.totalCount} membros
        </Text>
        <div className="flex gap-2">
          <Button
            variant={onlyNonCompliant === 'false' ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link href="/espacos/compliance/equipe?page=1&pageSize=10&onlyNonCompliant=false">
              Todos
            </Link>
          </Button>
          <Button
            variant={onlyNonCompliant === 'true' ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link href="/espacos/compliance/equipe?page=1&pageSize=10&onlyNonCompliant=true">
              Apenas Pendentes
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabela - Desktop */}
      <Card className="hidden w-full max-w-6xl md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-center">Obrigatório</TableHead>
                <TableHead className="text-center">Reservado</TableHead>
                <TableHead className="text-center">Faltante</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <Text variant="body-16-18-400">
                        Todos os membros estão em dia!
                      </Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.members.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {transformTextIntoCapitalizedWords(member.userName) ||
                            'Sem nome'}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {member.userEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {positionLabels[member.position] || member.position}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {member.requiredDays} dias
                    </TableCell>
                    <TableCell className="text-center">
                      {member.reservedDays} dias
                    </TableCell>
                    <TableCell className="text-center">
                      {member.missingDays > 0 ? (
                        <span className="font-medium text-red-600">
                          {member.missingDays} dias
                        </span>
                      ) : (
                        <span className="text-green-600">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.isCompliant ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Em dia
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Pendente
                        </Badge>
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
        {data.members.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <Text variant="body-16-18-400">
                Todos os membros estão em dia!
              </Text>
            </CardContent>
          </Card>
        ) : (
          data.members.map((member) => (
            <Card
              key={member.userId}
              className={
                member.isCompliant
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="text-muted-foreground h-5 w-5" />
                      <div>
                        <Text
                          variant="title-16-18-500"
                          className="text-primary"
                        >
                          {transformTextIntoCapitalizedWords(member.userName) ||
                            'Sem nome'}
                        </Text>
                        <Badge variant="secondary" className="mt-1">
                          {positionLabels[member.position] || member.position}
                        </Badge>
                      </div>
                    </div>
                    {member.isCompliant ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Em dia
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </div>

                  {/* Email */}
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    {member.userEmail}
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <Text
                        variant="label-14-16-400"
                        className="text-muted-foreground"
                      >
                        Obrigatório
                      </Text>
                      <Text variant="title-16-18-500" className="text-primary">
                        {member.requiredDays} dias
                      </Text>
                    </div>
                    <div className="text-center">
                      <Text
                        variant="label-14-16-400"
                        className="text-muted-foreground"
                      >
                        Reservado
                      </Text>
                      <Text variant="title-16-18-500" className="text-primary">
                        {member.reservedDays} dias
                      </Text>
                    </div>
                    <div className="text-center">
                      <Text
                        variant="label-14-16-400"
                        className="text-muted-foreground"
                      >
                        Faltante
                      </Text>
                      <Text
                        variant="title-16-18-500"
                        className={
                          member.missingDays > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }
                      >
                        {member.missingDays > 0
                          ? `${member.missingDays} dias`
                          : '-'}
                      </Text>
                    </div>
                  </div>
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
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious href={buildUrl(currentPage - 1)} />
              </PaginationItem>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((pageNum) => {
                // Mostra apenas páginas próximas à atual para não poluir
                const diff = Math.abs(pageNum - currentPage)
                return diff <= 2 || pageNum === 1 || pageNum === totalPages
              })
              .map((pageNum, index, array) => {
                // Adiciona ellipsis se houver gap
                const prevPage = array[index - 1]
                const showEllipsis = prevPage && pageNum - prevPage > 1

                return (
                  <PaginationItem key={pageNum}>
                    {showEllipsis && (
                      <span className="text-muted-foreground px-2">...</span>
                    )}
                    <PaginationLink
                      href={buildUrl(pageNum)}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext href={buildUrl(currentPage + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
