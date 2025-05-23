'use client'

import {
  ListRoomSlots200,
  ListRoomSlotsParams,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { useListRoomSlots } from '@/api/endpoints/room-slot/room-slot'
import { DatePickerWithButton } from '@/components/DatePickerWithButton'
import { RoomCard } from '@/components/RoomCard'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/mergeClassNames'
import { format } from 'date-fns'
import { ClockIcon, XIcon } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { Text } from './Text'

interface RoomExplorerProps {
  initialData: ListRoomSlots200 | null
  className?: string
  mostUsedTimes?: string[]
}

export function RoomExplorer({
  initialData,
  className,
  mostUsedTimes = ['10:00', '14:00', '16:00'],
}: RoomExplorerProps) {
  // Função para garantir que a data seja sempre hoje ou no futuro
  const ensureDateIsNotPast = (date: Date | undefined): Date => {
    if (!date) return new Date()

    // Comparar apenas as datas, ignorando o horário
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date < today) {
      return today
    }
    return date
  }

  const [date, setDate] = useState<Date | undefined>(
    ensureDateIsNotPast(new Date()),
  )
  const [timeSlot, setTimeSlot] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  // Intercepta a alteração da data para garantir que não seja uma data passada
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(ensureDateIsNotPast(newDate))
  }

  // Prepare filter params
  // Formato da data para exibição no UI
  const formattedDate = date
    ? format(date, 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')

  // Função para criar uma string ISO8601 consistente com timezone fixo -03:00
  const createISODateString = (
    baseDate: Date,
    hour?: number,
    minute?: number,
  ): string => {
    // Extraio os componentes da data
    const year = baseDate.getFullYear()
    const month = String(baseDate.getMonth() + 1).padStart(2, '0')
    const day = String(baseDate.getDate()).padStart(2, '0')

    // Determino a hora e minuto, com padrão para 00:00 se não especificados
    const hourStr = hour !== undefined ? String(hour).padStart(2, '0') : '00'
    const minuteStr =
      minute !== undefined ? String(minute).padStart(2, '0') : '00'

    // Monto a string ISO manualmente, sem depender de conversões automáticas
    // que podem causar problemas com timezone
    return `${year}-${month}-${day}T${hourStr}:${minuteStr}:00.000-03:00`
  }

  // Formato base ISO8601 para a data com horário 00:00:00
  const formattedDateTime = date
    ? createISODateString(date)
    : createISODateString(new Date())

  // Se tiver timeSlot selecionado (formato 'HH:MM'), extrai a hora e minutos
  const datetimeWithTimeSlot = timeSlot
    ? (() => {
        const [hours, minutes] = timeSlot.split(':').map(Number)
        const baseDate = date || new Date()
        return createISODateString(baseDate, hours, minutes)
      })()
    : formattedDateTime

  // Create params object for API call
  const params: ListRoomSlotsParams = {
    datetime: datetimeWithTimeSlot,
    page: currentPage.toString(),
    pageSize: itemsPerPage.toString(),
  }

  // Use the hook with initial data to avoid flickering
  const { data, isLoading, error } = useListRoomSlots(params, {
    swr: {
      fallbackData: initialData
        ? {
            data: initialData,
            status: 200,
            headers: new Headers(),
          }
        : undefined,
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 30000, // 30 seconds
    },
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [formattedDate, timeSlot])

  const handleTimeSelect = useCallback(
    (time: string) => {
      setTimeSlot(time === timeSlot ? '' : time) // Toggle time selection
    },
    [timeSlot],
  )

  // Get the data from the hook result
  const roomsData = data?.data
  const totalPages = roomsData?.totalPages || 1
  const totalCount = roomsData?.totalCount || 0

  // Extract rooms from data
  const currentRooms = roomsData?.rooms || []

  // Determine if we should show loading state
  const showLoading = isLoading && (!currentRooms || currentRooms.length === 0)

  return (
    <div className={cn('flex w-full flex-col gap-6', className)}>
      {/* Filter section */}
      <div className="flex flex-col items-center justify-center gap-4 lg:flex-row">
        <DatePickerWithButton
          date={date}
          setDate={handleDateChange}
          className="w-full lg:w-min"
        />

        {/* Time slot selection */}
        <div className="flex w-full gap-2 lg:w-min">
          <Select value={timeSlot} onValueChange={setTimeSlot}>
            <SelectTrigger className="bg-background hover:bg-accent data-[placeholder]:hover:text-accent-foreground hover:text-accent-foreground hover:[&_svg]:stroke-accent-foreground w-full transition-colors lg:w-min [&_svg]:stroke-3">
              <SelectValue placeholder="Horário" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 14 }, (_, i) => i + 7)
                .filter((hour) => hour <= 20)
                .map((hour) => (
                  <SelectItem key={hour} value={`${hour}:00`}>
                    {`${hour}:00`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {timeSlot && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeSlot('')}
              className="text-destructive h-9 px-2 lg:px-3"
            >
              Reset
              <XIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Most used times section */}
        <div className="my-5 flex w-full flex-col items-center justify-center gap-2.5 md:flex-row md:justify-start lg:justify-end">
          <div className="flex w-full items-center justify-center gap-2.5 md:w-min">
            {mostUsedTimes.map((time) => (
              <Button
                key={time}
                size="sm"
                onClick={() => handleTimeSelect(time)}
                variant={'outline'}
                className={
                  timeSlot === time
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-accent text-accent-foreground hover:bg-accent/80'
                }
              >
                <ClockIcon className="mr-1 h-4 w-4" />
                {time}
              </Button>
            ))}
          </div>
          <Text className="text-muted-foreground">
            Horários mais utilizados por você.
          </Text>
        </div>
      </div>

      {/* Room cards grid with loading state */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {showLoading ? (
          // Placeholder loading state
          Array.from({ length: itemsPerPage }).map((_, idx) => (
            <div
              key={idx}
              className="bg-muted/40 h-[350px] animate-pulse rounded-lg"
            ></div>
          ))
        ) : currentRooms.length > 0 ? (
          currentRooms.map((room) => (
            <RoomCard key={room.id} {...room} date={date} />
          ))
        ) : (
          <div className="col-span-3 flex h-40 w-full items-center justify-center">
            <Text className="text-muted-foreground">
              {error
                ? 'Erro ao carregar as salas. Tente novamente mais tarde.'
                : `Nenhuma sala disponível ${timeSlot ? `às ${timeSlot}` : ''} em ${formattedDate}.`}
            </Text>
          </div>
        )}
      </div>

      {/* Summary information */}
      {!showLoading && currentRooms.length > 0 && (
        <Text className="text-muted-foreground text-sm">
          Exibindo {currentRooms.length} sala
          {currentRooms.length !== 1 ? 's' : ''}
          {timeSlot ? ` às ${timeSlot}` : ''} em {formattedDate}
          {totalCount > currentRooms.length ? ` (${totalCount} no total)` : ''}
        </Text>
      )}

      {/* Pagination */}
      {!showLoading && currentRooms.length > 0 && totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>

            {/* Render pagination links intelligently */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Always show first, last, current, and pages adjacent to current
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                )
              })
              .map((page, index, array) => {
                // Add ellipsis between non-consecutive pages
                const prevPage = array[index - 1]
                const showEllipsis = prevPage && page - prevPage > 1

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                )
              })}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
