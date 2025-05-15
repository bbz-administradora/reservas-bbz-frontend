import {
  ListRooms200,
  ListRoomsParams,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

/**
 * fetchListRoomsInServer
 *
 * Lista todas as salas no servidor, aplicando parâmetros de consulta
 * e garantindo envio de CSRF token e cookies de sessão.
 *
 * Fluxo:
 * 1) Chama getHeadersServer() para obter cabeçalhos de autenticação.
 * 2) Se getHeadersServer() retornar null, encerra retornando null.
 * 3) Monta a URL de listagem de salas com parâmetros de consulta:
 *    - Converte params em URLSearchParams.
 *    - Adiciona pares chave-valor somente para parâmetros definidos.
 *    - Converte valores null em string 'null'.
 *    - Anexa a query string à URL base.
 * 4) Executa customFetch<ListRooms200> com RequestInit:
 *    - method: 'GET'
 *    - credentials: 'include'
 *    - cache: 'force-cache'
 *    - headers: resultado de getHeadersServer()
 *    - next.tags: ['delete-room', 'update-room', 'create-room']
 * 5) Se status === 201, retorna ListRooms200 (lista de salas).
 *    Caso contrário, registra erro e retorna null.
 *
 * @param {ListRoomsParams} [params] Parâmetros de filtragem e paginação.
 * @returns {Promise<ListRooms200 | null>} Objeto com dados da listagem ou null.
 *
 * @example
 * ```ts
 * import { fetchListRoomsInServer } from '@/services/roomService'
 *
 * async function handleRooms() {
 *   const roomsList = await fetchListRoomsInServer({ page: 1, pageSize: 10 })
 *   if (roomsList) {
 *     console.log('Total de salas:', roomsList.total)
 *     console.table(roomsList.data)
 *   } else {
 *     console.log('Falha ao buscar lista de salas')
 *   }
 * }
 * ```
 */
export async function fetchListRoomsInServer(
  params?: ListRoomsParams,
): Promise<ListRooms200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getListRoomsUrl = (params?: ListRoomsParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        normalizedParams.append(key, value === null ? 'null' : value.toString())
      }
    })

    return normalizedParams.size
      ? `${process.env.NEXT_PUBLIC_API_URL}/v1/private/room?${normalizedParams.toString()}`
      : `${process.env.NEXT_PUBLIC_API_URL}/v1/private/room`
  }

  const url = getListRoomsUrl(params)

  const response = await customFetch<ListRooms200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'force-cache',
    headers,
    next: { tags: ['delete-room', 'update-room', 'create-room'] },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}
