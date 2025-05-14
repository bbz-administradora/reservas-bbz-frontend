/**
 * userService.ts
 *
 * Serviços relacionados ao recurso "User", utilizando endpoints gerados pelo Orval
 * e garantindo o envio correto de CSRF Token e Cookies de sessão no ambiente servidor.
 */

import type {
  ListUsers201,
  ListUsersParams,
  UserMe201User,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { webserver } from '@/infra/webserver'
import { getHeadersServer } from '@/lib/cookie'

/**
 * CurrentUser
 *
 * Interface de retorno para dados do usuário autenticado.
 * @property user            Dados do usuário (UserMe201User) ou null
 * @property isAuthenticated Indica se o usuário está autenticado
 */
export interface CurrentUser {
  user: UserMe201User | null
  isAuthenticated: boolean
}

/**
 * fetchCurrentUserInServer
 *
 * Obtém os dados do usuário atualmente autenticado no servidor.
 * Garante que o CSRF token e cookies de sessão sejam enviados de forma
 * apropriada para o endpoint gerado pelo Orval.
 *
 * Fluxo:
 * 1) Chama getHeadersServer() para montar cabeçalhos com CSRF e Cookie.
 * 2) Se getHeadersServer() retornar null, encerra com isAuthenticated=false.
 * 3) Executa userMe() com RequestInit personalizado:
 *    - method: 'GET'
 *    - credentials: 'include'
 *    - cache: 'force-cache'
 *    - headers: resultado de getHeadersServer()
 *    - next.tags: ['auth'] (invalidação de cache)
 * 4) Se status === 201, retorna usuário e isAuthenticated=true.
 *    Caso contrário, retorna isAuthenticated=false.
 *
 * @returns {Promise<CurrentUser>} Dados do usuário e estado de autenticação.
 *
 * @example
 * ```ts
 * import { fetchCurrentUserInServer } from '@/services/userService'
 *
 * async function handleRequest() {
 *   const { user, isAuthenticated } = await fetchCurrentUserInServer()
 *   if (isAuthenticated && user) {
 *     console.log('Usuário autenticado:', user.name)
 *   } else {
 *     console.log('Usuário não autenticado')
 *   }
 * }
 * ```
 */
export async function fetchCurrentUserInServer(): Promise<CurrentUser> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return { user: null, isAuthenticated: false }
  }

  const response = await customFetch<{ user: UserMe201User }>(
    `${webserver.hostApi}/v1/private/user/me`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'force-cache',
      headers,
      next: { tags: ['auth'] },
    },
  )

  if (response.status === 201) {
    return { user: response.data.user as UserMe201User, isAuthenticated: true }
  }

  return { user: null, isAuthenticated: false }
}

/**
 * fetchListUsersInServer
 *
 * Lista todos os usuários no servidor, aplicando parâmetros de consulta
 * e garantindo envio de CSRF token e cookies de sessão.
 *
 * Fluxo:
 * 1) Chama getHeadersServer() para obter cabeçalhos de autenticação.
 * 2) Se getHeadersServer() retornar null, encerra retornando null.
 * 3) Executa listUsers(params) com RequestInit personalizado:
 *    - method: 'GET'
 *    - credentials: 'include'
 *    - cache: 'force-cache'
 *    - headers: resultado de getHeadersServer()
 *    - next.tags: ['users'] (invalidação de cache)
 * 4) Se status === 200, retorna ListUsers201 (lista de usuários).
 *    Caso contrário, registra erro e retorna null.
 *
 * @param {ListUsersParams} [params] Parâmetros de filtragem/paginação da listagem.
 * @returns {Promise<ListUsers201 | null>} Objeto com dados da listagem ou null
 *
 * @example
 * ```ts
 * import { fetchListUsersInServer } from '@/services/userService'
 *
 * async function handleUsers() {
 *   const usersList = await fetchListUsersInServer({ page: 1, pageSize: 20 })
 *   if (usersList) {
 *     console.log('Total de usuários:', usersList.total)
 *     console.table(usersList.data)
 *   } else {
 *     console.log('Falha ao buscar lista de usuários')
 *   }
 * }
 * ```
 */
export async function fetchListUsersInServer(
  params?: ListUsersParams,
): Promise<ListUsers201 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getListUsersUrl = (params?: ListUsersParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        normalizedParams.append(key, value === null ? 'null' : value.toString())
      }
    })

    return normalizedParams.size
      ? `${process.env.NEXT_PUBLIC_API_URL}/v1/private/user?${normalizedParams.toString()}`
      : `${process.env.NEXT_PUBLIC_API_URL}/v1/private/user`
  }

  const url = getListUsersUrl(params)

  const response = await customFetch<ListUsers201>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'force-cache',
    headers,
    next: { tags: ['delete-user, update-user, create-user'] },
  })

  if (response.status === 201) {
    return response.data
  }

  console.error('Failed to list users. Status:', response.status)
  return null
}
