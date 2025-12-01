import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Construction } from 'lucide-react'
import Link from 'next/link'

export default function TeamManagementPage() {
  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center justify-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="bg-muted rounded-full p-6">
          <Construction className="text-primary h-16 w-16" />
        </div>

        <Text variant="title-22-32-700" className="text-primary">
          Gestão de Equipe
        </Text>

        <Text
          variant="title-16-18-500"
          className="text-muted-foreground max-w-md"
        >
          Esta funcionalidade está em construção. Em breve você poderá gerenciar
          sua equipe de atendimento por aqui.
        </Text>

        <Button asChild className="mt-4">
          <Link href="/espacos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Espaços
          </Link>
        </Button>
      </div>
    </div>
  )
}
