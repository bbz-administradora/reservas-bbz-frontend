import { CSRF_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/lib/cookie'
import { routeMatch } from '@/lib/route-matcher'
import { NextResponse } from 'next/server'
import { MiddlewareHandler } from './middleware-types'
import {
  clearAuthCookies,
  isAuthenticated,
  refreshTokenInMiddleware,
  validateAndRefreshToken,
  validateCookieState,
} from './middleware-utils'

const AUTH_ROUTES = [
  '/login',
  '/esqueceu-senha',
  '/redefinir-senha',
  '/redefinir-senha/:userId/:token',
]

// Rota de manutenção - precisa estar nas rotas públicas para não redirecionar para login
const MAINTENANCE_ROUTES = ['/manutencao']

const PUBLIC_ROUTES = [...AUTH_ROUTES, ...MAINTENANCE_ROUTES]

/**
 * Handler de modo de manutenção.
 *
 * Quando a variável de ambiente NEXT_PUBLIC_MAINTENANCE_MODE=true está ativa,
 * redireciona TODOS os usuários para a página /manutencao e limpa os cookies.
 *
 * Uso:
 * 1. Defina NEXT_PUBLIC_MAINTENANCE_MODE=true na Vercel/ambiente
 * 2. Faça deploy
 * 3. Aguarde todos os usuários serem redirecionados e terem cookies limpos
 * 4. Remova a variável ou defina como false
 * 5. Faça novo deploy
 */
export const maintenanceHandler: MiddlewareHandler = async (request) => {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

  if (!isMaintenanceMode) {
    return undefined
  }

  // Se já está na página de manutenção ou na API de clear-session, deixa passar
  const pathname = request.nextUrl.pathname
  if (pathname === '/manutencao' || pathname === '/api/clear-session') {
    return undefined
  }

  console.info('🔧 Middleware - Modo manutenção ativo, redirecionando...')

  // Redireciona para página de manutenção
  const response = NextResponse.redirect(new URL('/manutencao', request.url))

  // Limpa os cookies na resposta (os httpOnly serão limpos pela API route)
  clearAuthCookies(response)

  return response
}

/**
 * Handler que força o refresh do token quando o parâmetro ?force_refresh=true está presente.
 * Remove o parâmetro da URL após o processamento para evitar loops.
 */
export const forceRefreshHandler: MiddlewareHandler = async (request) => {
  const forceRefresh = request.nextUrl.searchParams.get('force_refresh')

  if (forceRefresh === 'true') {
    const csrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value

    if (csrfToken && refreshToken) {
      console.info(
        '🔄 Middleware - Force refresh detectado, forçando renovação do token...',
      )

      try {
        const response = await refreshTokenInMiddleware(request, csrfToken)

        if (response) {
          // Remove o parâmetro force_refresh da URL de destino
          const responseUrl = new URL(response.url)
          responseUrl.searchParams.delete('force_refresh')

          // Cria novo redirect para URL sem o parâmetro, mantendo os cookies
          const newResponse = NextResponse.redirect(responseUrl)

          // Copia os cookies da resposta original
          response.cookies.getAll().forEach((cookie) => {
            newResponse.cookies.set(cookie.name, cookie.value, {
              ...cookie,
            })
          })

          return newResponse
        } else {
          throw new Error('Falha ao renovar token durante force refresh.')
        }
      } catch (error) {
        console.error('❌ Force refresh handler - Erro:', error)

        // Em caso de erro, redireciona para login sem o parâmetro e limpa cookies
        const url = new URL('/login', request.url)
        url.searchParams.delete('force_refresh')
        const response = NextResponse.redirect(url)
        clearAuthCookies(response)
        return response
      }
    }

    // Se não tem os cookies necessários, redireciona sem o parâmetro
    const url = new URL(request.url)
    url.searchParams.delete('force_refresh')
    return NextResponse.redirect(url)
  }
}

/**
 * Handler que valida o token de sessão e faz refresh automaticamente se necessário.
 * IMPORTANTE: Deve ser executado ANTES dos handlers de autenticação para garantir
 * que o token esteja válido antes de verificar autenticação.
 */
export const tokenValidationHandler: MiddlewareHandler = async (request) => {
  // Ignora rotas públicas que não precisam de validação de token
  const isPublicRoute = routeMatch(PUBLIC_ROUTES, request.nextUrl.pathname)
  if (isPublicRoute) {
    return validateCookieState(request)
  }

  return await validateAndRefreshToken(request)
}

export const privateRouteHandler: MiddlewareHandler = async (request) => {
  const isPublicRoute = routeMatch(PUBLIC_ROUTES, request.nextUrl.pathname)
  if (!isPublicRoute) {
    const authenticated = await isAuthenticated(request)
    if (!authenticated) {
      // Se não autenticado redireciona para login
      const pathname = '/login'

      const searchParams = new URLSearchParams(request.nextUrl.search)
      searchParams.append('next', request.nextUrl.pathname)

      return NextResponse.redirect(
        new URL(`${pathname}?${searchParams.toString()}`, request.nextUrl.href),
      )
    }
  }
}

export const authRouteHandler: MiddlewareHandler = async (request) => {
  const isAuthRoute = routeMatch(AUTH_ROUTES, request.nextUrl.pathname)
  if (isAuthRoute) {
    const authenticated = await isAuthenticated(request)
    if (authenticated) {
      // Se já autenticado, redireciona para a home ou para next se existir
      let pathname = '/'

      const nextParam = request.nextUrl.searchParams.get('next')
      if (nextParam) {
        pathname = nextParam
      }

      return NextResponse.redirect(new URL(pathname, request.nextUrl.href))
    }
  }
}
