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
 * import { customFetch } from '@/api/mutator/custom-fetch'
 * const { data, status, headers } = await customFetch<MyType>(url, options)
 */
import { webserver } from '@/infra/webserver'
import { getCookie, getServerFormattedCookies } from '@/lib/cookie'

const CSRF_COOKIE_NAME = 'bbz-server-auth-csrf-token'

/**
 * cloneRequestBody: clone a request body so it can be reused in case of retries.
 * The standard fetch API consumes the body as a stream and it can't be reused.
 * This function creates a copy of the body based on its type.
 *
 * @param body - The original request body (string, FormData, etc)
 * @returns A clone of the body that can be used in a new request
 */
function cloneRequestBody(body: BodyInit): BodyInit {
  // String bodies (including JSON) can be reused directly
  if (typeof body === 'string') {
    return body
  }

  // FormData needs to be recreated
  if (body instanceof FormData) {
    const formDataCopy = new FormData()
    for (const [key, value] of body.entries()) {
      formDataCopy.append(key, value)
    }
    return formDataCopy
  }

  // For other types (Blob, BufferSource, etc.)
  // We'll do our best effort here, but some cases might not be handled perfectly
  if (body instanceof Blob) {
    // Create a new blob with the same content
    return new Blob([body], { type: body.type })
  }

  // For other types, return as is (might not work for all cases)
  return body
}

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
 * customFetch: executa fetch com CSRF, parsing e refresh automático.
 * Esta versão corrigida resolve problemas com corpos de requisição (bodies) que são consumidos
 * e não podem ser reutilizados entre tentativas.
 */
export async function customFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<
  T extends Promise<infer U> ? U : { data: T; status: number; headers: Headers }
> {
  // Faz uma cópia do body original para uso na requisição inicial
  const originalBody = options.body ? cloneRequestBody(options.body) : undefined

  // Monta headers para a requisição inicial
  const headers = await buildHeaders(options.headers, originalBody)

  // Executa a primeira requisição
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    body: originalBody,
  })

  let data = await parseResponse(response)

  // Se 401 e token expirado, faz refresh e tenta novamente
  if (
    response.status === 401 &&
    typeof data === 'object' &&
    data?.message === 'Token inválido ou expirado.'
  ) {
    // Tenta renovar o token
    const csrf = await getCookie(CSRF_COOKIE_NAME)
    const cookies = await getServerFormattedCookies()

    const refreshRes = await fetch(
      `${webserver.hostApi}/v1/private/auth/refresh/user/session`,
      {
        method: 'PATCH',
        headers: {
          'X-CSRF-Token': csrf || '',
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: 'include',
      },
    )

    // Se refresh token deu certo (201), refaz a requisição original
    if (refreshRes.status === 201) {
      // Faz uma nova cópia do body original para a segunda tentativa
      const retryBody = options.body
        ? cloneRequestBody(options.body)
        : undefined

      // Cria novos headers depois do refresh (pode ter atualizado o CSRF token)
      const newHeaders = await buildHeaders(options.headers, retryBody)

      // Refaz a requisição com o novo token e o body fresco
      response = await fetch(url, {
        ...options,
        headers: newHeaders,
        credentials: 'include',
        body: retryBody,
      })

      data = await parseResponse(response)
    }
  }

  // Retorna dados, status e headers
  return { data, status: response.status, headers: response.headers } as any
}
