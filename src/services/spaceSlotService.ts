// src/services/spaceSlotService.ts

import {
  GetSpaceSlotAvailability200,
  GetSpaceSlotAvailabilityParams,
  ListSpaceSlots200,
  ListSpaceSlotsParams,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

export async function fetchAvailableSpacesInServer(
  params?: ListSpaceSlotsParams,
) {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getListSpaceSlotsUrl = (params?: ListSpaceSlotsParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        normalizedParams.append(key, value === null ? 'null' : value.toString())
      }
    })

    return normalizedParams.size
      ? `${process.env.NEXT_PUBLIC_API_URL}/v1/private/space-slot/list?${normalizedParams.toString()}`
      : `${process.env.NEXT_PUBLIC_API_URL}/v1/private/space-slot/list`
  }
  const url = getListSpaceSlotsUrl(params)

  const response = await customFetch<ListSpaceSlots200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: [
        'delete-space',
        'update-space',
        'create-space',
        'update-space-image',
      ],
    },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}

export async function fetchAvailableSpaceSlotsBySpace(
  spaceId: string,
  params: GetSpaceSlotAvailabilityParams,
) {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getGetSpaceSlotAvailabilityUrl = (
    spaceId: string,
    params: GetSpaceSlotAvailabilityParams,
  ) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        normalizedParams.append(key, value === null ? 'null' : value.toString())
      }
    })

    return normalizedParams.size
      ? `${process.env.NEXT_PUBLIC_API_URL}/v1/private/space-slot/${spaceId}/availability?${normalizedParams.toString()}`
      : `${process.env.NEXT_PUBLIC_API_URL}/v1/private/space-slot/${spaceId}/availability`
  }
  const url = getGetSpaceSlotAvailabilityUrl(spaceId, params)

  const response = await customFetch<GetSpaceSlotAvailability200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: [
        'delete-space',
        'update-space',
        'create-space',
        'update-space-image',
      ],
    },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}
