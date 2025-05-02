import { metadata as metadataHome } from '@/app/layout'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
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
      className="from-primary to-tertiary flex flex-1 flex-col items-center justify-center gap-5 bg-gradient-to-b px-4 py-5"
    >
      <Text variant="headline-24-45-700" className="text-primary-foreground">
        Tela de login
      </Text>

      <Button variant="default">default button</Button>
      <Button variant="destructive">destructive button</Button>
      <Button variant="outline">outline button</Button>
      <Button variant="secondary">secondary button</Button>
      <Button variant="ghost">ghost button</Button>
      <Button variant="link">link button</Button>
    </div>
  )
}
