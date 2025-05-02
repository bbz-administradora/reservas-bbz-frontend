import { createJiti } from 'jiti'
import { fileURLToPath } from 'node:url'

// Used jiti to run env.ts and validate if the environment variables are ok before starting the build
const jiti = createJiti(fileURLToPath(import.meta.url))
await jiti.import('./src/infra/env.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: `${process.env.NEXT_PUBLIC_BUCKET.replace('https://', '')}`,
      },
    ],
  },
}

export default nextConfig
