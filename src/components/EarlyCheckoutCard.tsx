import { EarlyCheckoutIndicators } from '@/services/occurrenceService'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { CardDecoration } from './svg/card-decoration'
import { Text } from './Text'
import { Button } from './ui/button'

interface EarlyCheckoutCardProps {
  data: {
    indicators: EarlyCheckoutIndicators
    period: { start: string | null; end: string }
  } | null
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

export function EarlyCheckoutCard({ data }: EarlyCheckoutCardProps) {
  // Se não tem dados (usuário sem permissão para ver ocorrências)
  if (!data) {
    return null
  }

  const { indicators, period } = data
  const hasPending = indicators.pending > 0

  // Formata o período para exibição
  const periodText = period.start
    ? `${formatDateShort(period.start)} a ${formatDateShort(period.end)}`
    : 'Sem pendências'

  return (
    <div
      className={
        hasPending
          ? 'flex flex-col items-center gap-2.5 rounded-lg bg-yellow-50 p-5 shadow-xl'
          : 'flex flex-col items-center gap-2.5 rounded-lg bg-green-50 p-5 shadow-xl'
      }
    >
      <div className="relative flex items-center justify-center">
        <CardDecoration
          className={
            hasPending
              ? 'absolute bottom-[-15px] left-[-15px] text-yellow-500'
              : 'absolute bottom-[-15px] left-[-15px] text-green-500'
          }
        />
        {hasPending ? (
          <AlertTriangle size={56} className="text-primary z-10" />
        ) : (
          <CheckCircle2 size={56} className="text-primary z-10" />
        )}
      </div>
      <Text
        variant="title-16-18-500"
        className="text-primary mt-4 text-center break-words"
      >
        Checkout Antecipado
      </Text>
      <Text
        variant="title-18-24-700"
        className="text-primary text-center break-words"
      >
        {hasPending
          ? `${indicators.pending} ${indicators.pending === 1 ? 'pendência' : 'pendências'}`
          : 'Tudo em dia!'}
      </Text>
      <Text
        variant="label-14-16-400"
        className="text-muted-foreground text-center text-xs"
      >
        {periodText}
      </Text>
      <Button variant="outline" size="sm" className="mt-2" asChild>
        <Link href="/espacos/compliance/ocorrencias">
          {hasPending ? 'Ver ocorrências' : 'Ver detalhes'}
        </Link>
      </Button>
    </div>
  )
}
