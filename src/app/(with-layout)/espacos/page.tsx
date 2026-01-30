import { AbsenceAlert } from '@/components/AbsenceAlert'
import { CancelledReservationsCard } from '@/components/CancelledReservationsCard'
import { EarlyCheckoutCard } from '@/components/EarlyCheckoutCard'
import { SpaceExplorerSection } from '@/components/SpaceExplorerSection'
import { CardDecoration } from '@/components/svg/card-decoration'
import { Text } from '@/components/Text'
import { Separator } from '@/components/ui/separator'
import { WeeklyComplianceCard } from '@/components/WeeklyComplianceCard'
import { fetchEarlyCheckoutIndicatorsInServer } from '@/services/occurrenceService'
import {
  fetchCancelledReservationsOverviewInServer,
  fetchSpaceReservationStatsInServer,
  fetchWeeklyComplianceOverviewInServer,
} from '@/services/reservationService'
import { fetchAvailableSpacesInServer } from '@/services/spaceSlotService'
import { fetchCurrentUserInServer } from '@/services/userService'
import { format, startOfDay } from 'date-fns'
import {
  CalendarCheck2Icon,
  CalendarClockIcon,
  DoorOpenIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react'
import Link from 'next/link'

export default async function SpacesHome() {
  // criando a data de hoje com hora, minutos e segundos zerados para garantir que a consulta seja feita apenas com a data
  const now = new Date()
  const start = startOfDay(now)
  // Formatando no padrão ISO 8601 com o 'T' separador entre data e hora (requerido pelo backend)
  const today = format(start, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")

  // Buscar usuário primeiro para verificar permissões
  const { user } = await fetchCurrentUserInServer()

  const listAvailableSpaces = await fetchAvailableSpacesInServer({
    page: '1',
    pageSize: '9',
    datetime: today,
    type: 'room', // ou 'workstation' se necessário
  })

  // Buscar estatísticas de reservas do usuário
  const spaceReservationStats = await fetchSpaceReservationStatsInServer()

  // Buscar dados de compliance semanal
  const weeklyCompliance = await fetchWeeklyComplianceOverviewInServer()

  // Verificar se o usuário tem permissão para ver indicadores de compliance
  // (admin, dev, supervisor, diretor)
  const canViewComplianceIndicators =
    user?.role === 'admin' ||
    user?.role === 'dev' ||
    user?.teamPosition === 'director' ||
    user?.teamPosition === 'supervisor'

  // Buscar indicadores de checkout antecipado (apenas para supervisores/diretores/admin/dev)
  const earlyCheckoutIndicators = canViewComplianceIndicators
    ? await fetchEarlyCheckoutIndicatorsInServer()
    : null

  // Buscar indicadores de cancelamentos fora do prazo (apenas para supervisores/diretores/admin/dev)
  const cancelledReservationsOverview = canViewComplianceIndicators
    ? await fetchCancelledReservationsOverviewInServer()
    : null

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Alerta de afastamento - exibido apenas se o usuário está afastado */}
      <AbsenceAlert
        absenceStartDate={user?.absenceStartDate ?? null}
        absenceEndDate={user?.absenceEndDate ?? null}
      />

      {/* Card de informações */}
      <div className="mt-10 mb-5 grid w-full max-w-6xl grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        {/* nome e email */}
        <div className="bg-muted flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
            <UserRoundIcon size={56} className="text-primary z-10" />
          </div>
          <Text
            variant="title-16-18-500"
            className="text-primary mt-4 text-center break-words"
          >
            {user?.name}
          </Text>
          <Text
            variant="title-18-24-700"
            className="text-primary text-center break-words break-all"
          >
            {user?.email}
          </Text>
        </div>

        {/* Espaços disponíveis */}
        <div className="bg-secondary flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
            <DoorOpenIcon size={56} className="text-primary z-10" />
          </div>
          <Text
            variant="title-16-18-500"
            className="text-primary mt-4 text-center break-words"
          >
            Espaços disponíveis
          </Text>
          <Text
            variant="title-18-24-700"
            className="text-primary text-center break-words"
          >
            {listAvailableSpaces?.totalCount || 0}
          </Text>
        </div>

        {/* Minhas Reservas Realizadas */}
        <div className="bg-secondary flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
            <CalendarCheck2Icon size={56} className="text-primary z-10" />
          </div>
          <Text
            variant="title-16-18-500"
            className="text-primary mt-4 text-center break-words"
          >
            Minhas Reservas Realizadas
          </Text>
          <Text
            variant="title-18-24-700"
            className="text-primary text-center break-words"
          >
            {spaceReservationStats?.total || 0}
          </Text>
        </div>

        {/* Próxima Reserva */}
        <div className="bg-secondary flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
            <CalendarClockIcon size={56} className="text-primary z-10" />
          </div>
          <Text
            variant="title-16-18-500"
            className="text-primary mt-4 text-center break-words"
          >
            Próxima Reserva
          </Text>
          <Text
            variant="title-18-24-700"
            className="text-primary text-center break-words"
          >
            {spaceReservationStats?.nextReservation
              ? spaceReservationStats.nextReservation
              : 'Nenhuma reserva futura'}
          </Text>
        </div>

        {/* Gestão de Equipe - visível para admin, dev e membros que podem gerenciar (exceto assistant) */}
        {(user?.role === 'admin' ||
          user?.role === 'dev' ||
          (user?.teamPosition && user.teamPosition !== 'assistant')) && (
          <Link
            href="/equipe"
            className="bg-primary hover:bg-primary/90 flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl transition-colors"
          >
            <div className="relative flex items-center justify-center">
              <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
              <UsersIcon size={56} className="text-primary-foreground z-10" />
            </div>
            <Text
              variant="title-16-18-500"
              className="text-primary-foreground mt-4 text-center break-words"
            >
              Gestão de Equipe
            </Text>
            <Text
              variant="title-18-24-700"
              className="text-primary-foreground text-center break-words"
            >
              {user?.role === 'admin'
                ? 'Administrador'
                : user?.role === 'dev'
                  ? 'Desenvolvedor'
                  : 'Membro da Equipe'}
            </Text>
          </Link>
        )}

        {/* Compliance Semanal - visível para todos os usuários */}
        <WeeklyComplianceCard data={weeklyCompliance} />

        {/* Checkout Antecipado - visível para supervisores, diretores, admin e dev */}
        {canViewComplianceIndicators && (
          <EarlyCheckoutCard data={earlyCheckoutIndicators} />
        )}

        {/* Cancelamentos Fora do Prazo - visível para supervisores, diretores, admin e dev */}
        {canViewComplianceIndicators && (
          <CancelledReservationsCard data={cancelledReservationsOverview} />
        )}
      </div>
      <Separator className="bg-primary w-full" />

      <SpaceExplorerSection
        initialData={listAvailableSpaces}
        mostUsedTimes={spaceReservationStats?.mostUsedStartTimes || []}
      />
    </div>
  )
}
