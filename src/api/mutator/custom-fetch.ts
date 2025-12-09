import {
  HTTP_STATUS_BAD_REQUEST,
  handleTokenExpiration,
  isCsrfTokenMissing,
  isSessionTokenExpired,
  parseResponse,
  prepareHeaders,
  redirectToLogin,
  throwCustomError,
} from './custom-fetch-utils'

/**
 * Custom fetch wrapper para lidar com requisições à API com:
 * - Headers dinâmicos (Content-Type, CSRF Token)
 * - Refresh automático de token no cliente
 * - Tratamento de erros customizado
 * - Suporte a diferentes tipos de resposta (JSON, PDF, texto)
 *
 * @template T - Tipo de retorno esperado
 * @param url - URL da requisição
 * @param options - Opções do fetch (método, headers, body, etc.)
 * @returns Promise com os dados, status e headers da resposta
 *
 * @throws {CustomError} - Lança erro customizado para status >= 400
 */
export async function customFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<
  T extends Promise<infer U> ? U : { data: T; status: number; headers: Headers }
> {
  // Prepara os headers com Content-Type e CSRF Token quando necessário
  const headers = await prepareHeaders(options, url)

  // Executa a requisição inicial
  const request = new Request(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  const response = await fetch(request)
  let parsedResponse = await parseResponse(response)

  // Verifica se o CSRF token está ausente e redireciona para login (apenas no cliente)
  if (isCsrfTokenMissing(parsedResponse.status, parsedResponse.data)) {
    console.info('❌ CSRF token ausente. Redirecionando para login...')
    redirectToLogin()
    return parsedResponse as any // Nunca será alcançado devido ao redirect
  }

  // Verifica se o token expirou e tenta fazer refresh (apenas no cliente)
  if (isSessionTokenExpired(parsedResponse.status, parsedResponse.data)) {
    parsedResponse = await handleTokenExpiration(url, options, parsedResponse)
  }

  // Lança erro para status codes de erro (>= 400)
  if (parsedResponse.status >= HTTP_STATUS_BAD_REQUEST) {
    throwCustomError(parsedResponse)
  }

  return {
    data: parsedResponse.data,
    status: parsedResponse.status,
    headers: parsedResponse.headers,
  } as unknown as T extends Promise<infer U>
    ? U
    : { data: T; status: number; headers: Headers }
}
