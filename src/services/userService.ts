import type { UserMe201User } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { userMe } from '@/api/endpoints/user/user'
import { getCookie, getServerFormattedCookies } from '@/lib/cookie'

export interface CurrentUser {
  user: UserMe201User | null
  isAuthenticated: boolean
}

/**
 * fetchCurrentUserInServer
 *
 * Função para buscar os dados do usuário atualmente autenticado no lado do servidor,
 * garantindo que o CSRF token e os cookies de sessão sejam enviados corretamente.
 *
 * Fluxo:
 * 1) Obtém o CSRF token a partir do cookie 'bbz-server-auth-csrf-token'.
 * 2) Se não existir, retorna { user: null, isAuthenticated: false }.
 * 3) Formata os cookies do servidor (se houver) via getServerFormattedCookies().
 * 4) Monta o objeto de headers com 'X-CSRF-Token' e 'Cookie'.
 * 5) Chama o endpoint /v1/private/user/me gerado pelo Orval (userMe), usando:
 *    - method: 'GET'
 *    - credentials: 'include'
 *    - cache: 'force-cache'
 *    - headers personalizados
 *    - next.tags: ['auth'] para invalidação de cache
 * 6) Se a resposta vier com status 201, retorna o usuário e isAuthenticated=true.
 *    Caso contrário, retorna isAuthenticated=false.
 *
 * @returns {Promise<CurrentUser>} Um objeto com:
 *  - user: dados do usuário (UserMe201User) ou null
 *  - isAuthenticated: boolean indicando se está autenticado
 *
 * @example
 * import { fetchCurrentUserInServer } from '@/services/userService'
 *
 * async function handleRequest() {
 *   const { user, isAuthenticated } = await fetchCurrentUserInServer()
 *   if (isAuthenticated && user) {
 *     console.log("Usuário autenticado:", user)
 *   } else {
 *     console.log("Usuário não autenticado")
 *   }
 * }
 */
export async function fetchCurrentUserInServer(): Promise<CurrentUser> {
  // 1) CSRF
  const csrfToken = await getCookie('bbz-server-auth-csrf-token')
  if (!csrfToken) {
    console.warn('CSRF token not found')
    return { user: null, isAuthenticated: false }
  }

  // 2) Cookies do servidor (só em server-side)
  const serverCookies = await getServerFormattedCookies()

  // 3) Monta headers
  const headers: Record<string, string> = {
    'X-CSRF-Token': csrfToken,
    ...(serverCookies ? { Cookie: serverCookies } : {}),
  }

  // 4) Chama o Orval userMe passando todos os options
  const response = await userMe({
    method: 'GET',
    credentials: 'include',
    cache: 'force-cache',
    headers,
    next: {
      tags: ['auth'],
    },
  })

  // 5) Interpreta o resultado
  if (response.status === 201) {
    return { user: response.data.user as UserMe201User, isAuthenticated: true }
  }
  return { user: null, isAuthenticated: false }
}
