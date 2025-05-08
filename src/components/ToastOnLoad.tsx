'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { showToast } from './ShowToast'

// possíveis variantes de toast
type ToastVariant = 'error' | 'success' | 'warning' | 'info' | 'none'

interface ToastOnLoadProps {
  statusCode?: string
}

export function ToastOnLoad({ statusCode }: ToastOnLoadProps) {
  useEffect(() => {
    if (statusCode == null) return

    let message = ''
    let variant: ToastVariant = 'info'

    switch (parseInt(statusCode, 10)) {
      case 200:
        message = 'Login realizado com sucesso!'
        variant = 'success'

        revalidateTags(['auth'])

        break
      case 500:
        message = 'Erro não processado, tente repetir o login.'
        variant = 'error'
        break
      case 403:
        message =
          'Não é possível realizar o login. Entre em contato com o suporte para mais informações.'
        variant = 'warning'
        break
      default:
        message =
          'Não foi possível realizar o login. Por favor, autorize o acesso com o Google ou procure o suporte, por gentileza.'
        variant = 'error'
        break
    }

    showToast({ message, variant })
  }, [statusCode])

  return (
    <Toaster
      toastOptions={{
        style: {
          justifyContent: 'center',
        },
      }}
    />
  )
}
