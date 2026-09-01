import { createEnv } from '@t3-oss/env-nextjs'
import { config } from 'dotenv'
import { z } from 'zod'

config()

export const env = createEnv({
  skipValidation: process.env.NODE_ENV === 'test',
  isServer: typeof window === 'undefined',
  client: {
    NEXT_PUBLIC_ADM_WEB_HOST: z.string(),
    NEXT_PUBLIC_BUCKET: z.string(),
    NEXT_PUBLIC_API_URL: z.string(),
    NEXT_PUBLIC_API_PORT: z.coerce.number().default(3334),
    NEXT_PUBLIC_MAINTENANCE_MODE: z.string().optional(),
    NEXT_PUBLIC_COOKIE_DOMAIN: z.string(),
  },
  server: {
    API_DOC_USER: z.string(),
    API_DOC_PASSWORD: z.string(),
    NODE_ENV: z.string(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_ADM_WEB_HOST: process.env.NEXT_PUBLIC_ADM_WEB_HOST,
    NEXT_PUBLIC_BUCKET: process.env.NEXT_PUBLIC_BUCKET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_PORT: process.env.NEXT_PUBLIC_API_PORT,
    NEXT_PUBLIC_MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE,
    NEXT_PUBLIC_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    API_DOC_USER: process.env.API_DOC_USER,
    API_DOC_PASSWORD: process.env.API_DOC_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  },
})
