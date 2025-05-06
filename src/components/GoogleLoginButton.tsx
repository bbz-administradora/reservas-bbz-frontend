'use client'

import { Button } from '@/components/ui/button'
import { loginWithGoogle } from '@/lib/googleAuth'
import { GoogleIcon } from './svg/google'

export function GoogleLoginButton() {
  return (
    <Button variant="outline" className="w-full" onClick={loginWithGoogle}>
      <GoogleIcon />
      Entrar com Google
    </Button>
  )
}
