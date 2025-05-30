import { format, formatDistanceToNow, isValid, parse, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
