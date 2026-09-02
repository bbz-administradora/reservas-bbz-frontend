import { COOKIE_PREFIX } from '@/config'
import * as cookie from 'cookie'

export const CSRF_COOKIE_NAME = `${COOKIE_PREFIX}-csrf-token`
export const SESSION_COOKIE_NAME = `${COOKIE_PREFIX}-session-token`
export const REFRESH_COOKIE_NAME = `${COOKIE_PREFIX}-refresh-token`

/**
 * Obtém o valor de um cookie pelo nome.
 * Funciona tanto no cliente quanto no servidor.
 *
 * @param name - Nome do cookie a buscar
 * @returns O valor do cookie ou undefined se não encontrado
 */
export async function getCookie(name: string): Promise<string | undefined> {
  if (typeof window !== 'undefined') {
    // Ambiente cliente: usa document.cookie
    const parsedCookies = cookie.parse(document.cookie || '')
    return parsedCookies[name]
  }

  // Ambiente servidor: usa next/headers de forma assíncrona
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const cookiesHeader = headersList.get('cookie') || ''
  const parsedCookies = cookie.parse(cookiesHeader)
  return parsedCookies[name]
}

/**
 * Obtém o cabeçalho 'X-CSRF-Token' com o valor do token CSRF do cookie.
 *
 * @returns Um objeto contendo o cabeçalho 'X-CSRF-Token' ou vazio se o token não for encontrado
 */
export async function getCSRFHeader(): Promise<Record<string, string>> {
  const csrfToken = await getCookie(CSRF_COOKIE_NAME)
  if (csrfToken) {
    return { 'X-CSRF-Token': csrfToken }
  }
  return {}
}

/**
 * Retorna os cookies formatados para uso no cabeçalho `Cookie` no servidor.
 *
 * @returns Uma string com os cookies formatados ou undefined se chamado no cliente ou nenhum cookie for encontrado.
 */
export async function getServerFormattedCookies(): Promise<string | undefined> {
  if (typeof window !== 'undefined') {
    // Retorna undefined no cliente
    return undefined
  }

  const csrfToken = await getCookie(CSRF_COOKIE_NAME)
  const sessionToken = await getCookie(SESSION_COOKIE_NAME)
  const refreshToken = await getCookie(REFRESH_COOKIE_NAME)

  const cookies = []

  if (csrfToken) cookies.push(`${CSRF_COOKIE_NAME}=${csrfToken}`)
  if (sessionToken) cookies.push(`${SESSION_COOKIE_NAME}=${sessionToken}`)
  if (refreshToken) cookies.push(`${REFRESH_COOKIE_NAME}=${refreshToken}`)

  // Retorna os cookies concatenados com '; ' ou uma string vazia se nenhum cookie existir
  return cookies.join('; ')
}

/**
 * Atualiza os cabeçalhos de uma requisição com cookies extraídos do cabeçalho `Set-Cookie` de uma resposta.
 * Funciona apenas no ambiente servidor. Se for chamado no cliente, retorna `undefined`.
 *
 * @param response - A resposta contendo o cabeçalho `Set-Cookie`.
 * @param originalHeaders - Os cabeçalhos originais da requisição que serão atualizados.
 * @returns Um novo objeto `Headers` contendo os cookies processados ou `undefined` se:
 *          1. O ambiente for cliente.
 *          2. O cabeçalho `Set-Cookie` não estiver presente na resposta.
 *
 * @example
 * const refreshResponse = await fetch('/refresh', { method: 'PATCH' })
 * const updatedHeaders = await updateHeadersWithSetCookie(refreshResponse, originalHeaders)
 * if (updatedHeaders) {
 *   const updatedRequest = new Request(request.url, { ...request, headers: updatedHeaders })
 *   const response = await fetch(updatedRequest)
 * }
 */
export async function updateHeadersWithSetCookie(
  response: Response,
  originalHeaders: Headers,
): Promise<Headers | undefined> {
  if (typeof window !== 'undefined') {
    // Retorna undefined no cliente
    return undefined
  }

  // Extrai o cabeçalho 'Set-Cookie' da resposta
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) {
    console.warn('Set-Cookie header is missing in the response.')
    return undefined
  }

  // Processa os cookies para formatar como "name=value; name=value"
  const cookies = setCookieHeader
    .split(',')
    .map((cookie) => cookie.split(';')[0]) // Extrai apenas "name=value"
    .join('; ') // Combina os cookies em "name1=value1; name2=value2"

  // Clona os headers originais e adiciona o cabeçalho 'Cookie'
  const updatedHeaders = new Headers(originalHeaders)
  updatedHeaders.set('Cookie', cookies)

  return updatedHeaders
}

/**
 * Obtém os cabeçalhos necessários para fazer requisições ao servidor.
 * Inclui o cabeçalho 'X-CSRF-Token' e os cookies de sessão.
 *
 * @returns Um objeto contendo os cabeçalhos ou `null` se o token CSRF não for encontrado.
 */
export async function getHeadersServer(): Promise<Record<
  string,
  string
> | null> {
  // Obter o cookie CSRF
  const csrfToken = await getCookie(CSRF_COOKIE_NAME)
  if (!csrfToken) {
    return null
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

  return headersServer
}
