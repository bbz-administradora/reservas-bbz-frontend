import { metadata as metadataHome } from '@/app/layout'
import { GoogleIcon } from '@/components/svg/google'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
        <CardHeader className="p-0">
          <Text as="h1" variant={'title-22-32-700'} className="text-center">
            Acesse o sistema de Reserva de Salas BBZ
          </Text>
        </CardHeader>
        <CardContent className="gap-5 space-y-5">
          <Text className="text-center">
            Para entrar, clique no botão abaixo e faça login com sua conta
            Google.
          </Text>

          <Button variant="outline" className="w-full">
            <GoogleIcon />
            Entrar com Google
          </Button>

          <Text
            variant={'label-14-14-400'}
            className="text-muted-foreground text-center"
          >
            Importante: você precisa ter uma conta autorizada pela BBZ para
            acessar o sistema.
          </Text>
        </CardContent>
      </Card>
    </div>
  )
}
