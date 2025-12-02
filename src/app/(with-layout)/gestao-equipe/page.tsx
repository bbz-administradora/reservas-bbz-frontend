import { DataTableSupervisors } from '@/components/data-table/supervisors/table-supervisors'
import { SupervisorAddForm } from '@/components/forms/SupervisorAddForm'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { fetchListSupervisorsInServer } from '@/services/teamService'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

export default async function TeamManagementPage() {
  const supervisorsData = await fetchListSupervisorsInServer()

  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Header com botão de voltar */}
      <div className="flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/espacos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Users className="text-primary h-6 w-6" />
            <Text variant={'title-22-32-700'}>Gestão de Equipe</Text>
          </div>
        </div>

        <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-2">
          <Text variant={'title-16-18-500'} className="text-muted-foreground">
            Supervisores:
          </Text>
          <Text variant={'title-18-24-700'} className="text-primary">
            {supervisorsData?.totalCount || 0}
          </Text>
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-muted/50 w-full max-w-6xl rounded-lg p-4">
        <Text variant={'title-14-16-500'} className="text-muted-foreground">
          Gerencie os supervisores da sua equipe de atendimento. Supervisores
          são responsáveis por auxiliar na gestão dos espaços e podem ser
          nomeados ou removidos a qualquer momento.
        </Text>
      </div>

      {/* Tabela de supervisores */}
      <div className="w-full max-w-6xl">
        {supervisorsData && supervisorsData.supervisors.length > 0 ? (
          <DataTableSupervisors
            initialData={supervisorsData.supervisors}
            className="mb-5"
          />
        ) : (
          <div className="bg-muted/30 flex flex-col items-center justify-center rounded-lg py-12">
            <Users className="text-muted-foreground mb-4 h-12 w-12" />
            <Text
              variant={'title-18-24-700'}
              className="text-muted-foreground mb-2"
            >
              Nenhum supervisor nomeado
            </Text>
            <Text variant={'title-14-16-500'} className="text-muted-foreground">
              Use o formulário abaixo para nomear o primeiro supervisor da
              equipe.
            </Text>
          </div>
        )}
      </div>

      <Separator className="bg-primary w-full max-w-6xl" />

      {/* Formulário de adicionar supervisor */}
      <SupervisorAddForm className="w-full max-w-6xl" />
    </div>
  )
}
