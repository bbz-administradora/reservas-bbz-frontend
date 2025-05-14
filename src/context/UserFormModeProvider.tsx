// src/context/UserFormModeProvider.tsx
'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

export type FormMode = 'add' | 'edit'

interface UserFormModeContextValue {
  mode: FormMode
  setMode: (mode: FormMode) => void
  selectedUserId: string | null
  setSelectedUserId: (id: string | null) => void
}

const UserFormModeContext = createContext<UserFormModeContextValue | undefined>(
  undefined,
)

export function UserFormModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<FormMode>('add')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  return (
    <UserFormModeContext.Provider
      value={{ mode, setMode, selectedUserId, setSelectedUserId }}
    >
      {children}
    </UserFormModeContext.Provider>
  )
}

export function useUserFormMode(): UserFormModeContextValue {
  const ctx = useContext(UserFormModeContext)
  if (!ctx) {
    throw new Error(
      'useUserFormMode must be used within a UserFormModeProvider',
    )
  }
  return ctx
}
