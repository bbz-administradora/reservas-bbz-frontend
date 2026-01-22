'use client'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global Error Handler - Último recurso para erros críticos
 *
 * Este componente é exibido quando ocorre um erro no layout raiz.
 * Não pode usar componentes externos pois o próprio layout pode ter falhado.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#fafafa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: '#1a1a2e',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            🏢 Reserva de Espaços BBZ
          </h2>
        </header>

        {/* Conteúdo */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          {/* Ícone */}
          <div
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.1)',
              borderRadius: '50%',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          {/* Título */}
          <h1
            style={{
              color: '#1a1a2e',
              fontSize: '28px',
              fontWeight: 700,
              margin: '0 0 16px 0',
            }}
          >
            Ops! Algo deu errado
          </h1>

          {/* Mensagem */}
          <p
            style={{
              color: '#666',
              fontSize: '16px',
              lineHeight: 1.6,
              maxWidth: '400px',
              margin: '0 0 24px 0',
            }}
          >
            Estamos passando por uma instabilidade temporária.
            <br />
            Nossa equipe já foi notificada e está trabalhando para resolver.
          </p>

          {/* Card de status */}
          <div
            style={{
              backgroundColor: '#f0f0f0',
              borderRadius: '12px',
              padding: '20px 32px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #1a1a2e',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ color: '#1a1a2e', fontWeight: 600 }}>
                Manutenção em andamento
              </span>
            </div>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              O sistema retornará em poucos momentos. 🙏
            </p>
          </div>

          {/* Botões */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={reset}
              style={{
                backgroundColor: '#1a1a2e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🔄 Tentar novamente
            </button>
            <a
              href="/espacos"
              style={{
                backgroundColor: 'transparent',
                color: '#1a1a2e',
                border: '1px solid #1a1a2e',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🏠 Ir para início
            </a>
          </div>

          {/* Suporte */}
          <p
            style={{
              color: '#999',
              fontSize: '13px',
              marginTop: '40px',
            }}
          >
            Se o problema persistir:{' '}
            <a
              href="mailto:suporte@bbz.com.br"
              style={{ color: '#1a1a2e', textDecoration: 'underline' }}
            >
              suporte@bbz.com.br
            </a>
          </p>

          {/* Código de erro */}
          {error.digest && (
            <p
              style={{
                color: '#ccc',
                fontSize: '11px',
                fontFamily: 'monospace',
                marginTop: '16px',
              }}
            >
              Código: {error.digest}
            </p>
          )}
        </main>

        {/* CSS para animação */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </body>
    </html>
  )
}
