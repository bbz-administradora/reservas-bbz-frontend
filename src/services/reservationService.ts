import {
  GetRoomReservationStats200,
  ListRoomReservations200,
  ListRoomReservationsParams,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

export async function fetchRoomReservationStatsInServer() {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getGetRoomReservationStatsUrl = () => {
    return `${process.env.NEXT_PUBLIC_API_URL}/v1/private/reservation/stats`
  }

  const url = getGetRoomReservationStatsUrl()

  const response = await customFetch<GetRoomReservationStats200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: ['create-reservation', 'close-reservation', 'cancel-reservation'],
    },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}

export async function fetchListRoomReservationsInServer(
  params?: ListRoomReservationsParams,
): Promise<ListRoomReservations200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getListRoomReservationsUrl = (params?: ListRoomReservationsParams) => {
    const normalizedParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        normalizedParams.append(key, value === null ? 'null' : value.toString())
      }
    })
    return normalizedParams.size
      ? `${process.env.NEXT_PUBLIC_API_URL}/v1/private/reservation/list?${normalizedParams.toString()}`
      : `${process.env.NEXT_PUBLIC_API_URL}/v1/private/reservation/list`
  }

  const url = getListRoomReservationsUrl(params)

  const response = await customFetch<ListRoomReservations200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: [
        'create-reservation',
        'close-reservation',
        'cancel-reservation',
        'delete-room',
        'update-room',
        'create-room',
        'delete-user',
        'update-user',
        'create-user',
      ],
    },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}
