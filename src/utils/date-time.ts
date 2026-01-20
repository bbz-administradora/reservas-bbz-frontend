import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  formatDistanceToNow,
  isValid,
  parse,
  parseISO,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Obtém o último dia (sábado) da próxima semana
 *
 * Esta função é usada para calcular o limite máximo de reserva de workstations.
 * Workstations só podem ser reservadas até o sábado da próxima semana.
 * Considera que a semana começa no domingo e termina no sábado.
 *
 * Exemplos:
 * - Se hoje é segunda-feira (20/01/2026), retorna sábado (31/01/2026)
 * - Se hoje é quinta-feira (23/01/2026), retorna sábado (31/01/2026)
 * - Se hoje é sábado (25/01/2026), retorna sábado (31/01/2026)
 * - Se hoje é domingo (26/01/2026), retorna sábado (07/02/2026)
 *
 * @param referenceDate - Data de referência (padrão: agora)
 * @returns Data do último dia (sábado) da próxima semana, às 23:59:59.999
 */
export function getNextWeekLastDay(referenceDate: Date = new Date()): Date {
  // Obtém o sábado da semana atual (considerando domingo como início da semana)
  const currentWeekEnd = endOfWeek(referenceDate, { weekStartsOn: 0 })

  // Como endOfWeek com weekStartsOn: 0 retorna o sábado, precisamos obter o sábado da próxima semana
  const nextWeekEnd = addWeeks(currentWeekEnd, 1)

  return nextWeekEnd
}

/**
 * Formata uma string de data para exibição no formato DD/MM/YYYY HH:MM
 *
 * @param dateString String de data a ser formatada
 * @returns String formatada ou a string original se não for possível formatar
 */
export function formatExpirationDate(dateString?: string): string {
  if (!dateString) return ''

  try {
    // Tenta processar a string para uma data
    let date: Date

    // Verificar formato da data
    if (dateString.includes('T')) {
      date = parseISO(dateString)
    } else if (dateString.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)) {
      date = parse(dateString, 'dd/MM/yyyy HH:mm', new Date())
    } else {
      date = new Date(dateString)
    }

    // Verifica se a data é válida
    if (!isValid(date)) {
      return dateString // Retorna a string original se não conseguir formatar
    }

    // Formata a data para exibição
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch (error) {
    return dateString // Retorna a string original em caso de erro
  }
}

/**
 * Calcula e retorna uma mensagem amigável sobre o tempo restante até a expiração
 *
 * @param dateString String de data de expiração
 * @returns Mensagem formatada sobre o tempo até a expiração
 */
export function getExpirationMessage(dateString?: string): string {
  if (!dateString) return ''

  try {
    // Tenta processar a string para uma data
    let expiresDate: Date

    // Verificar formato da data
    if (dateString.includes('T')) {
      // Formato ISO
      expiresDate = parseISO(dateString)
    } else if (dateString.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)) {
      // Formato DD/MM/YYYY HH:MM
      expiresDate = parse(dateString, 'dd/MM/yyyy HH:mm', new Date())
    } else {
      // Tenta analisar como qualquer outro formato de data
      expiresDate = new Date(dateString)
    }

    // Verifica se a data é válida
    if (!isValid(expiresDate)) {
      return 'Este código expirará automaticamente'
    }

    const now = new Date()

    // Verifica se já expirou
    if (expiresDate < now) {
      return 'Este código já expirou'
    }

    // Calcula e formata a distância de tempo até a expiração
    return `Este código expirará ${formatDistanceToNow(expiresDate, {
      addSuffix: true,
      locale: ptBR,
    })}`
  } catch (error) {
    // Em caso de erro no parsing da data
    return 'Este código expirará automaticamente'
  }
}

/**
 * Calcula o intervalo do dia brasileiro (timezone BRT/BRST)
 * Retorna startDate e endDate no formato ISO para uso em APIs
 *
 * O dia brasileiro vai de 00:00 BRT até 23:59:59 BRT
 * Em UTC isso significa: 03:00 UTC até 02:59:59 UTC do dia seguinte
 *
 * @returns Objeto com startDate e endDate em formato ISO
 */
export function getBrazilianDayRange(): {
  startDate: string
  endDate: string
} {
  const now = new Date()

  // Início do dia brasileiro: hoje às 03:00 UTC (00:00 BRT)
  const startOfBrazilianDay = startOfDay(now)
  startOfBrazilianDay.setUTCHours(3, 0, 0, 0)

  // Fim do dia brasileiro: amanhã às 02:59:59.999 UTC (23:59:59 BRT)
  const endOfBrazilianDay = addDays(startOfBrazilianDay, 1)
  endOfBrazilianDay.setUTCHours(2, 59, 59, 999)

  return {
    startDate: startOfBrazilianDay.toISOString(),
    endDate: endOfBrazilianDay.toISOString(),
  }
}
