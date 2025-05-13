/**
 * DocScreen: Módulo de customFetch para gerenciamento completo de requisições HTTP
 * com suporte a CSRF e refresh automático de token.
 *
 * Este arquivo agrupa todas as funções necessárias em um único local:
 *
 * 1. buildHeaders
 *    - Constrói e retorna um objeto Headers, adicionando Content-Type
 *      (se aplicável) e o cabeçalho X-CSRF-Token a partir do cookie.
 *
 * 2. parseResponse
 *    - Lê o content-type da Response e faz o parse adequado:
 *      JSON, PDF (Blob) ou texto puro.
 *
 * 3. tryRefresh
 *    - Quando a resposta original retorna 401 com mensagem de token expirado,
 *      esta função tenta renovar a sessão (refresh) chamando o endpoint
 *      /auth/refresh/user/session.
 *    - No ambiente servidor, injeta cookies recebidos via Set-Cookie
 *      atualizando o Headers da requisição.
 *    - No ambiente cliente, reconstrói a requisição original com novo CSRF.
 *
 * 4. customFetch
 *    - Orquestra todo o fluxo de fetch:
 *      a) Monta os headers usando buildHeaders.
 *      b) Executa a requisição.
 *      c) Se 401 e token expirado, chama tryRefresh e reexecuta.
 *      d) Retorna um objeto com { data, status, headers }.
 *
 * Benefícios:
 * - Centralização de lógica de autenticação e parsing.
 * - Reuso de utilitários isolados.
 * - Facilidade de manutenção e testes.
 *
 * Uso:
 * import { customFetch } from '@/lib/customFetch'
 * const { data, status, headers } = await customFetch<MyType>(url, options)
 */
import { webserver } from '@/infra/webserver'
import {
  getCookie,
  getServerFormattedCookies,
  updateHeadersWithSetCookie,
} from '@/lib/cookie'

const CSRF_COOKIE_NAME = 'bbz-server-auth-csrf-token'

/**
 * buildHeaders: constrói Headers a partir de headers iniciais,
 * adicionando Content-Type e X-CSRF-Token.
 *
 * @param baseHeaders - Cabeçalhos iniciais a serem clonados
 * @param body - Corpo da requisição (BodyInit ou null)
 */
async function buildHeaders(
  baseHeaders?: HeadersInit,
  body?: BodyInit | null,
): Promise<Headers> {
  const headers = new Headers(baseHeaders || {})
  const csrf = await getCookie(CSRF_COOKIE_NAME)

  // Se houver body e não for FormData, define JSON
  if (body && !(body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  // Adiciona token CSRF se disponível
  if (csrf) {
    headers.set('X-CSRF-Token', csrf)
  }

  return headers
}

/**
 * parseResponse: interpreta o corpo da Response conforme o content-type.
 */
async function parseResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  if (contentType.includes('application/pdf')) {
    return res.blob()
  }
  return res.text()
}

/**
 * tryRefresh: em caso de 401 com token expirado, tenta renovar a sessão.
 * Retorna uma nova Request ou null se falhar.
 */
async function tryRefresh(request: Request): Promise<Request | null> {
  const csrf = await getCookie(CSRF_COOKIE_NAME)
  if (!csrf) {
    console.warn('❌ CSRF token is missing. Aborting refresh flow.')
    return null
  }

  // Formata cookies do servidor
  const cookies = await getServerFormattedCookies()
  const refreshRes = await fetch(
    `${webserver.hostApi}/v1/private/auth/refresh/user/session`,
    {
      method: 'PATCH',
      headers: { 'X-CSRF-Token': csrf, ...(cookies && { Cookie: cookies }) },
      credentials: 'include',
    },
  )

  // Se o refresh não retornar 201, aborta
  if (refreshRes.status !== 201) {
    console.error('Failed to refresh token. Status:', refreshRes.status)
    return null
  }

  // Ambiente servidor: injeta cookies do Set-Cookie
  if (typeof window === 'undefined') {
    const newHeaders = await updateHeadersWithSetCookie(
      refreshRes,
      request.headers,
    )
    if (newHeaders) {
      return new Request(request.url, { ...request, headers: newHeaders })
    }
    return null
  }

  // Ambiente cliente: reconstrói a Request original
  const headers = await buildHeaders(request.headers, request.body)
  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body ?? undefined,
    credentials: 'include',
  })
}

/**
 * customFetch: executa fetch com CSRF, parsing e refresh automático.
 */
export async function customFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<
  T extends Promise<infer U> ? U : { data: T; status: number; headers: Headers }
> {
  // Monta headers e Request inicial
  const headers = await buildHeaders(options.headers, options.body)
  const reqInit: RequestInit = { ...options, headers, credentials: 'include' }
  let request = new Request(url, reqInit)

  // Chamada original
  let response = await fetch(request)
  let data = await parseResponse(response)

  // Se 401 e token expirado, tenta refresh e reexecuta
  if (
    response.status === 401 &&
    typeof data === 'object' &&
    data?.message === 'Token inválido ou expirado.'
  ) {
    const refreshedReq = await tryRefresh(request)
    if (refreshedReq) {
      response = await fetch(refreshedReq)
      data = await parseResponse(response)
    }
  }

  // Retorna dados, status e headers
  return { data, status: response.status, headers: response.headers } as any
}
