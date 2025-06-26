import {
  GetSpace200,
  ListSpaces200,
  ListSpacesParams,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

/**
 * fetchListSpacesInServer
 *
 * Lista todos os espaços no servidor, aplicando parâmetros de consulta
 * e garantindo envio de CSRF token e cookies de sessão.
 *
 * Fluxo:
 * 1) Chama getHeadersServer() para obter cabeçalhos de autenticação.
 * 2) Se getHeadersServer() retornar null, encerra retornando null.
 * 3) Monta a URL de listagem de espaços com parâmetros de consulta:
 *    - Converte params em URLSearchParams.
 *    - Adiciona pares chave-valor somente para parâmetros definidos.
 *    - Converte valores null em string 'null'.
 *    - Anexa a query string à URL base.
 * 4) Executa customFetch<ListSpaces200> com RequestInit:
 *    - method: 'GET'
 *    - credentials: 'include'
 *    - cache: 'force-cache'
 *    - headers: resultado de getHeadersServer()
 *    - next.tags: ['delete-space', 'update-space', 'create-space']
 * 5) Se status === 201, retorna ListSpaces200 (lista de espaços).
 *    Caso contrário, registra erro e retorna null.
 *
 * @param {ListSpacesParams} [params] Parâmetros de filtragem e paginação.
 * @returns {Promise<ListSpaces200 | null>} Objeto com dados da listagem ou null.
 *
 * @example
 * ```ts
 * import { fetchListSpacesInServer } from '@/services/spaceService'
 *
 * async function handleSpaces() {
 *   const spacesList = await fetchListSpacesInServer({ page: 1, pageSize: 10 })
 *   if (spacesList) {
 *     console.log('Total de espaços:', spacesList.total)
 *     console.table(spacesList.data)
 *   } else {
 *     console.log('Falha ao buscar lista de espaços')
 *   }
 * }
 * ```
 */
export async function fetchListSpacesInServer(
  params?: ListSpacesParams,
): Promise<ListSpaces200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getListSpacesUrl = (params?: ListSpacesParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        normalizedParams.append(key, value === null ? 'null' : value.toString())
      }
    })

    return normalizedParams.size
      ? `${process.env.NEXT_PUBLIC_API_URL}/v1/private/space?${normalizedParams.toString()}`
      : `${process.env.NEXT_PUBLIC_API_URL}/v1/private/space`
  }

  const url = getListSpacesUrl(params)

  const response = await customFetch<ListSpaces200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: [
        'delete-space',
        'update-space',
        'create-space',
        'update-space-image',
        'update-space-qr-code',
      ],
    },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}

/**
 * fetchSpaceInServer
 *
 * Busca os detalhes de um espaço específico no servidor,
 * garantindo envio de CSRF token e cookies de sessão.
 *
 * Fluxo:
 * 1) Chama getHeadersServer() para obter cabeçalhos de autenticação.
 * 2) Se getHeadersServer() retornar null, encerra retornando null.
 * 3) Monta a URL para buscar o espaço específico pelo ID.
 * 4) Executa customFetch<GetSpace200> com RequestInit:
 *    - method: 'GET'
 *    - credentials: 'include'
 *    - cache: 'no-store'
 *    - headers: resultado de getHeadersServer()
 *    - next.tags: ['delete-space', 'update-space', 'create-space', 'update-space-image', 'update-space-qr-code']
 * 5) Se status === 200, retorna GetSpace200.space (detalhes do espaço).
 *    Caso contrário, registra erro e retorna null.
 *
 * @param {string} id ID do espaço a ser buscado.
 * @returns {Promise<GetSpace200Space | null>} Objeto com dados do espaço ou null.
 *
 * @example
 * ```ts
 * import { fetchSpaceInServer } from '@/services/spaceService'
 *
 * async function handleSpaceDetails(spaceId: string) {
 *   const space = await fetchSpaceInServer(spaceId)
 *   if (space) {
 *     console.log('Detalhes do espaço:', space.name)
 *   } else {
 *     console.log('Falha ao buscar detalhes do espaço')
 *   }
 * }
 * ```
 */
export async function fetchSpaceInServer(
  id: string,
): Promise<GetSpace200['space'] | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getGetSpaceUrl = (id: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/v1/private/space/${id}`
  }

  const url = getGetSpaceUrl(id)

  const response = await customFetch<GetSpace200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: [
        'delete-space',
        'update-space',
        'create-space',
        'update-space-image',
        'update-space-qr-code',
      ],
    },
  })

  if (response.status === 200) {
    return response.data.space
  }

  return null
}
