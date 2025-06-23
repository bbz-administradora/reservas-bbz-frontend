import { ListSpaceReservations200ReservationsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'

// Interface para representar reservas de espaços agrupadas
export interface GroupedReservation
  extends ListSpaceReservations200ReservationsItem {
  ids: string[] // Array com todos os IDs das reservas agrupadas
  // Acrescentamos campos para representar o intervalo completo
  groupSlotStart: string
  groupSlotEnd: string
}
