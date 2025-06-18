import { metadata as metadataHome } from '@/app/layout'
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'
import { LogoBbz } from '@/components/svg/logo-bbz'
import { Text } from '@/components/Text'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { webserver } from '@/infra/webserver'
import { fetchCurrentUserInServer } from '@/services/userService'
import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  ...metadataHome,
  title: 'Reserva de Salas BBZ - Esqueceu Senha',
  description: 'Recuperação de senha para Reserva de Salas BBZ',
}

export default async function EsqueceuSenha() {
  const { isAuthenticated } = await fetchCurrentUserInServer()

  if (isAuthenticated) {
    return redirect(`${webserver.host}/salas`)
  }

  return (
    <div
      id="main"
      className="from-primary to-tertiary flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-4 py-5"
    >
      {/* Card with forgot password form */}
      <Card className="bg-background w-full gap-5 border-none shadow-none md:max-w-md md:px-5 md:py-10 md:shadow-md">
        <CardHeader className="gap-6 p-0">
          <LogoBbz className="mx-auto" />
          <Text as="h1" variant={'title-22-32-700'} className="text-center">
            Esqueceu sua senha?
          </Text>
        </CardHeader>

        <CardContent className="mt-4">
          <ForgotPasswordForm className="mt-5" />
        </CardContent>

        <CardFooter className="mt-5 flex items-center justify-center gap-2">
          <Text className="">Lembrou a senha?</Text>
          <Link
            href={`${webserver.host}/login`}
            className="text-primary ring-offset-muted focus-visible:ring-ring/20 rounded-md font-bold transition-all hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Voltar ao login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
