'use client'

import { useEffect, useState } from 'react'

/**
 * Página de manutenção.
 *
 * Esta página é exibida quando o sistema está em modo de manutenção.
 * Ela automaticamente:
 * 1. Chama a API para limpar os cookies httpOnly
 * 2. Mostra uma mensagem amigável ao usuário
 */
export default function ManutencaoPage() {
  const [cleaned, setCleaned] = useState(false)

  useEffect(() => {
    async function clearSession() {
      try {
        // Chama a API route do Next.js para limpar os cookies httpOnly
        await fetch('/api/clear-session', {
          method: 'POST',
          credentials: 'include',
        })

        // Limpa localStorage e sessionStorage
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch {
          // Ignora erros de storage
        }

        setCleaned(true)
      } catch (error) {
        console.error('Erro ao limpar sessão:', error)
        setCleaned(true) // Continua mesmo com erro
      }
    }

    clearSession()
  }, [])

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <svg
            className="text-primary mx-auto h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <h1 className="text-foreground mb-4 text-2xl font-bold">
          Sistema em Manutenção
        </h1>

        {!cleaned ? (
          <div>
            <p className="text-muted-foreground mb-4">
              Preparando atualização...
            </p>
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-4">
              Estamos realizando uma atualização de segurança no sistema.
            </p>
            <p className="text-muted-foreground mb-6">
              Por favor, aguarde alguns minutos e tente novamente.
            </p>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-muted-foreground text-sm">
                ⏱️ Previsão de retorno: <strong>10 minutos</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
