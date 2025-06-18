import { metadata as metadataHome } from '@/app/layout'
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm'
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
  title: 'Reserva de Salas BBZ - Redefinir Senha',
  description: 'Redefinição de senha para Reserva de Salas BBZ',
}

type Params = Promise<{
  userId: string
  token: string
}>

interface ResetPasswordPageProps {
  params: Params
}

export default async function RedefinirSenha({
  params,
}: ResetPasswordPageProps) {
  const { userId, token } = await params
  const { isAuthenticated } = await fetchCurrentUserInServer()

  if (isAuthenticated) {
    return redirect(`${webserver.host}/salas`)
  }

  return (
    <div
      id="main"
      className="from-primary to-tertiary flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-4 py-5"
    >
      {/* Card com formulário de redefinição de senha */}
      <Card className="bg-background w-full gap-5 border-none shadow-none md:max-w-md md:px-5 md:py-10 md:shadow-md">
        <CardHeader className="gap-6 p-0">
          <LogoBbz className="mx-auto" />
          <Text as="h1" variant={'title-22-32-700'} className="text-center">
            Defina uma nova senha
          </Text>
        </CardHeader>

        <CardContent className="mt-4">
          <Text className="mb-8 text-center">
            Digite sua nova senha nos campos abaixo para recuperar o acesso à
            sua conta.
          </Text>
          <ResetPasswordForm userId={userId} token={token} className="mt-5" />
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
