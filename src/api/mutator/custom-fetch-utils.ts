import { COOKIE_PREFIX } from '@/config'
import { webserver } from '@/infra/webserver'
import { getCookie, getServerFormattedCookies } from '@/lib/cookie'
import { CustomError } from '@/lib/error'
import { redirect } from 'next/navigation'

// ==================== Constants ====================
export const CONTENT_TYPE_JSON = 'application/json'
export const CONTENT_TYPE_PDF = 'application/pdf'
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
export const HTTP_METHOD_GET = 'GET'
export const HTTP_STATUS_UNAUTHORIZED = 401
export const HTTP_STATUS_FORBIDDEN = 403
export const HTTP_STATUS_OK = 200
export const HTTP_STATUS_BAD_REQUEST = 400
export const TOKEN_EXPIRED_MESSAGE = 'Token inválido ou expirado.'
export const CSRF_TOKEN_MISSING_MESSAGE =
  'CSRF token ausente no cabeçalho da requisição.'
export const LOGIN_REDIRECT_URL = '/login'
export const REFRESH_TOKEN_ENDPOINT = '/v1/private/auth/refresh-session'

// ==================== Types ====================
export interface FetchResponse<T = any> {
  data: T
  status: number
  headers: Headers
}

export interface ParsedResponse {
  data: any
  status: number
  headers: Headers
  contentType: string | null
}

// ==================== Helper Functions ====================

/**
 * Determina se a execução está no servidor (SSR) ou no cliente
 */
export function isServerSide(): boolean {
  return typeof window === 'undefined'
}

/**
 * Prepara os headers da requisição, incluindo Content-Type, CSRF Token e Cookies quando necessário
 * @param options - Request options
 * @param url - Request URL (optional, used to validate if cookies should be sent)
 */
export async function prepareHeaders(
  options: RequestInit,
  url?: string,
): Promise<Headers> {
  const headers = new Headers(options.headers || {})
  const isServer = isServerSide()

  // Adiciona Content-Type para JSON se houver body e não for FormData
  if (options.body && !headers.has('Content-Type')) {
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', CONTENT_TYPE_JSON)
    }
  }

  // Verifica se a URL é do nosso próprio backend antes de adicionar cookies/CSRF
  const isOwnBackend = !url || url.startsWith(webserver.hostApi)

  // Adiciona CSRF Token para métodos diferentes de GET (apenas para nosso backend)
  if (
    isOwnBackend &&
    options.method &&
    options.method.toUpperCase() !== HTTP_METHOD_GET
  ) {
    const csrfToken = await getCookie(`${COOKIE_PREFIX}-csrf-token`)
    if (csrfToken) {
      headers.set(CSRF_TOKEN_HEADER, csrfToken)
    }
  }

  // No servidor, adiciona os cookies formatados se não estiverem presentes (apenas para nosso backend)
  if (isServer && isOwnBackend && !headers.has('Cookie')) {
    const serverCookies = await getServerFormattedCookies()
    if (serverCookies) {
      headers.set('Cookie', serverCookies)
    }
  }

  return headers
}

/**
 * Faz o parsing da resposta baseado no Content-Type
 */
export async function parseResponse(
  response: Response,
): Promise<ParsedResponse> {
  const status = response.status
  const headers = response.headers
  const contentType = headers.get('content-type')

  let data: any

  if (contentType?.includes(CONTENT_TYPE_JSON)) {
    data = await response.json()
  } else if (contentType?.includes(CONTENT_TYPE_PDF)) {
    data = await response.blob()
  } else {
    data = await response.text()
  }

  return { data, status, headers, contentType }
}

/**
 * Verifica se a resposta indica token de sessão expirado
 */
export function isSessionTokenExpired(status: number, data: any): boolean {
  return (
    status === HTTP_STATUS_UNAUTHORIZED &&
    data?.message === TOKEN_EXPIRED_MESSAGE
  )
}

/**
 * Verifica se a resposta indica CSRF token ausente
 */
export function isCsrfTokenMissing(status: number, data: any): boolean {
  return (
    status === HTTP_STATUS_FORBIDDEN &&
    data?.message === CSRF_TOKEN_MISSING_MESSAGE
  )
}

/**
 * Redireciona para a página de login no cliente
 */
export function redirectToLogin(): void {
  console.info('🔄 Redirecionando para login')
  window.location.replace(LOGIN_REDIRECT_URL)
}

/**
 * Tenta fazer refresh do token de sessão no cliente
 */
export async function attemptTokenRefresh(
  originalUrl: string,
  originalOptions: RequestInit,
): Promise<ParsedResponse | null> {
  // Verifica se o CSRF token está presente
  const csrfToken = await getCookie(`${COOKIE_PREFIX}-csrf-token`)
  if (!csrfToken) {
    console.info('❌ CSRF token is missing. Aborting refresh token.')
    redirectToLogin()
    return null
  }

  // Prepara headers para o refresh
  const refreshHeaders = new Headers()
  refreshHeaders.set(CSRF_TOKEN_HEADER, csrfToken)
  refreshHeaders.set('Content-Type', CONTENT_TYPE_JSON)

  // Faz a requisição de refresh
  const refreshResponse = await fetch(
    `${webserver.hostApi}${REFRESH_TOKEN_ENDPOINT}`,
    {
      method: 'PATCH',
      headers: refreshHeaders,
      credentials: 'include',
      body: JSON.stringify({ logoutAllSessions: false }),
    },
  )

  if (refreshResponse.status !== HTTP_STATUS_OK) {
    console.info('💥 Failed to refresh token. Logging out...')
    redirectToLogin()
    return null
  }

  // Token refreshed com sucesso, tenta novamente a requisição original
  console.info('✅ Token refreshed successfully. Retrying original request...')

  const updatedHeaders = await prepareHeaders(originalOptions, originalUrl)

  const retryResponse = await fetch(originalUrl, {
    ...originalOptions,
    headers: updatedHeaders,
    credentials: 'include',
  })

  return parseResponse(retryResponse)
}

/**
 * Lida com erro de token expirado baseado no ambiente (servidor ou cliente)
 */
export async function handleTokenExpiration(
  url: string,
  options: RequestInit,
  parsedResponse: ParsedResponse,
): Promise<ParsedResponse> {
  const isServer = isServerSide()

  if (isServer) {
    // No servidor, isso não deveria acontecer - o middleware já deveria ter tratado
    console.error(
      '⚠️ ATENÇÃO: Token expirado detectado no servidor após middleware. Isso não deveria acontecer!',
    )
    console.error('URL da requisição:', url)
    console.error('Status da resposta:', parsedResponse.status)
    redirect(LOGIN_REDIRECT_URL)
  }

  // No cliente, tenta fazer refresh do token
  const refreshResult = await attemptTokenRefresh(url, options)

  if (!refreshResult) {
    // Se o refresh falhou, o usuário já foi redirecionado
    // Lançamos o erro original para não deixar a execução prosseguir
    throw new CustomError(
      parsedResponse.status,
      parsedResponse.data?.name || 'Error',
      parsedResponse.data?.message || `HTTP Error: ${parsedResponse.status}`,
      parsedResponse.data?.action,
      {
        details: parsedResponse.data?.details,
        action: parsedResponse.data?.action,
      },
    )
  }

  return refreshResult
}

/**
 * Lança um erro customizado baseado na resposta da API
 */
export function throwCustomError(parsedResponse: ParsedResponse): never {
  throw new CustomError(
    parsedResponse.status,
    parsedResponse.data?.name || 'Error',
    parsedResponse.data?.message || `HTTP Error: ${parsedResponse.status}`,
    parsedResponse.data?.action,
    {
      details: parsedResponse.data?.details,
      action: parsedResponse.data?.action,
    },
  )
}
