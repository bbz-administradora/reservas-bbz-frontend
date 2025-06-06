import { UserMe200User } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { Text } from '@/components/Text'
import {
  CalendarCheck2Icon,
  CalendarClockIcon,
  CalendarIcon,
  CalendarX2Icon,
} from 'lucide-react'

interface LegendProps {
  user: UserMe200User | null
}

export function RoomSlotsLegend({ user }: LegendProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-end">
      {user?.role !== 'user' ? (
        <div className="flex h-10 items-center justify-center gap-2.5 rounded-lg px-2">
          <CalendarX2Icon className="text-destructive" />
          <Text variant="button-14-14-500">Reservado (Cancelável)</Text>
        </div>
      ) : (
        <div className="flex h-10 items-center justify-center gap-2.5 rounded-lg px-2">
          <CalendarX2Icon className="text-muted" />
          <Text variant="button-14-14-500">Indisponível</Text>
        </div>
      )}

      <div className="flex h-10 items-center justify-center gap-2.5 rounded-lg px-2">
        <CalendarIcon className="text-secondary-foreground" />
        <Text variant="button-14-14-500" className="text-secondary-foreground">
          Disponível
        </Text>
      </div>

      <div className="bg-secondary/30 flex h-10 items-center justify-center gap-2.5 rounded-lg px-2">
        <CalendarCheck2Icon className="text-secondary-foreground" />
        <Text variant="button-14-14-500" className="text-secondary-foreground">
          Sua reserva
        </Text>
      </div>

      <div className="bg-warning/20 flex h-10 items-center justify-center gap-2.5 rounded-lg px-2">
        <CalendarClockIcon className="text-yellow-500" />
        <Text variant="button-14-14-500" className="text-secondary-foreground">
          Pré-reservado
        </Text>
      </div>
    </div>
  )
}
