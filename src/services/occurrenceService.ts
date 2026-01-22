import { customFetch } from '@/api/mutator/custom-fetch'
import { env } from '@/infra/env'
import { getHeadersServer } from '@/lib/cookie'

// ========================================
// 📌 TIPOS
// ========================================

export interface EarlyCheckoutOccurrence {
  id: string
  userId: string
  userName: string | null
  userEmail: string
  userAvatar: string | null
  position:
    | 'director'
    | 'supervisor'
    | 'manager'
    | 'assistant_manager'
    | 'assistant'
    | null
  supervisorId: string | null
  supervisorName: string | null
  supervisorEmail: string | null
  checkInAt: string
  checkOutAt: string
  workedHours: number
  status: 'pending' | 'justified' | 'dismissed'
  justification: string | null
  justifiedByName: string | null
  justifiedAt: string | null
  spaceId: string
  spaceName: string
  reservationId: string
}

export interface EarlyCheckoutIndicators {
  total: number
  pending: number
  justified: number
  dismissed: number
}

export interface EarlyCheckoutListResponse {
  period: {
    start: string | null
    end: string
  }
  indicators: EarlyCheckoutIndicators
  occurrences: EarlyCheckoutOccurrence[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  message: string
}

export interface EarlyCheckoutListParams {
  page?: string
  pageSize?: string
  status?: 'pending' | 'justified' | 'dismissed' | 'all'
  supervisorName?: string
  userName?: string
  userEmail?: string
  position?: 'manager' | 'assistant_manager' | 'assistant'
}

export interface EarlyCheckoutJustifyResponse {
  message: string
  occurrence: {
    id: string
    status: 'justified' | 'dismissed'
    justification: string | null
    justifiedBy: string
    justifiedAt: string
  }
}

// ========================================
// 📌 FUNÇÕES DE FETCH (SERVER-SIDE)
// ========================================

/**
 * Busca a lista de ocorrências de checkout antecipado (server-side)
 */
export async function fetchEarlyCheckoutOccurrencesInServer(
  params?: EarlyCheckoutListParams,
): Promise<EarlyCheckoutListResponse | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  function getEarlyCheckoutListUrl(params?: EarlyCheckoutListParams): string {
    const normalizedParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        normalizedParams.append(key, value.toString())
      }
    })
    const baseUrl = `${env.NEXT_PUBLIC_API_URL}/v1/private/occurrences/early-checkout`
    return normalizedParams.size
      ? `${baseUrl}?${normalizedParams.toString()}`
      : baseUrl
  }

  const url = getEarlyCheckoutListUrl(params)

  const response = await customFetch<EarlyCheckoutListResponse>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: ['early-checkout-occurrences', 'justify-early-checkout'],
    },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}

/**
 * Busca apenas os indicadores de checkout antecipado para o card (server-side)
 * Usa pageSize=1 para minimizar dados transferidos, pois só precisamos dos indicadores
 */
export async function fetchEarlyCheckoutIndicatorsInServer(): Promise<{
  indicators: EarlyCheckoutIndicators
  period: { start: string | null; end: string }
} | null> {
  const response = await fetchEarlyCheckoutOccurrencesInServer({
    page: '1',
    pageSize: '1',
    status: 'all',
  })

  if (!response) {
    return null
  }

  return {
    indicators: response.indicators,
    period: response.period,
  }
}

/**
 * Justifica ou descarta uma ocorrência de checkout antecipado (client-side)
 */
export async function justifyEarlyCheckoutInClient(
  occurrenceId: string,
  data: {
    action: 'justified' | 'dismissed'
    justification?: string
  },
  headers: HeadersInit,
): Promise<{
  success: boolean
  data?: EarlyCheckoutJustifyResponse
  error?: string
}> {
  const url = `${env.NEXT_PUBLIC_API_URL}/v1/private/occurrences/early-checkout/${occurrenceId}/justify`

  try {
    const response = await customFetch<EarlyCheckoutJustifyResponse>(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (response.status === 200) {
      return { success: true, data: response.data }
    }

    return { success: false, error: 'Erro ao processar justificativa' }
  } catch (error) {
    console.error('Erro ao justificar ocorrência:', error)
    return { success: false, error: 'Erro de conexão' }
  }
}
