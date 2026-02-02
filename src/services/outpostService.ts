/**
 * outpostService.ts
 *
 * Serviços relacionados ao recurso "Outpost" (Posto Avançado), utilizando customFetch
 * e garantindo o envio correto de CSRF Token e Cookies de sessão no ambiente servidor.
 */

import type {
  ListOutposts200,
  ListOutpostsParams,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { webserver } from '@/infra/webserver'
import { getHeadersServer } from '@/lib/cookie'

/**
 * fetchOutpostsInServer
 *
 * Obtém a lista de postos avançados com paginação e filtros.
 *
 * Fluxo:
 * 1) Chama getHeadersServer() para montar cabeçalhos com CSRF e Cookie.
 * 2) Se getHeadersServer() retornar null, encerra retornando null.
 * 3) Executa fetch para /v1/private/outposts com os parâmetros fornecidos.
 * 4) Se status === 200, retorna ListOutposts200.
 *    Caso contrário, retorna null.
 *
 * @param params - Parâmetros de filtro (status, search, page, limit)
 * @returns {Promise<ListOutposts200 | null>} Dados dos postos ou null
 *
 * @example
 * ```ts
 * import { fetchOutpostsInServer } from '@/services/outpostService'
 *
 * async function handleOutposts() {
 *   const outpostsData = await fetchOutpostsInServer({ status: 'active' })
 *   if (outpostsData) {
 *     console.log('Total de postos:', outpostsData.totalCount)
 *     console.table(outpostsData.outposts)
 *   } else {
 *     console.log('Falha ao buscar postos avançados')
 *   }
 * }
 * ```
 */
export async function fetchOutpostsInServer(
  params?: ListOutpostsParams,
): Promise<ListOutposts200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  // Monta a URL com query params
  const searchParams = new URLSearchParams()
  if (params?.status) {
    searchParams.append('status', params.status)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.page) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const url = `${webserver.hostApi}/v1/private/outposts${queryString ? `?${queryString}` : ''}`

  const response = await customFetch<ListOutposts200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: { tags: ['outposts'] },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}
