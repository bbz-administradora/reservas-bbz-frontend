// src/utils/slotTableData.ts
import { GetRoomSlotAvailability200SlotsItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'

export interface SlotCell {
  id?: string
  status: 'reserved' | 'pre_reserved' | 'available'
  preReservedBy?: { id: string; name: string; email: string } | null
  preReservedUntil?: string | null
}

export interface SlotRow {
  date: string // ex: '2025-05-20'
  slots: Record<string, SlotCell> // ex: { '07:00': SlotCell, '08:00': SlotCell, … }
}

// os horários fixos que viram colunas
export const TIME_SLOTS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
]

/**
 * Cria uma linha de slots vazia para uma data específica
 */
export function createEmptySlotRow(date: string): SlotRow {
  return {
    date,
    slots: TIME_SLOTS.reduce(
      (acc, time) => {
        acc[time] = { status: 'available' }
        return acc
      },
      {} as Record<string, SlotCell>,
    ),
  }
}

/**
 * Agrupa e preenche “vazios” como disponíveis
 */
export function prepareSlotTableData(
  rawSlots: GetRoomSlotAvailability200SlotsItem[],
): SlotRow[] {
  // 1) Descobre todas as datas em rawSlots, ordena ascendente
  const dates = Array.from(new Set(rawSlots.map((s) => s.date))).sort((a, b) =>
    a.localeCompare(b),
  )

  // 2) Para cada data, inicializa um objeto com todos os horários como “available”
  return dates.map((date) => {
    const row: SlotRow = {
      date,
      slots: TIME_SLOTS.reduce(
        (acc, time) => {
          acc[time] = { status: 'available' }
          return acc
        },
        {} as Record<string, SlotCell>,
      ),
    }

    // 3) Preenche cada slot que existe em rawSlots
    rawSlots
      .filter((s) => s.date === date)
      .forEach((s) => {
        row.slots[s.time] = {
          id: s.id,
          status: s.status === 'reserved' ? 'reserved' : 'pre_reserved',
          preReservedBy: s.preReservedBy,
          preReservedUntil: s.preReservedUntil,
        }
      })

    return row
  })
}
