// src/utils/slotTableData.ts

import { GetSpaceSlotAvailability200SlotsItemUser } from '@/api/endpoints/bBZAppBackendAPI.schemas'

// Interface para células da tabela com informações de slots
export interface SlotCell {
  id?: string
  status: 'reserved' | 'pre_reserved' | 'available'
  preReservedUntil?: string | null
  // Campos da API
  slotStart?: string
  slotEnd?: string
  user?: GetSpaceSlotAvailability200SlotsItemUser | null
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
 * Agrupa e preenche "vazios" como disponíveis
 * Compatível com o formato original vindo da API (usando slotStart e slotEnd)
 */
export function prepareSlotTableData(rawSlots: any[]): SlotRow[] {
  // Extrair datas únicas dos slots
  const uniqueDates = new Set<string>()

  // Processar cada slot para extrair a data do slotStart
  rawSlots.forEach((slot) => {
    if (slot.slotStart) {
      // Extrair a data do formato ISO (YYYY-MM-DDT...)
      const date = new Date(slot.slotStart).toISOString().split('T')[0]
      uniqueDates.add(date)
    } else if (slot.date) {
      // Caso já tenha o campo date (compatibilidade com formato antigo)
      uniqueDates.add(slot.date)
    }
  })

  // Ordenar datas
  const dates = Array.from(uniqueDates).sort((a, b) => a.localeCompare(b))

  // Para cada data, criar uma linha na tabela
  return dates.map((date) => {
    // Iniciar com todos os slots disponíveis
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

    // Filtrar slots para a data atual
    const slotsForThisDate = rawSlots.filter((slot) => {
      if (slot.date) return slot.date === date
      if (slot.slotStart) {
        return new Date(slot.slotStart).toISOString().split('T')[0] === date
      }
      return false
    })

    // Preencher slots com dados
    slotsForThisDate.forEach((slot) => {
      // Determinar o horário do slot
      let time: string

      if (slot.time) {
        // Formato antigo já tem o campo time
        time = slot.time
      } else if (slot.slotStart) {
        // Extrair hora:minuto do slotStart
        const slotStartDate = new Date(slot.slotStart)
        const hours = slotStartDate.getHours().toString().padStart(2, '0')
        const minutes = slotStartDate.getMinutes().toString().padStart(2, '0')
        time = `${hours}:${minutes}`
      } else {
        return // Skip se não tiver informação de horário
      }

      // Verificar se o horário está na lista de TIME_SLOTS
      if (TIME_SLOTS.includes(time)) {
        row.slots[time] = {
          id: slot.id,
          status: slot.status === 'reserved' ? 'reserved' : 'pre_reserved',
          // Apenas o campo user (não existe mais preReservedBy)
          user: slot.user,
          preReservedUntil: slot.preReservedUntil,
          // Preservar campos originais
          slotStart: slot.slotStart,
          slotEnd: slot.slotEnd,
        }
      }
    })

    return row
  })
}

/**
 * Prepara os dados de slots para workstations agrupando em períodos de manhã (07:00-12:00) e tarde (13:00-20:00).
 * Para cada data, garante que ambos os períodos existam, preenchendo como 'available' se não houver slot correspondente.
 */
export function prepareWorkstationSlotTableData(rawSlots: any[]): SlotRow[] {
  // Extrair datas únicas dos slots
  const uniqueDates = new Set<string>()
  rawSlots.forEach((slot) => {
    if (slot.slotStart) {
      const date = new Date(slot.slotStart).toISOString().split('T')[0]
      uniqueDates.add(date)
    } else if (slot.date) {
      uniqueDates.add(slot.date)
    }
  })
  const dates = Array.from(uniqueDates).sort((a, b) => a.localeCompare(b))

  // Para cada data, criar uma linha na tabela
  return dates.map((date) => {
    // Iniciar com ambos os períodos disponíveis
    const row: SlotRow = {
      date,
      slots: {
        morning: { status: 'available' },
        afternoon: { status: 'available' },
      },
    }

    // Filtrar slots para a data atual
    const slotsForThisDate = rawSlots.filter((slot) => {
      if (slot.date) return slot.date === date
      if (slot.slotStart) {
        return new Date(slot.slotStart).toISOString().split('T')[0] === date
      }
      return false
    })

    // Preencher slot da manhã, se existir
    const morningSlot = slotsForThisDate.find((slot) => {
      if (!slot.slotStart || !slot.slotEnd) return false
      const start = new Date(slot.slotStart)
      const end = new Date(slot.slotEnd)
      return start.getHours() === 7 && end.getHours() === 12
    })
    if (morningSlot) {
      row.slots.morning = {
        id: morningSlot.id,
        status: morningSlot.status,
        preReservedUntil: morningSlot.preReservedUntil,
        slotStart: morningSlot.slotStart,
        slotEnd: morningSlot.slotEnd,
        user: morningSlot.user,
      }
    }

    // Preencher slot da tarde, se existir
    const afternoonSlot = slotsForThisDate.find((slot) => {
      if (!slot.slotStart || !slot.slotEnd) return false
      const start = new Date(slot.slotStart)
      const end = new Date(slot.slotEnd)
      return start.getHours() === 13 && end.getHours() === 18
    })
    if (afternoonSlot) {
      row.slots.afternoon = {
        id: afternoonSlot.id,
        status: afternoonSlot.status,
        preReservedUntil: afternoonSlot.preReservedUntil,
        slotStart: afternoonSlot.slotStart,
        slotEnd: afternoonSlot.slotEnd,
        user: afternoonSlot.user,
      }
    }

    return row
  })
}
