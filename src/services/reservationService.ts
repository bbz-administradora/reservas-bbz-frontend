import { GetRoomReservationStats200 } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

const getGetRoomReservationStatsUrl = () => {
  return `${process.env.NEXT_PUBLIC_API_URL}/v1/private/reservation/stats`
}

export async function fetchRoomReservationStatsInServer() {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
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
