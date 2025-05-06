import { env } from '@/infra/env'

export const loginWithGoogle = () => {
  window.location.href = `${env.NEXT_PUBLIC_API_URL}/v1/public/auth/login/google`
}
