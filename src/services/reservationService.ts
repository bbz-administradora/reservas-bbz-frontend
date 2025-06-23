import {
  GetSpaceReservationStats200,
  ListSpaceReservations200,
  ListSpaceReservationsParams,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

export async function fetchSpaceReservationStatsInServer() {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getGetSpaceReservationStatsUrl = () => {
    return `${process.env.NEXT_PUBLIC_API_URL}/v1/private/reservation/stats`
  }

  const url = getGetSpaceReservationStatsUrl()

  const response = await customFetch<GetSpaceReservationStats200>(url, {
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

export async function fetchListSpaceReservationsInServer(
  params?: ListSpaceReservationsParams,
): Promise<ListSpaceReservations200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getListSpaceReservationsUrl = (
    params?: ListSpaceReservationsParams,
  ) => {
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

  const url = getListSpaceReservationsUrl(params)

  const response = await customFetch<ListSpaceReservations200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: [
        'create-reservation',
        'close-reservation',
        'cancel-reservation',
        'delete-space',
        'update-space',
        'create-space',
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
