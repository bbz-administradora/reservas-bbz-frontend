'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

export type FormMode = 'add' | 'edit' | 'image'

interface SpaceFormModeContextValue {
  mode: FormMode
  setMode: (mode: FormMode) => void
  selectedSpaceId: string | null
  setSelectedSpaceId: (id: string | null) => void
  resetForm: boolean
  toggleResetForm: () => void
}

const SpaceFormModeContext = createContext<SpaceFormModeContextValue | undefined>(
  undefined,
)

export function SpaceFormModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<FormMode>('add')
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [resetForm, setResetForm] = useState<boolean>(false)

  // Função para alternar resetForm
  const toggleResetForm = () => {
    setResetForm((prev) => !prev)
  }

  return (
    <SpaceFormModeContext.Provider
      value={{
        mode,
        setMode,
        selectedSpaceId,
        setSelectedSpaceId,
        resetForm,
        toggleResetForm,
      }}
    >
      {children}
    </SpaceFormModeContext.Provider>
  )
}

export function useSpaceFormMode(): SpaceFormModeContextValue {
  const ctx = useContext(SpaceFormModeContext)
  if (!ctx) {
    throw new Error(
      'useSpaceFormMode must be used within a SpaceFormModeProvider',
    )
  }
  return ctx
}
