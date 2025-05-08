'use server'

import { revalidateTag } from 'next/cache'

// Iterates over the provided tags and revalidates each tag concurrently.
export async function revalidateTags(tags: string[]): Promise<void> {
  await Promise.all(tags.map((tag) => revalidateTag(tag)))
}
