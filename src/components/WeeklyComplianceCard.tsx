import { WeeklyComplianceOverview200 } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { AlertCircle, CheckCircle2, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { CardDecoration } from './svg/card-decoration'
import { Text } from './Text'
import { Button } from './ui/button'

interface WeeklyComplianceCardProps {
  data: WeeklyComplianceOverview200 | null
}

export function WeeklyComplianceCard({ data }: WeeklyComplianceCardProps) {
  // Se não tem dados (usuário sem team position)
  if (!data) {
    return (
      <div className="bg-muted flex flex-col items-center gap-2.5 rounded-lg p-5 shadow-xl">
        <div className="relative flex items-center justify-center">
          <CardDecoration className="text-accent absolute bottom-[-15px] left-[-15px]" />
          <AlertCircle size={56} className="text-muted-foreground z-10" />
        </div>
        <Text
          variant="title-16-18-500"
          className="text-primary mt-4 text-center break-words"
        >
          Compliance Semanal
        </Text>
        <Text
          variant="title-18-24-700"
          className="text-muted-foreground text-center break-words"
        >
          Sem posição definida
        </Text>
        <Text
          variant="label-14-16-400"
          className="text-muted-foreground text-center text-xs"
        >
          Você não possui uma posição na equipe
        </Text>
      </div>
    )
  }

  // Card para colaborador (employee)
  if (data.userType === 'employee') {
    const isCompliant = data.isCompliant

    return (
      <div
        className={
          isCompliant
            ? 'flex flex-col items-center gap-2.5 rounded-lg bg-green-50 p-5 shadow-xl'
            : 'flex flex-col items-center gap-2.5 rounded-lg bg-red-50 p-5 shadow-xl'
        }
      >
        <div className="relative flex items-center justify-center">
          <CardDecoration
            className={
              isCompliant
                ? 'absolute bottom-[-15px] left-[-15px] text-green-500'
                : 'absolute bottom-[-15px] left-[-15px] text-red-500'
            }
          />
          {isCompliant ? (
            <CheckCircle2 size={56} className="text-primary z-10" />
          ) : (
            <AlertCircle size={56} className="text-primary z-10" />
          )}
        </div>
        <Text
          variant="title-16-18-500"
          className="text-primary mt-4 text-center break-words"
        >
          Compliance Semanal
        </Text>
        <Text
          variant="title-18-24-700"
          className="text-primary text-center break-words"
        >
          {isCompliant
            ? 'Tudo em dia!'
            : `Falta agendar ${data.missingDays} ${data.missingDays === 1 ? 'dia' : 'dias'}`}
        </Text>
        <Text
          variant="label-14-16-400"
          className="text-muted-foreground text-center text-xs"
        >
          {isCompliant
            ? `${data.reservedDays} dias agendados para próxima semana`
            : `${data.reservedDays} de ${data.requiredDays} dias agendados para próxima semana`}
        </Text>
      </div>
    )
  }

  // Card para supervisor
  if (data.userType === 'supervisor') {
    const { totalMembers, compliantMembers, nonCompliantMembers } =
      data.teamSummary
    const complianceRate =
      totalMembers > 0 ? (compliantMembers / totalMembers) * 100 : 0
    const allCompliant = nonCompliantMembers === 0

    return (
      <div
        className={
          allCompliant
            ? 'flex flex-col items-center gap-2.5 rounded-lg bg-green-50 p-5 shadow-xl'
            : 'flex flex-col items-center gap-2.5 rounded-lg bg-yellow-50 p-5 shadow-xl'
        }
      >
        <div className="relative flex items-center justify-center">
          <CardDecoration
            className={
              allCompliant
                ? 'absolute bottom-[-15px] left-[-15px] text-green-500'
                : 'absolute bottom-[-15px] left-[-15px] text-yellow-500'
            }
          />
          <UserCheck size={56} className="text-primary z-10" />
        </div>
        <Text
          variant="title-16-18-500"
          className="text-primary mt-4 text-center break-words"
        >
          Compliance da Equipe
        </Text>
        <Text
          variant="title-18-24-700"
          className="text-primary text-center break-words"
        >
          {complianceRate.toFixed(0)}% em dia
        </Text>
        <Text
          variant="label-14-16-400"
          className="text-muted-foreground text-center text-xs"
        >
          {compliantMembers} de {totalMembers} membros
        </Text>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link href="/espacos/compliance/equipe">Ver detalhes da equipe</Link>
        </Button>
      </div>
    )
  }

  // Card para diretor
  if (data.userType === 'director') {
    const { totalMembers, compliantMembers, nonCompliantMembers } =
      data.overallSummary
    const complianceRate =
      totalMembers > 0 ? (compliantMembers / totalMembers) * 100 : 0
    const allCompliant = nonCompliantMembers === 0

    return (
      <div
        className={
          allCompliant
            ? 'flex flex-col items-center gap-2.5 rounded-lg bg-green-50 p-5 shadow-xl'
            : 'flex flex-col items-center gap-2.5 rounded-lg bg-yellow-50 p-5 shadow-xl'
        }
      >
        <div className="relative flex items-center justify-center">
          <CardDecoration
            className={
              allCompliant
                ? 'absolute bottom-[-15px] left-[-15px] text-green-500'
                : 'absolute bottom-[-15px] left-[-15px] text-yellow-500'
            }
          />
          <Users size={56} className="text-primary z-10" />
        </div>
        <Text
          variant="title-16-18-500"
          className="text-primary mt-4 text-center break-words"
        >
          Compliance Geral
        </Text>
        <Text
          variant="title-18-24-700"
          className="text-primary text-center break-words"
        >
          {complianceRate.toFixed(0)}% em dia
        </Text>
        <Text
          variant="label-14-16-400"
          className="text-muted-foreground text-center text-xs"
        >
          {compliantMembers} de {totalMembers} colaboradores
        </Text>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link href="/espacos/compliance/geral">Ver detalhes gerais</Link>
        </Button>
      </div>
    )
  }

  return null
}
