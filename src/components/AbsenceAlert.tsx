'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle } from 'lucide-react'

interface AbsenceAlertProps {
  absenceStartDate: string | null
  absenceEndDate: string | null
}

/**
 * Componente de alerta para usuários afastados
 *
 * Exibe um alerta vermelho no topo da página informando que o usuário está afastado
 * e que suas funcionalidades de workstation estão bloqueadas.
 */
export function AbsenceAlert({
  absenceStartDate,
  absenceEndDate,
}: AbsenceAlertProps) {
  // Se não tem datas de afastamento, não exibe nada
  if (!absenceStartDate || !absenceEndDate) {
    return null
  }

  // Verifica se o afastamento está ativo (data atual dentro do período)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = parseISO(absenceStartDate)
  const end = parseISO(absenceEndDate)

  if (today < start || today > end) {
    return null
  }

  // Formata as datas para exibição
  const formattedStart = format(start, "dd 'de' MMMM", { locale: ptBR })
  const formattedEnd = format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <Alert variant="destructive" className="mb-4 w-full max-w-6xl">
      <AlertTriangle className="size-5" />
      <AlertTitle className="text-lg font-bold">
        Você está afastado(a)
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          Seu afastamento está registrado de <strong>{formattedStart}</strong>{' '}
          até <strong>{formattedEnd}</strong>.
        </p>
        <p className="text-sm">
          Durante este período, você{' '}
          <strong>não pode fazer reservas de workstation</strong>. Reservas de
          salas continuam permitidas normalmente. Em caso de dúvidas, procure
          seu supervisor ou responsável.
        </p>
      </AlertDescription>
    </Alert>
  )
}
