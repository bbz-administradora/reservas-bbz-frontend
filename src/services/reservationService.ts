import {
  GetSpaceReservationStats200,
  ListSpaceReservations200,
  ListSpaceReservationsParams,
  ReservationCheckInOut200,
  WeeklyComplianceDetails200,
  WeeklyComplianceDetailsParams,
  WeeklyComplianceOverview200,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { env } from '@/infra/env'
import { getHeadersServer } from '@/lib/cookie'

export async function fetchSpaceReservationStatsInServer() {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getGetSpaceReservationStatsUrl = () => {
    return `${env.NEXT_PUBLIC_API_URL}/v1/private/reservation/stats`
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
      ? `${env.NEXT_PUBLIC_API_URL}/v1/private/reservation/list?${normalizedParams.toString()}`
      : `${env.NEXT_PUBLIC_API_URL}/v1/private/reservation/list`
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

export async function fetchReservationCheckInOutInServer(
  spaceId: string,
): Promise<ReservationCheckInOut200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getReservationCheckInOutUrl = (spaceId: string) => {
    return `${env.NEXT_PUBLIC_API_URL}/v1/private/reservation/check-in-out/${spaceId}`
  }

  const url = getReservationCheckInOutUrl(spaceId)

  const response = await customFetch<ReservationCheckInOut200>(url, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers,
  })

  return response.data
}

export async function fetchWeeklyComplianceOverviewInServer(): Promise<WeeklyComplianceOverview200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getWeeklyComplianceOverviewUrl = () => {
    return `${env.NEXT_PUBLIC_API_URL}/v1/private/reservations/weekly-compliance/overview`
  }

  const url = getWeeklyComplianceOverviewUrl()

  const response = await customFetch<WeeklyComplianceOverview200>(url, {
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

export async function fetchWeeklyComplianceDetailsInServer(
  params?: WeeklyComplianceDetailsParams,
): Promise<WeeklyComplianceDetails200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getWeeklyComplianceDetailsUrl = (
    params?: WeeklyComplianceDetailsParams,
  ) => {
    const normalizedParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        normalizedParams.append(key, value === null ? 'null' : value.toString())
      }
    })
    return normalizedParams.size
      ? `${env.NEXT_PUBLIC_API_URL}/v1/private/reservations/weekly-compliance/details?${normalizedParams.toString()}`
      : `${env.NEXT_PUBLIC_API_URL}/v1/private/reservations/weekly-compliance/details`
  }

  const url = getWeeklyComplianceDetailsUrl(params)

  const response = await customFetch<WeeklyComplianceDetails200>(url, {
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
