/**
 * teamService.ts
 *
 * Serviços relacionados ao recurso "Team" (Equipe de Atendimento),
 * utilizando endpoints gerados pelo Orval e garantindo o envio correto
 * de CSRF Token e Cookies de sessão no ambiente servidor.
 */

import type { ListManagers200 } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

/**
 * fetchListManagersInServer
 *
 * Lista todos os gerentes da equipe de atendimento no servidor,
 * garantindo envio de CSRF token e cookies de sessão.
 *
 * Fluxo:
 * 1) Chama getHeadersServer() para obter cabeçalhos de autenticação.
 * 2) Se getHeadersServer() retornar null, encerra retornando null.
 * 3) Executa listManagers() com RequestInit personalizado:
 *    - method: 'GET'
 *    - credentials: 'include'
 *    - cache: 'no-store'
 *    - headers: resultado de getHeadersServer()
 *    - next.tags: ['list-managers'] (invalidação de cache)
 * 4) Se status === 200, retorna ListManagers200 (lista de gerentes).
 *    Caso contrário, registra erro e retorna null.
 *
 * @returns {Promise<ListManagers200 | null>} Objeto com dados da listagem ou null
 *
 * @example
 * ```ts
 * import { fetchListManagersInServer } from '@/services/teamService'
 *
 * async function handleManagers() {
 *   const managersList = await fetchListManagersInServer()
 *   if (managersList) {
 *     console.log('Total de gerentes:', managersList.total)
 *     console.table(managersList.managers)
 *   } else {
 *     console.log('Falha ao buscar lista de gerentes')
 *   }
 * }
 * ```
 */
export async function fetchListManagersInServer(): Promise<ListManagers200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/private/team/managers`

  const response = await customFetch<ListManagers200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: { tags: ['list-managers'] },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}
