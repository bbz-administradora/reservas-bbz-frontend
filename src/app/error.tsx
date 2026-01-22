'use client'

import { LogoBbz } from '@/components/svg/logo-bbz'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { webserver } from '@/infra/webserver'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para debug (pode ser enviado para serviço de monitoramento)
    console.error('Erro na aplicação:', error)
  }, [error])

  return (
    <main className="bg-background flex min-h-screen w-screen flex-col items-center justify-start">
      {/* Header */}
      <div className="bg-primary text-primary-foreground flex h-20 w-full items-center justify-center gap-5 py-10">
        <Link
          href={`${webserver.host}/espacos`}
          title="Ir para a página inicial"
          className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md p-1 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <LogoBbz invert className="w-[60px]" />
        </Link>
        <Text variant="title-18-24-700" className="">
          Reserva de Espaços BBZ
        </Text>
      </div>

      {/* Conteúdo */}
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 px-4">
        {/* Ícone de alerta */}
        <div className="bg-primary/10 rounded-full p-6">
          <AlertTriangle className="text-primary h-16 w-16" />
        </div>

        {/* Título */}
        <Text
          as="h1"
          variant="headline-24-45-700"
          className="text-primary max-w-lg text-center lg:max-w-xl"
        >
          Ops! Algo deu errado
        </Text>

        {/* Mensagem principal */}
        <Text
          variant="title-18-24-500"
          className="text-muted-foreground max-w-lg text-center lg:max-w-xl"
        >
          Estamos passando por uma instabilidade temporária.
          <br />
          Nossa equipe já foi notificada e está trabalhando para resolver.
        </Text>

        {/* Card de informação */}
        <div className="bg-muted mt-4 max-w-md rounded-lg p-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
            <Text variant="title-16-18-500" className="text-primary">
              Manutenção em andamento
            </Text>
          </div>
          <Text variant="body-16-18-400" className="text-muted-foreground">
            O sistema retornará em poucos momentos.
            <br />
            Agradecemos sua paciência!
          </Text>
        </div>

        {/* Botões de ação */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href={`${webserver.host}/espacos`}>
              <Home className="h-4 w-4" />
              Ir para início
            </Link>
          </Button>
        </div>

        {/* Contato de suporte */}
        <div className="mt-8 text-center">
          <Text variant="label-14-16-400" className="text-muted-foreground">
            Se o problema persistir, entre em contato:
          </Text>
          <Link
            className="text-primary text-sm font-medium transition-all hover:underline"
            href="mailto:suporte@bbz.com.br"
          >
            suporte@bbz.com.br
          </Link>
        </div>

        {/* Código de erro (para debug) */}
        {error.digest && (
          <Text
            variant="label-14-16-400"
            className="text-muted-foreground/50 mt-4 font-mono text-xs"
          >
            Código: {error.digest}
          </Text>
        )}
      </div>
    </main>
  )
}
