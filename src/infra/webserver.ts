import { env } from '@/infra/env'

// Verifica se a variável de ambiente NEXT_PUBLIC_VERCEL_ENV está definida (esta em ambiente serverless, ex: Vercel). Converte o valor em booleano (true se definida, false se não definida).
const isServerlessRuntime = !!process.env.NEXT_PUBLIC_VERCEL_ENV

// Verifica se a variável de ambiente NEXT_PHASE é igual a 'phase-production-build'. Indica se o código está sendo executado no momento da construção da aplicação (build time).
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

// Verifica se a variável de ambiente NEXT_PUBLIC_VERCEL_ENV é igual a 'production'. Indica se a aplicação está rodando em ambiente de produção.
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

function resolveOrigin(value: string, protocol: 'http' | 'https') {
  const url = /^https?:\/\//i.test(value) ? value : `${protocol}://${value}`
  return new URL(url).origin
}

// Define o host da aplicação a partir de NEXT_PUBLIC_ADM_WEB_HOST, com https em ambiente serverless (Vercel, produção ou preview) e http no desenvolvimento local. Não usa NEXT_PUBLIC_VERCEL_URL: é a URL *.vercel.app do deploy, onde os cookies de sessão (domínio .bbz.com.br) não existem.
const host = resolveOrigin(
  env.NEXT_PUBLIC_ADM_WEB_HOST,
  isServerlessRuntime ? 'https' : 'http',
)

// Mesma origem que os endpoints gerados pelo Orval usam. O custom-fetch só repassa cookies e CSRF quando a URL começa com este valor, então os dois precisam coincidir em todos os ambientes.
const hostApi = env.NEXT_PUBLIC_API_URL

// Cria um objeto com as configurações de ambiente e congela para torná-lo imutável.
const webserver = Object.freeze({
  host, // URL do host da aplicação
  hostApi, // URL do host da API
  isBuildTime, // Indica se está em build time
  isProduction, // Indica se está em ambiente de produção
  isServerlessRuntime, // Indica se está em ambiente serverless
})

export { webserver }
