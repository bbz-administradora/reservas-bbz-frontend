'use client'

import { Text } from '@/components/Text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { env } from '@/infra/env'
import { EarlyCheckoutOccurrence } from '@/services/occurrenceService'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Clock, Loader2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

// Mapeamento de cargos para labels em português
const positionLabels: Record<string, string> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  assistant_manager: 'Subgerente',
  assistant: 'Assistente',
}

interface JustifyModalProps {
  occurrence: EarlyCheckoutOccurrence | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
 * Formata horas trabalhadas
 */
function formatWorkedHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h${m.toString().padStart(2, '0')}min`
}

export function JustifyModal({
  occurrence,
  isOpen,
  onClose,
  onSuccess,
}: JustifyModalProps) {
  const router = useRouter()
  const [justification, setJustification] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!occurrence) return null

  /**
   * Envia a justificativa ou desconsideração
   */
  async function handleSubmit(action: 'justified' | 'dismissed') {
    if (!occurrence) return

    if (action === 'justified' && !justification.trim()) {
      toast.error('Digite uma justificativa')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/v1/private/occurrences/early-checkout/${occurrence.id}/justify`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            justification:
              action === 'justified' ? justification.trim() : undefined,
          }),
        },
      )

      if (response.ok) {
        toast.success(
          action === 'justified'
            ? 'Ocorrência justificada com sucesso!'
            : 'Ocorrência desconsiderada com sucesso!',
        )
        setJustification('')
        onSuccess()
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Erro ao processar solicitação')
      }
    } catch (error) {
      console.error('Erro ao justificar:', error)
      toast.error('Erro ao processar solicitação')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Fecha modal e limpa estado
   */
  function handleClose() {
    setJustification('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Justificar Ocorrência
          </DialogTitle>
          <DialogDescription>
            Registre uma justificativa para o checkout antecipado ou
            desconsidere a ocorrência.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Dados do Colaborador */}
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <User className="text-primary h-5 w-5" />
              </div>
              <div className="flex-1">
                <Text variant="title-16-18-500" className="text-primary">
                  {transformTextIntoCapitalizedWords(occurrence.userName) ||
                    'Sem nome'}
                </Text>
                <Text
                  variant="label-14-16-400"
                  className="text-muted-foreground"
                >
                  {occurrence.userEmail}
                </Text>
                <Badge variant="secondary" className="mt-2">
                  {positionLabels[occurrence.position || ''] ||
                    occurrence.position ||
                    '-'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dados da Ocorrência */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <Text variant="label-14-16-400" className="text-muted-foreground">
                Check-in
              </Text>
              <Text variant="body-16-18-400" className="text-primary">
                {formatDate(occurrence.checkInAt)}
              </Text>
            </div>
            <div className="rounded-lg border p-3">
              <Text variant="label-14-16-400" className="text-muted-foreground">
                Check-out
              </Text>
              <Text variant="body-16-18-400" className="text-primary">
                {formatDate(occurrence.checkOutAt)}
              </Text>
            </div>
          </div>

          {/* Horas Trabalhadas */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <Clock className="h-5 w-5 text-red-600" />
            <Text variant="title-16-18-500" className="text-red-700">
              Tempo trabalhado: {formatWorkedHours(occurrence.workedHours)}
            </Text>
            <Text variant="label-14-16-400" className="text-red-600">
              (mínimo: 8h45min)
            </Text>
          </div>

          {/* Espaço de Trabalho */}
          <div className="text-center">
            <Text variant="label-14-16-400" className="text-muted-foreground">
              Espaço: {occurrence.spaceName}
            </Text>
          </div>

          {/* Campo de Justificativa */}
          <div className="flex flex-col gap-2">
            <label htmlFor="justification">
              <Text variant="title-16-18-500" className="text-primary">
                Justificativa
              </Text>
            </label>
            <Textarea
              id="justification"
              placeholder="Digite a justificativa para o checkout antecipado..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
            <Text variant="label-14-16-400" className="text-muted-foreground">
              Obrigatório apenas para justificar. Para desconsiderar, deixe em
              branco.
            </Text>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit('dismissed')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Desconsiderar
          </Button>
          <Button
            onClick={() => handleSubmit('justified')}
            disabled={isSubmitting || !justification.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Justificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
