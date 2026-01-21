import { Text } from '@/components/Text'
import { Construction } from 'lucide-react'

export default function ComplianceGeralPage() {
  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      <div className="mt-20 flex flex-col items-center justify-center gap-6">
        <Construction size={120} />
        <Text
          variant="headline-24-45-700"
          className="text-primary text-center break-words"
        >
          Página em Construção
        </Text>
        <Text
          variant="body-16-18-400"
          className="text-muted-foreground max-w-md text-center"
        >
          A visualização detalhada do compliance geral de todos os colaboradores
          está sendo desenvolvida e estará disponível em breve.
        </Text>
      </div>
    </div>
  )
}
