import {
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from '@/lib/cookie'
import { NextRequest, NextResponse } from 'next/server'
import { MiddlewareHandler, ResponseModifier } from './middleware-types'

/**
 * URL da API obtida diretamente de process.env (funciona no Edge Runtime).
 * Variáveis NEXT_PUBLIC_* são substituídas no build time.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

/**
 * Tipo para representar um cookie parseado com seus atributos
 */
interface ParsedCookie {
  name: string
  value: string
  options: {
    path?: string
    httpOnly?: boolean
    secure?: boolean
    maxAge?: number
    sameSite?: 'strict' | 'lax' | 'none'
  }
}

/**
 * Faz parse de um header Set-Cookie e retorna um objeto com nome, valor e opções
 *
 * @param cookieStr - String do header Set-Cookie (ex: "name=value; Path=/; HttpOnly")
 * @returns Objeto ParsedCookie com nome, valor e opções
 */
function parseCookieHeader(cookieStr: string): ParsedCookie {
  const parts = cookieStr.split(';').map((s) => s.trim())
  const [name, value] = parts[0].split('=')

  const cookieOptions: ParsedCookie['options'] = {
    path: '/',
  }

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].toLowerCase()
    if (part === 'httponly') {
      cookieOptions.httpOnly = true
    } else if (part === 'secure') {
      cookieOptions.secure = true
    } else if (part.startsWith('path=')) {
      cookieOptions.path = parts[i].split('=')[1]
    } else if (part.startsWith('max-age=')) {
      cookieOptions.maxAge = parseInt(parts[i].split('=')[1])
    } else if (part.startsWith('samesite=')) {
      const sameSiteValue = parts[i]
        .split('=')[1]
        .toLowerCase() as ParsedCookie['options']['sameSite']
      cookieOptions.sameSite = sameSiteValue
    }
  }

  return { name, value, options: cookieOptions }
}

/**
 * Converte um array de headers Set-Cookie em um mapa de cookies parseados
 *
 * @param setCookieHeaders - Array de strings Set-Cookie
 * @returns Record com os cookies parseados indexados por nome
 */
function parseCookieHeaders(
  setCookieHeaders: string[],
): Record<string, ParsedCookie> {
  const cookies: Record<string, ParsedCookie> = {}

  for (const cookieStr of setCookieHeaders) {
    const parsed = parseCookieHeader(cookieStr)
    cookies[parsed.name] = parsed
    console.info(`🍪 Middleware - Cookie parseado: ${parsed.name}`)
  }

  return cookies
}

/**
 * Atualiza o header Cookie de uma requisição com novos valores de cookies
 *
 * @param request - A requisição Next.js
 * @param newCookies - Mapa de novos cookies parseados
 * @returns Headers atualizados com os cookies novos
 */
function updateRequestCookies(
  request: NextRequest,
  newCookies: Record<string, ParsedCookie>,
): Headers {
  const requestHeaders = new Headers(request.headers)
  const currentCookies = request.cookies.getAll()

  // Atualiza cookies existentes ou mantém os valores antigos
  const updatedCookies = currentCookies.map((cookie) => {
    if (newCookies[cookie.name]) {
      return `${cookie.name}=${newCookies[cookie.name].value}`
    }
    return `${cookie.name}=${cookie.value}`
  })

  // Adiciona novos cookies que não existiam antes
  for (const [name, parsed] of Object.entries(newCookies)) {
    if (!currentCookies.find((c) => c.name === name)) {
      updatedCookies.push(`${name}=${parsed.value}`)
    }
  }

  requestHeaders.set('cookie', updatedCookies.join('; '))
  return requestHeaders
}

/**
 * Aplica os cookies parseados em uma resposta NextResponse
 *
 * @param response - A resposta Next.js
 * @param cookies - Mapa de cookies parseados
 */
function applyParsedCookiesToResponse(
  response: NextResponse,
  cookies: Record<string, ParsedCookie>,
): void {
  for (const [name, parsed] of Object.entries(cookies)) {
    response.cookies.set(name, parsed.value, parsed.options)
  }
}

/**
 * Executa uma série de handlers de middleware em sequência.
 * Para assim que um handler retornar uma resposta.
 * Sempre executa os modifiers antes de retornar.
 */
export async function runHandlers(
  request: NextRequest,
  handlers: MiddlewareHandler[],
  modifiers: ResponseModifier[] = [],
): Promise<NextResponse> {
  let response: NextResponse | undefined

  // Executa handlers normais até encontrar uma resposta
  for (const handler of handlers) {
    response = await handler(request)
    if (response) break
  }

  // Executa modifiers que podem alterar a resposta
  for (const modifier of modifiers) {
    const modifiedResponse = await modifier(request, response)
    if (modifiedResponse) response = modifiedResponse
  }

  return response ?? NextResponse.next()
}

/**
 * Limpa todos os cookies de autenticação da resposta.
 * Usado quando detectamos um estado inconsistente dos cookies.
 *
 * @param response - A resposta Next.js onde os cookies serão deletados
 */
export function clearAuthCookies(response: NextResponse): void {
  const cookiesToDelete = [
    SESSION_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    CSRF_COOKIE_NAME,
  ]

  for (const cookieName of cookiesToDelete) {
    response.cookies.delete(cookieName)
    console.info(`🗑️ Middleware - Cookie deletado: ${cookieName}`)
  }
}

/**
 * Verifica se os cookies de autenticação estão em um estado válido.
 * O único cookie que pode estar ausente é o session token.
 * Se faltar o CSRF ou o refresh token, o estado é inválido.
 *
 * @param request - A requisição Next.js
 * @returns NextResponse com cookies deletados e redirecionamento para login se estado inválido, ou undefined se está ok
 */
export function validateCookieState(
  request: NextRequest,
): NextResponse | undefined {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  const csrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

  // Se não tem nenhum cookie, está ok (usuário não está autenticado)
  if (!sessionToken && !refreshToken && !csrfToken) {
    return undefined
  }

  // REGRA: O único cookie que pode estar ausente é o session token
  // Se tiver qualquer cookie mas faltar refresh OU csrf, estado é inválido

  // Cenário 1: Tem session e/ou refresh, mas não tem CSRF (INVÁLIDO)
  if ((sessionToken || refreshToken) && !csrfToken) {
    console.warn(
      '⚠️ Middleware - Estado inválido: Cookies de auth presentes mas CSRF token ausente. Limpando todos os cookies e redirecionando para login.',
    )

    // Cria resposta com redirecionamento para login
    const searchParams = new URLSearchParams()
    searchParams.append('next', request.nextUrl.pathname)
    const response = NextResponse.redirect(
      new URL(`/login?${searchParams.toString()}`, request.nextUrl.href),
    )

    clearAuthCookies(response)
    return response
  }

  // Cenário 2: Tem session e/ou CSRF, mas não tem refresh (INVÁLIDO)
  if ((sessionToken || csrfToken) && !refreshToken) {
    console.warn(
      '⚠️ Middleware - Estado inválido: Cookies presentes mas refresh token ausente. Limpando todos os cookies e redirecionando para login.',
    )

    // Cria resposta com redirecionamento para login
    const searchParams = new URLSearchParams()
    searchParams.append('next', request.nextUrl.pathname)
    const response = NextResponse.redirect(
      new URL(`/login?${searchParams.toString()}`, request.nextUrl.href),
    )

    clearAuthCookies(response)
    return response
  }

  // Estado válido: Tem todos os cookies necessários OU apenas falta session token
  return undefined
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)
  const csrfToken = request.cookies.get(CSRF_COOKIE_NAME)
  return (!!sessionToken || !!refreshToken) && !!csrfToken
}

/**
 * Verifica se precisa fazer refresh do token de sessão.
 * Só faz refresh se NÃO tiver session token mas TIVER refresh token e CSRF token.
 *
 * Esta função não valida a validade do token em cada requisição para evitar overhead.
 * A validação será feita naturalmente quando o customFetch fizer chamadas à API.
 *
 * @param request - A requisição Next.js
 * @returns NextResponse com os novos cookies se refresh bem-sucedido, ou undefined se não precisa refresh
 */
export async function validateAndRefreshToken(
  request: NextRequest,
): Promise<NextResponse | undefined> {
  // PRIMEIRO: Valida o estado dos cookies
  // Se o estado for inválido, retorna resposta com cookies deletados
  const invalidStateResponse = validateCookieState(request)
  if (invalidStateResponse) {
    return invalidStateResponse
  }

  const csrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Se já tem session token, deixa continuar normalmente
  // A validação será feita quando o customFetch fizer chamadas à API
  if (sessionToken) {
    return undefined
  }

  // Se não tem session token mas tem refresh token e CSRF, tenta fazer refresh
  if (!sessionToken && refreshToken && csrfToken) {
    console.info(
      '🔄 Middleware - Session token ausente, mas refresh token presente. Tentando refresh...',
    )
    return await refreshTokenInMiddleware(request, csrfToken)
  }

  // Se não tem nem session nem refresh token, deixa outros handlers tratarem
  // (provavelmente será redirecionado para login pelo privateRouteHandler)
  return undefined
}

/**
 * Realiza o refresh do token no contexto do middleware.
 * Retorna uma resposta NextResponse que continua a requisição com os novos cookies.
 *
 * @param request - A requisição Next.js
 * @param csrfToken - O token CSRF atual
 * @returns NextResponse com novos cookies ou undefined para deixar outros handlers tratarem
 */
export async function refreshTokenInMiddleware(
  request: NextRequest,
  csrfToken: string,
): Promise<NextResponse | undefined> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value

  console.info('🔍 Middleware - Tokens disponíveis:', {
    hasRefreshToken: !!refreshToken,
    hasCsrfToken: !!csrfToken,
  })

  if (!refreshToken) {
    console.info(
      '❌ Middleware - Refresh token não encontrado, deixando outros handlers tratarem',
    )
    return undefined
  }

  try {
    const refreshResponse = await fetch(
      `${API_URL}/v1/private/auth/refresh-session`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}; ${CSRF_COOKIE_NAME}=${csrfToken}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({}),
      },
    )

    if (refreshResponse.status === 200) {
      console.info('✅ Middleware - Token renovado com sucesso')

      // Extrai os novos cookies da resposta usando getSetCookie() para pegar TODOS os cookies
      const setCookieHeaders = refreshResponse.headers.getSetCookie()

      console.info(
        `📦 Middleware - Recebidos ${setCookieHeaders.length} cookies da API`,
      )

      if (setCookieHeaders.length === 0) {
        console.warn(
          '⚠️ Middleware - Nenhum cookie recebido da API de refresh!',
        )
      }

      // Parse dos cookies recebidos
      const newCookies = parseCookieHeaders(setCookieHeaders)

      // Clona a URL
      const url = request.nextUrl.clone()

      // Atualiza o header Cookie da requisição com os novos valores
      // Isso garante que o SSR veja os cookies atualizados
      const requestHeaders = updateRequestCookies(request, newCookies)
      console.info(
        '🔄 Middleware - Headers da requisição atualizados com novos cookies',
      )

      // Cria uma resposta com rewrite para processar a página novamente
      const response = NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      })

      // Define os cookies na resposta (para o browser)
      applyParsedCookiesToResponse(response, newCookies)

      console.info(
        '✅ Middleware - Response configurado com cookies atualizados',
      )

      return response
    } else {
      console.info(
        '❌ Middleware - Falha ao renovar token, status:',
        refreshResponse.status,
      )

      throw new Error(
        'Falha ao renovar token, status:' + refreshResponse.status,
      )
    }
  } catch (error) {
    console.error('❌ Middleware - Erro ao fazer refresh:', error)

    // Cria resposta com redirecionamento e limpa todos os cookies de autenticação
    const response = NextResponse.redirect(new URL('/login', request.url))
    clearAuthCookies(response)
    return response
  }
}
