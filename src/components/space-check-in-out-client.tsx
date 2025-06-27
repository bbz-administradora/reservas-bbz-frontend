'use client'

import { useReservationCheckInOut } from '@/api/endpoints/reservation/reservation'
import { Text } from '@/components/Text'
import {
  Bug,
  CalendarClock,
  CalendarX,
  CheckCheck,
  Clock,
  LogIn,
  LogOut,
  MapPinOff,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react'
import { useEffect } from 'react'
import { LoadingScreen } from './LoaderLogoSpin'

interface SpaceCheckInOutClientProps {
  spaceId: string
  spaceName: string
}

export function SpaceCheckInOutClient({
  spaceId,
  spaceName,
}: SpaceCheckInOutClientProps) {
  const {
    trigger: fetchCheckInOut,
    data,
    isMutating,
    error,
  } = useReservationCheckInOut(spaceId, {
    swr: {
      onError: (err) => {
        // Aqui você pode adicionar um toast ou log, se quiser
        // showToast({ message: 'Erro ao buscar status da reserva', variant: 'error' })
      },
    },
  })

  useEffect(() => {
    fetchCheckInOut(spaceId)
  }, [spaceId, fetchCheckInOut])

  function renderCheckInOutFeedback(message: string | undefined) {
    if (isMutating || typeof data === 'undefined') {
      return <LoadingScreen />
    }
    switch (message) {
      case 'Check-in realizado com sucesso':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <LogIn className="text-accent size-16" />
            <Text variant="title-22-32-700" className="text-accent">
              Check-in confirmado
            </Text>
            <Text variant="title-18-24-500">
              Você já está no controle deste espaço
            </Text>
            <Text variant="body-16-18-400">
              Seu check-in foi realizado com sucesso. Aproveite o ambiente e
              seus recursos com responsabilidade.
            </Text>
          </div>
        )
      case 'Check-out realizado com sucesso':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <LogOut className="text-accent size-16" />
            <Text variant="title-22-32-700" className="text-accent">
              Check-out concluído
            </Text>
            <Text variant="title-18-24-500">
              Esperamos que sua experiência tenha sido positiva
            </Text>
            <Text variant="body-16-18-400">
              Você encerrou o uso deste espaço. Obrigado por utilizá-lo de forma
              consciente.
            </Text>
          </div>
        )
      case 'Não há reservas para hoje neste espaço':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <CalendarX className="text-destructive size-16" />
            <Text variant="title-22-32-700" className="text-destructive">
              Nenhuma reserva para hoje
            </Text>
            <Text variant="title-18-24-500">
              Ops! Não encontramos sua reserva ativa
            </Text>
            <Text variant="body-16-18-400">
              Verifique se você tem uma reserva confirmada para hoje neste
              espaço.
            </Text>
          </div>
        )
      case 'Não foi encontrada reserva elegível para check-in ou check-out neste momento':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <Clock className="size-16 text-yellow-500" />
            <Text variant="title-22-32-700" className="text-yellow-500">
              Ação não permitida agora
            </Text>
            <Text variant="title-18-24-500">Fora da janela de horário</Text>
            <Text variant="body-16-18-400">
              O check-in pode ser feito <strong>15 minutos antes</strong> até 1
              hora após o início da reserva. O check-out pode ser feito até o
              final do dia.
            </Text>
          </div>
        )
      case 'Você não tem permissão para fazer check-in/check-out nesta reserva':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <ShieldAlert className="text-destructive size-16" />
            <Text variant="title-22-32-700" className="text-destructive">
              Acesso restrito
            </Text>
            <Text variant="title-18-24-500">
              Você não está autorizado para esta ação
            </Text>
            <Text variant="body-16-18-400">
              Apenas o responsável ou convidados autorizados podem realizar
              check-in ou check-out.
            </Text>
          </div>
        )
      case 'Você já realizou check-in e check-out para esta reserva':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <CheckCheck className="text-success size-16" />
            <Text variant="title-22-32-700" className="text-success">
              Reserva encerrada
            </Text>
            <Text variant="title-18-24-500">
              Nenhuma ação adicional necessária
            </Text>
            <Text variant="body-16-18-400">
              Você já completou o check-in e o check-out. Para usar o espaço
              novamente, agende uma nova reserva.
            </Text>
          </div>
        )
      case 'Registro de check-in não encontrado':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <Bug className="text-destructive size-16" />
            <Text variant="title-22-32-700" className="text-destructive">
              Erro no registro
            </Text>
            <Text variant="title-18-24-500">Check-in não localizado</Text>
            <Text variant="body-16-18-400">
              Não conseguimos localizar o check-in. Caso o erro persista, entre
              em contato com o suporte.
            </Text>
          </div>
        )
      case 'O check-out deve ser feito no mesmo dia do check-in':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <CalendarClock className="size-16 text-orange-600" />
            <Text variant="title-22-32-700" className="text-orange-600">
              Check-out inválido
            </Text>
            <Text variant="title-18-24-500">Data não compatível</Text>
            <Text variant="body-16-18-400">
              O check-out precisa ser feito no mesmo dia do check-in. Para
              esclarecimentos, contate a administração.
            </Text>
          </div>
        )
      case 'Não foi possível obter os detalhes atualizados da reserva':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <RefreshCcw className="text-destructive size-16 animate-spin" />
            <Text variant="title-22-32-700" className="text-destructive">
              Erro ao atualizar dados
            </Text>
            <Text variant="title-18-24-500">Algo deu errado</Text>
            <Text variant="body-16-18-400">
              Tentamos buscar os dados atualizados, mas ocorreu um erro. Tente
              novamente mais tarde.
            </Text>
          </div>
        )
      case 'Espaço não encontrado':
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <MapPinOff className="text-destructive size-16" />
            <Text variant="title-22-32-700" className="text-destructive">
              Espaço não localizado
            </Text>
            <Text variant="title-18-24-500">QR Code inválido?</Text>
            <Text variant="body-16-18-400">
              Verifique se o QR Code é válido ou se o espaço ainda está
              disponível.
            </Text>
          </div>
        )
      default:
        return (
          <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 text-center">
            <Bug className="text-destructive size-16" />
            <Text variant="title-22-32-700" className="text-destructive">
              Erro desconhecido
            </Text>
            <Text variant="title-18-24-500">Algo deu errado</Text>
            <Text variant="body-16-18-400">
              Não foi possível determinar o status da reserva. Tente novamente
              ou entre em contato com o suporte.
            </Text>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <Text
        variant={'headline-24-45-700'}
        className="text-primary text-center"
      >{`Sala ${spaceName}`}</Text>
      {isMutating && (
        <Text variant="body-16-18-400">Carregando status da reserva...</Text>
      )}
      {renderCheckInOutFeedback(data?.data?.message)}
    </div>
  )
}
