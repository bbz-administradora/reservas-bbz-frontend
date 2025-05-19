// src/services/roomSlotService.ts

import {
  ListRoomSlots200,
  ListRoomSlotsParams,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { getHeadersServer } from '@/lib/cookie'

export async function fetchAvailableRoomsInServer(
  params?: ListRoomSlotsParams,
) {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const getListRoomSlotsUrl = (params?: ListRoomSlotsParams) => {
    const normalizedParams = new URLSearchParams()

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        normalizedParams.append(key, value === null ? 'null' : value.toString())
      }
    })

    return normalizedParams.size
      ? `${process.env.NEXT_PUBLIC_API_URL}/v1/private/room-slot/list?${normalizedParams.toString()}`
      : `${process.env.NEXT_PUBLIC_API_URL}/v1/private/room-slot/list`
  }
  const url = getListRoomSlotsUrl(params)

  const response = await customFetch<ListRoomSlots200>(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
    next: {
      tags: ['delete-room', 'update-room', 'create-room', 'update-room-image'],
    },
  })

  if (response.status === 200) {
    return response.data
  }

  return null
}
