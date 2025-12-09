import { COOKIE_PREFIX } from '@/config'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * API Route para limpar todos os cookies de autenticação.
 *
 * Esta rota é usada pela página de manutenção para limpar os cookies httpOnly
 * que não podem ser deletados via JavaScript no cliente.
 *
 * POST /api/clear-session
 */
export async function POST() {
  const cookieStore = await cookies()

  const cookiesToDelete = [
    `${COOKIE_PREFIX}-session-token`,
    `${COOKIE_PREFIX}-refresh-token`,
    `${COOKIE_PREFIX}-csrf-token`,
  ]

  // Deleta todos os cookies de autenticação
  for (const cookieName of cookiesToDelete) {
    cookieStore.delete(cookieName)
  }

  return NextResponse.json({
    success: true,
    message: 'Sessão limpa com sucesso.',
  })
}
