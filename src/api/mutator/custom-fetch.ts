import { webserver } from '@/infra/webserver'
import {
  getCookie,
  getServerFormattedCookies,
  updateHeadersWithSetCookie,
} from '@/lib/cookie'

/**
 * `customFetch` to handle API requests with dynamic headers and credentials.
 */
export const customFetch = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<
  T extends Promise<infer U> ? U : { data: T; status: number; headers: Headers }
> => {
  const csrfToken = await getCookie('bbz-server-auth-csrf-token')

  // Clona os headers existentes ou cria um novo objeto
  const startHeaders = new Headers(options.headers || {})

  // Adiciona 'Content-Type' se houver um corpo e não estiver presente
  if (options.body && !startHeaders.has('Content-Type')) {
    if (!(options.body instanceof FormData)) {
      startHeaders.set('Content-Type', 'application/json')
    }
  }

  // Adiciona 'X-CSRF-Token' se o token CSRF estiver disponível
  if (csrfToken) {
    startHeaders.set('X-CSRF-Token', csrfToken)
  }

  const requestInit: RequestInit = {
    ...options,
    headers: startHeaders,
    credentials: 'include', // Mantém 'credentials: include'
  }

  const request = new Request(url, requestInit)
  let response = await fetch(request)

  let status = response.status
  let headers = response.headers
  let contentType = headers.get('content-type')
  let data: any

  if (contentType?.includes('application/json')) {
    data = await response.json()
  } else if (contentType?.includes('application/pdf')) {
    data = await response.blob()
  } else {
    data = await response.text()
  }

  // Middleware para lidar com 401 e tentar o refresh token
  if (status === 401 && data?.message === 'Token inválido ou expirado.') {
    // verify if the CSRF token is present
    const csrfToken = await getCookie('bbz-server-auth-csrf-token')
    if (!csrfToken) {
      console.warn('❌ CSRF token is missing. Aborting refresh token.')

      return { data, status, headers } as unknown as T extends Promise<infer U>
        ? U
        : { data: T; status: number; headers: Headers }
    }

    // Adiciona os cookies formatados apenas no servidor
    const serverCookies = await getServerFormattedCookies()
    const headersServer: Record<string, string> = {
      'X-CSRF-Token': csrfToken,
    }
    if (serverCookies) {
      headersServer['Cookie'] = serverCookies
    }

    const refreshResponse = await fetch(
      `${webserver.hostApi}/v1/private/auth/refresh/user/session`,
      {
        method: 'PATCH',
        headers: headersServer,
        credentials: 'include',
      },
    )

    if (refreshResponse.status === 201) {
      // 📌 Reexecuta a requisição original após o refresh

      const isServer = typeof window === 'undefined'

      if (isServer) {
        // Reexecuta a requisição original após o refresh, somente no servidor
        const updatedHeaders = await updateHeadersWithSetCookie(
          refreshResponse,
          request.headers,
        )

        const updatedRequest = new Request(request.url, {
          ...request,
          headers: updatedHeaders,
        })

        response = await fetch(updatedRequest)
      } else {
        // Reexecuta a requisição original após o refresh, somente no cliente
        const csrfToken = await getCookie('bbz-server-auth-csrf-token')

        // Clona os headers existentes ou cria um novo objeto
        const startHeaders = new Headers(options.headers || {})

        // Adiciona 'Content-Type' se houver um corpo e não estiver presente
        if (options.body && !startHeaders.has('Content-Type')) {
          if (!(options.body instanceof FormData)) {
            startHeaders.set('Content-Type', 'application/json')
          }
        }

        // Adiciona 'X-CSRF-Token' se o token CSRF estiver disponível
        if (csrfToken) {
          startHeaders.set('X-CSRF-Token', csrfToken)
        }

        const requestInit: RequestInit = {
          ...options,
          headers: startHeaders,
          credentials: 'include', // Mantém 'credentials: include'
        }

        const request = new Request(url, requestInit)
        response = await fetch(request)
      }

      status = response.status
      headers = response.headers

      contentType = headers.get('content-type')

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else if (contentType?.includes('application/pdf')) {
        data = await response.blob()
      } else {
        data = await response.text()
      }
    } else {
      console.error('Failed to refresh token. Logging out...')
    }
  }

  return { data, status, headers } as unknown as T extends Promise<infer U>
    ? U
    : { data: T; status: number; headers: Headers }
}
