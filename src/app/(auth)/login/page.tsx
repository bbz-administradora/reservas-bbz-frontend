import { metadata as metadataHome } from '@/app/layout'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'
import { LogoBbz } from '@/components/svg/logo-bbz'
import { Text } from '@/components/Text'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  ...metadataHome,
  title: 'Reserva de Salas BBZ - Login',
  description: 'Login Reserva de Salas BBZ',
}

export default async function Login() {
  return (
    <div
      id="main"
      className="from-primary to-tertiary flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-4 py-5"
    >
      {/* Card with login form */}
      <Card className="bg-background w-full gap-10 border-none shadow-none md:max-w-md md:p-10 md:shadow-md">
        <CardHeader className="gap-10 p-0">
          <LogoBbz className="mx-auto" />
          <Text as="h1" variant={'title-22-32-700'} className="text-center">
            Acesse o sistema de Reserva de Salas BBZ
          </Text>
        </CardHeader>
        <CardContent className="gap-5 space-y-5">
          <Text className="text-center">
            Para entrar, clique no botão abaixo e faça login com sua conta
            Google.
          </Text>

          <GoogleLoginButton />

          <Text
            variant={'label-14-14-400'}
            className="text-muted-foreground text-center"
          >
            <strong>Importante</strong>: você precisa ter uma conta autorizada
            pela BBZ para acessar o sistema.
          </Text>
        </CardContent>
        <CardFooter className="flex-col gap-1">
          <Text className="">Precisa de ajuda?</Text>
          <a
            href="https://wa.me/5511993458823"
            title="WhatsApp Suporte"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary ring-offset-muted focus-visible:ring-ring/20 rounded-md font-bold transition-all hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Fale com a gente no WhatsApp
          </a>
        </CardFooter>
      </Card>
    </div>
  )
}
