import { UserMe201User } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { userMeResponse } from '@/api/endpoints/user/user'
import { customFetch } from '@/api/mutator/custom-fetch'
import { webserver } from '@/infra/webserver'
import { getCookie, getServerFormattedCookies } from '@/lib/cookie'

/**
 * Autentica o usuário no servidor, retornando os dados do usuário e o estado de autenticação.
 *
 * @returns Um objeto contendo:
 *  - `user`: O objeto do usuário autenticado ou `null` se não autenticado.
 *  - `isAuthenticated`: Um boolean indicando se o usuário está autenticado.
 */
export async function authenticateUserServer(): Promise<{
  user: UserMe201User | null
  isAuthenticated: boolean
}> {
  try {
    // Obter o cookie CSRF
    const csrfToken = await getCookie('bbz-server-auth-csrf-token')
    if (!csrfToken) {
      console.warn('CSRF token not found')
      return { user: null, isAuthenticated: false }
    }

    // Obter os cookies do servidor
    const serverCookies = await getServerFormattedCookies()
    const headersServer: Record<string, string> = {
      'X-CSRF-Token': csrfToken,
    }

    // Adicionar os cookies formatados apenas no servidor
    if (serverCookies) {
      headersServer['Cookie'] = serverCookies
    }

    // Obter os dados do usuário logado
    const response = await customFetch<Promise<userMeResponse>>(
      `${webserver.hostApi}/v1/private/user/me`,
      {
        headers: headersServer,
        credentials: 'include',
        method: 'GET',
        cache: 'force-cache',
        next: {
          tags: ['auth'],
        },
      },
    )

    // Verificar o status da resposta
    if (response.status === 201) {
      return {
        user: response.data.user as UserMe201User,
        isAuthenticated: true,
      }
    }
  } catch (error) {
    console.warn('Error fetching user data:', error)
  }

  return { user: null, isAuthenticated: false }
}
