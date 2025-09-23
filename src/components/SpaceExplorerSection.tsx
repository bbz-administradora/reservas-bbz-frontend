// src/components/SpaceExplorerSection.tsx
'use client'

import { ListSpaceSlots200 } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { SpaceRoomExplorer } from '@/components/SpaceRoomExplorer'
import { SpaceWorkstationExplorer } from '@/components/SpaceWorkstationExplorer'
import { Text } from '@/components/Text'
import { useSpaceType } from '@/context/SpaceTypeProvider'
import { cn } from '@/utils/mergeClassNames'

interface SpaceExplorerSectionProps {
  initialData: ListSpaceSlots200 | null
  mostUsedTimes: string[]
  className?: string
}

export function SpaceExplorerSection({
  initialData,
  mostUsedTimes,
  className,
}: SpaceExplorerSectionProps) {
  const { type, setType } = useSpaceType()

  // Aqui futuramente vamos alternar entre room e workstation

  return (
    <div className={`my-4 w-full ${className ?? ''}`}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setType('room')}
          className={cn(
            'cursor-pointer rounded py-1 pr-3 font-medium transition-opacity',
            type === 'room'
              ? 'text-primary opacity-100'
              : 'text-primary opacity-50',
          )}
        >
          <Text
            variant={'title-22-32-700'}
            className={type === 'room' ? 'opacity-100' : 'opacity-50'}
          >
            Explorar Salas
          </Text>
        </button>
        <button
          type="button"
          onClick={() => setType('workstation')}
          className={cn(
            'cursor-pointer rounded px-3 py-1 font-medium transition-opacity',
            type === 'workstation'
              ? 'text-primary opacity-100'
              : 'text-primary opacity-50',
          )}
        >
          <Text
            variant={'title-22-32-700'}
            className={type === 'workstation' ? 'opacity-100' : 'opacity-50'}
          >
            Explorar Estações de trabalho
          </Text>
        </button>
      </div>
      {type === 'room' ? (
        <>
          <Text className="mt-2.5 max-w-3xl">
            Filtre as salas por data e horário disponível, toque em um de seus
            períodos mais usados para agilizar ou simplesmente role os cards
            abaixo e clique na sala desejada para reservar.
          </Text>
          <SpaceRoomExplorer
            initialData={initialData}
            mostUsedTimes={mostUsedTimes}
            className="pt-5"
          />
        </>
      ) : (
        <>
          <Text className="mt-2.5 max-w-3xl">
            Filtre por data e andar desejado, depois navegue entre as seções
            disponíveis e visualize todas as posições de trabalho organizadas
            por local. Escolha a estação ideal para seu momento e toque para
            reservar com rapidez.
          </Text>
          <SpaceWorkstationExplorer className="pt-5" />
        </>
      )}
    </div>
  )
}
