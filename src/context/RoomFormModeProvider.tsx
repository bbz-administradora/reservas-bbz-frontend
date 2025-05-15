'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

export type FormMode = 'add' | 'edit' | 'image'

interface RoomFormModeContextValue {
  mode: FormMode
  setMode: (mode: FormMode) => void
  selectedRoomId: string | null
  setSelectedRoomId: (id: string | null) => void
  resetForm: boolean
  setResetForm: (reset: boolean) => void
}

const RoomFormModeContext = createContext<RoomFormModeContextValue | undefined>(
  undefined,
)

export function RoomFormModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<FormMode>('add')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [resetForm, setResetForm] = useState(false)

  return (
    <RoomFormModeContext.Provider
      value={{
        mode,
        setMode,
        selectedRoomId,
        setSelectedRoomId,
        resetForm,
        setResetForm,
      }}
    >
      {children}
    </RoomFormModeContext.Provider>
  )
}

export function useRoomFormMode(): RoomFormModeContextValue {
  const ctx = useContext(RoomFormModeContext)
  if (!ctx) {
    throw new Error(
      'useRoomFormMode must be used within a RoomFormModeProvider',
    )
  }
  return ctx
}
