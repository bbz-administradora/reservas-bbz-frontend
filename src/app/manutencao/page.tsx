'use client'

import { LogoBbz } from '@/components/svg/logo-bbz'
import { Construction } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Página de manutenção.
 *
 * Esta página é exibida quando o sistema está em modo de manutenção.
 * Ela automaticamente:
 * 1. Chama a API para limpar os cookies httpOnly
 * 2. Mostra uma mensagem amigável ao usuário
 */
export default function ManutencaoPage() {
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
      } catch (error) {
        console.error('Erro ao limpar sessão:', error)
      }
    }

    clearSession()
  }, [])

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <LogoBbz className="mb-10 w-24" />
        <Construction
          className="text-primary mb-6 size-12"
          aria-hidden="true"
        />

        <h1 className="text-foreground mb-4 text-2xl font-bold">
          Sistema em implementação
        </h1>

        <p className="text-muted-foreground max-w-md text-base">
          Esta página está temporariamente em manutenção enquanto concluímos a
          implantação do sistema.
        </p>

        <p className="text-foreground mt-8 text-sm">
          Previsão de liberação
          <strong className="mt-1 block text-lg">15 de setembro de 2026</strong>
        </p>
      </div>
    </main>
  )
}
