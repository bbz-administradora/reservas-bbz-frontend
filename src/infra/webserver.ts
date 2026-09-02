import { env } from '@/infra/env'

// Verifica se a variável de ambiente NEXT_PUBLIC_VERCEL_ENV está definida (esta em ambiente serverless, ex: Vercel). Converte o valor em booleano (true se definida, false se não definida).
const isServerlessRuntime = !!process.env.NEXT_PUBLIC_VERCEL_ENV

// Verifica se a variável de ambiente NEXT_PHASE é igual a 'phase-production-build'. Indica se o código está sendo executado no momento da construção da aplicação (build time).
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

// Verifica se a variável de ambiente NEXT_PUBLIC_VERCEL_ENV é igual a 'production'. Indica se a aplicação está rodando em ambiente de produção.
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

// Define o host da aplicação com base nas condições verificadas anteriormente. Se estiver em produção, usa NEXT_PUBLIC_ADM_WEB_HOST com https. Se estiver em ambiente serverless (Preview Vercel), usa NEXT_PUBLIC_VERCEL_URL com https. Caso contrário, usa NEXT_PUBLIC_ADM_WEB_HOST com http (development).
const host = isProduction
  ? `https://${env.NEXT_PUBLIC_ADM_WEB_HOST}`
  : isServerlessRuntime
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : `http://${process.env.NEXT_PUBLIC_ADM_WEB_HOST}`

const hostApi = isProduction
  ? env.NEXT_PUBLIC_API_URL
  : `http://localhost:${env.NEXT_PUBLIC_API_PORT}`

// Cria um objeto com as configurações de ambiente e congela para torná-lo imutável.
const webserver = Object.freeze({
  host, // URL do host da aplicação
  hostApi, // URL do host da API
  isBuildTime, // Indica se está em build time
  isProduction, // Indica se está em ambiente de produção
  isServerlessRuntime, // Indica se está em ambiente serverless
})

export { webserver }
