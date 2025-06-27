// src/context/SpaceTypeProvider.tsx
'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

export type SpaceType = 'room' | 'workstation'

interface SpaceTypeContextValue {
  type: SpaceType
  setType: (type: SpaceType) => void
}

const SpaceTypeContext = createContext<SpaceTypeContextValue | undefined>(
  undefined,
)

export function SpaceTypeProvider({ children }: { children: ReactNode }) {
  const [type, setType] = useState<SpaceType>('room')

  return (
    <SpaceTypeContext.Provider value={{ type, setType }}>
      {children}
    </SpaceTypeContext.Provider>
  )
}

export function useSpaceType(): SpaceTypeContextValue {
  const ctx = useContext(SpaceTypeContext)
  if (!ctx) {
    throw new Error('useSpaceType must be used within a SpaceTypeProvider')
  }
  return ctx
}
