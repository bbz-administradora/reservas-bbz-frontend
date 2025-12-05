/**
 * positionService.ts
 *
 * Serviços relacionados ao recurso "Positions" (Posições da Equipe de Atendimento),
 * utilizando endpoints gerados pelo Orval e garantindo o envio correto
 * de CSRF Token e Cookies de sessão no ambiente servidor.
 */

import type {
  GetOrganogram200,
  GetPosition200,
  ListPositions200,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

type PositionType =
  | 'director'
  | 'supervisor'
  | 'manager'
  | 'assistant_manager'
  | 'assistant'

/**
 * fetchListPositionsInServer
 *
 * Lista todos os membros de uma posição específica no servidor,
 * garantindo envio de CSRF token e cookies de sessão.
 *
 * @param position - Tipo da posição a listar
 * @returns Lista de membros da posição ou null em caso de erro
 */
export async function fetchListPositionsInServer(
  position: PositionType,
): Promise<ListPositions200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/private/team/positions/${position}`

  const response = await customFetch<ListPositions200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: { tags: [`list-positions-${position}`] },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}

/**
 * fetchGetPositionInServer
 *
 * Busca a posição de um usuário específico no servidor.
 *
 * @param userId - ID do usuário
 * @returns Dados da posição do usuário ou null
 */
export async function fetchGetPositionInServer(
  userId: string,
): Promise<GetPosition200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/private/team/positions/user/${userId}`

  const response = await customFetch<GetPosition200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: { tags: [`get-position-${userId}`] },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}

/**
 * fetchOrganogramInServer
 *
 * Busca o organograma completo da equipe no servidor,
 * incluindo a árvore hierárquica e estatísticas.
 *
 * @returns Dados do organograma ou null em caso de erro
 */
export async function fetchOrganogramInServer(): Promise<GetOrganogram200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/private/team/organogram`

  const response = await customFetch<GetOrganogram200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: { tags: ['organogram'] },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}
