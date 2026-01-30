import { CancelledReservationsOverviewResponse } from '@/services/reservationService'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { CardDecoration } from './svg/card-decoration'
import { Text } from './Text'
import { Button } from './ui/button'

interface CancelledReservationsCardProps {
  data: CancelledReservationsOverviewResponse | null
}

/**
 * Formata a data para exibição no formato "dd/MM/yyyy"
 */
function formatDateShort(dateString: string | null): string {
  if (!dateString) return '-'
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '-'
  }
}

/**
 * Card de Cancelamentos de Reservas após o Prazo de Planejamento.
 *
 * Exibe a quantidade de reservas de workstation que foram encerradas
 * após a quinta-feira (prazo de planejamento).
 *
 * Visível para: supervisores, diretores, admin e dev.
 */
export function CancelledReservationsCard({
  data,
}: CancelledReservationsCardProps) {
  // Se não tem dados (usuário sem permissão)
  if (!data) {
    return null
  }

  const { totalCancellations, periodStart, periodEnd } = data
  const hasCancellations = totalCancellations > 0

  // Formata o período para exibição
  const periodText = periodStart
    ? `${formatDateShort(periodStart)} a ${formatDateShort(periodEnd)}`
    : 'Sem ocorrências'

  return (
    <div
      className={
        hasCancellations
          ? 'flex flex-col items-center gap-2.5 rounded-lg bg-orange-50 p-5 shadow-xl'
          : 'flex flex-col items-center gap-2.5 rounded-lg bg-green-50 p-5 shadow-xl'
      }
    >
      <div className="relative flex items-center justify-center">
        <CardDecoration
          className={
            hasCancellations
              ? 'absolute bottom-[-15px] left-[-15px] text-orange-500'
              : 'absolute bottom-[-15px] left-[-15px] text-green-500'
          }
        />
        {hasCancellations ? (
          <AlertTriangle size={56} className="text-primary z-10" />
        ) : (
          <CheckCircle2 size={56} className="text-primary z-10" />
        )}
      </div>
      <Text
        variant="title-16-18-500"
        className="text-primary mt-4 text-center break-words"
      >
        Cancelamentos Fora do Prazo
      </Text>
      <Text
        variant="title-18-24-700"
        className="text-primary text-center break-words"
      >
        {hasCancellations
          ? `${totalCancellations} ${totalCancellations === 1 ? 'ocorrência' : 'ocorrências'}`
          : 'Tudo em dia!'}
      </Text>
      <Text
        variant="label-14-16-400"
        className="text-muted-foreground text-center text-xs"
      >
        {periodText}
      </Text>
      <Button variant="outline" size="sm" className="mt-2" asChild>
        <Link href="/espacos/compliance/cancelamentos">Ver detalhes</Link>
      </Button>
    </div>
  )
}
