import { LogoBbz } from '@/components/svg/logo-bbz'
import { Text } from '@/components/Text'
import { env } from '@/infra/env'
import { webserver } from '@/infra/webserver'
import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="bg-background flex h-screen w-screen flex-col items-center justify-start">
      <div className="bg-primary text-primary-foreground flex h-20 w-full items-center justify-center gap-5 py-10">
        {/* Logo  */}
        <Link
          href={`${webserver.host}/espacos`}
          title="Ir para a página de salas"
          className="ring-offset-primary focus-visible:ring-accent cursor-pointer rounded-md p-1 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <LogoBbz invert className="w-[60px]" />
        </Link>

        {/* Title */}
        <Text variant="title-18-24-700" className="">
          Reserva de Espaços BBZ
        </Text>
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
        <Image
          src={`${env.NEXT_PUBLIC_BUCKET}/404-error.svg`}
          alt="Erro 404"
          width={300}
          height={216}
          priority
          className="z-10"
        />
        <Text
          as="h1"
          variant="headline-24-45-700"
          className="text-primary my-4 max-w-lg text-center lg:max-w-xl"
        >
          Oops! Página não encontrada
        </Text>
        <Text
          variant="title-18-24-500"
          className="max-w-lg text-center lg:max-w-xl"
        >
          Não conseguimos encontrar o que você procura. Talvez tenha sido movida
          ou removida.
        </Text>
        <div className="mt-5 flex flex-col items-center justify-center gap-2">
          <Text
            variant="title-16-18-400"
            className="max-w-lg text-center lg:max-w-2xl"
          >
            Volte para pagina inicial ou entre em contato com o suporte.
          </Text>
          <Link
            className="text-primary text-[16px] leading-[24px] font-bold tracking-[0.15px] transition-all hover:underline lg:text-[18px]"
            href={`${webserver.host}/espacos`}
          >
            app-sistema-reserva.bbz.com.br
          </Link>
        </div>
      </div>
    </main>
  )
}
