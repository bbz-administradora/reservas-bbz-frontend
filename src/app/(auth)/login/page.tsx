import { metadata as metadataHome } from '@/app/layout'
import { Text } from '@/components/Text'
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
      <Text variant="headline-24-45-700">Tela de login</Text>
    </div>
  )
}
