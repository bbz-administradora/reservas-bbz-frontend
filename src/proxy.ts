import type { NextRequest } from 'next/server'
import {
  authRouteHandler,
  forceRefreshHandler,
  maintenanceHandler,
  privateRouteHandler,
  tokenValidationHandler,
} from './middleware/middleware-handlers'
import {
  MiddlewareHandler,
  ResponseModifier,
} from './middleware/middleware-types'
import { runHandlers } from './middleware/middleware-utils'

/**
 * Middleware do Next.js para processamento de requisições.
 *
 * Este middleware executa em Server-Side Rendering (SSR) e intercepta cada requisição feita para nossa aplicação.
 *
 * ## Arquitetura
 *
 * O middleware utiliza um padrão de composição com dois tipos de processadores:
 *
 * 1. **Handlers**: Executados em sequência, param quando um retorna uma resposta (ex: redirecionamentos, bloqueios)
 * 2. **Modifiers**: Sempre executados, modificam a resposta final (ex: adicionar cookies, headers)
 *
 * ## Validação e Refresh de Token
 *
 * O middleware agora é responsável por fazer refresh preventivo do token quando detecta que:
 * - NÃO existe session token
 * - MAS existe refresh token e CSRF token
 *
 * ### Fluxo de validação:
 *
 * 1. Para rotas privadas, o `tokenValidationHandler` verifica se há session token
 * 2. Se NÃO tiver session token mas tiver refresh token, faz refresh automaticamente
 * 3. Se o refresh for bem-sucedido, a requisição continua normalmente com os novos tokens
 * 4. Se o refresh falhar ou não houver tokens suficientes, retorna `undefined` e deixa
 *    os handlers de autenticação (como `privateRouteHandler`) redirecionarem para login
 *
 * ### Importante:
 *
 * - O middleware NÃO valida a validade do token em cada requisição (evita overhead de chamadas à API)
 * - A validação real acontece quando o `customFetch` faz chamadas à API
 * - Se o token expirar durante uma requisição SSR, o `customFetch` detecta e loga como situação anômala
 *
 * ### Benefícios desta abordagem:
 *
 * - Refresh preventivo apenas quando necessário (sem session token)
 * - Evita overhead de validação em toda requisição
 * - Centraliza lógica de refresh em um único lugar
 * - Previne loops de redirecionamento com proteções adequadas
 *
 * @param request - A requisição Next.js
 * @returns NextResponse processado pelos handlers e modifiers
 */
export async function proxy(request: NextRequest) {
  // Handlers são executados em sequência,
  // parando quando algum retorna uma resposta
  const handlers: MiddlewareHandler[] = [
    maintenanceHandler, // PRIMEIRO: Se em manutenção, redireciona todos e limpa cookies
    tokenValidationHandler, // IMPORTANTE: Deve vir antes dos handlers de autenticação
    forceRefreshHandler, // Force refresh quando ?force_refresh=true está presente
    privateRouteHandler,
    authRouteHandler,
  ]

  // Modifiers alteram a resposta e são sempre executados,
  // independente de algum handler ter retornado uma resposta
  const modifiers: ResponseModifier[] = []

  return runHandlers(request, handlers, modifiers)
}

/**
 * Configuração do matcher para otimizar o middleware.
 *
 * O matcher define quais rotas devem ser processadas pelo middleware.
 * Rotas que não correspondem ao matcher nem sequer executam o middleware,
 * economizando recursos e melhorando a performance.
 *
 * Excluímos:
 * - Arquivos estáticos (imagens, fontes, etc.)
 * - Recursos internos do Next.js (_next)
 * - Ícones e manifests
 */
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas exceto:
     * - API routes (/api/*)
     * - Arquivos estáticos (*.*)
     * - Recursos do Next.js (_next/*)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
