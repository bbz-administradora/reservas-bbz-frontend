import { config as dotenvConfig } from 'dotenv'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'orval'

// Carregue o arquivo `.env`
dotenvConfig({
  path: ['.env'],
})

const fetchSwaggerJson = async () => {
  const url = `http://localhost:${process.env.NEXT_PUBLIC_API_PORT}/docs/json`
  const username = process.env.API_DOC_USER
  const password = process.env.API_DOC_PASSWORD

  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
    },
  })

  if (!response.ok) {
    throw new Error(`💥 Failed to fetch Swagger JSON: ${response.statusText}`)
  }

  const swaggerJson = await response.json()
  const outputPath = resolve(__dirname, 'swagger.json')

  await writeFile(outputPath, JSON.stringify(swaggerJson, null, 2), 'utf-8')

  return swaggerJson
}

export default (async () => {
  await fetchSwaggerJson()

  return defineConfig({
    'bbz-app-backend': {
      input: {
        target: 'swagger.json',
        filters: {
          mode: 'exclude',
          tags: [''],
        },
      },
      output: {
        baseUrl: '${process.env.NEXT_PUBLIC_API_URL}',
        mode: 'tags-split',
        target: '../../api/endpoints',
        client: 'swr',
        httpClient: 'fetch',
        override: {
          mutator: {
            path: '../../api/mutator/custom-fetch.ts',
            name: 'customFetch',
          },
        },
        headers: true,
        clean: true,
        prettier: true,
      },
      hooks: {
        afterAllFilesWrite: 'prettier --write',
      },
    },
  })
})()
