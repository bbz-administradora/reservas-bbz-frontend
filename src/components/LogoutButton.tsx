'use client'

import { revalidateTags } from '@/actions/revalidate-tags'
import { useLogoutUser } from '@/api/endpoints/auth/auth'
import { Text } from '@/components/Text'
import { Button } from '@/components/ui/button'
import { webserver } from '@/infra/webserver'
import { cn } from '@/utils/mergeClassNames'
import { LogOutIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { showToast } from './ShowToast'

interface LogoutButtonProps {
  variant?: 'default' | 'bottom-bar'
  className?: string
}

export function LogoutButton({
  variant = 'default',
  className,
}: LogoutButtonProps) {
  const router = useRouter()

  const { trigger: logout, isMutating: isLoggingOut } = useLogoutUser()

  async function revalidateTag() {
    await revalidateTags(['auth'])
  }

  async function handleLogout() {
    try {
      const response = await logout()
      showToast({
        message: response.data.message,
        variant: 'success',
        duration: 3000,
      })

      router.push(`${webserver.host}/login`)
      revalidateTag()
    } catch (error) {
      console.error('Logout error:', error)
      showToast({
        message: 'Erro ao efetuar logout. Tente novamente mais tarde.',
        variant: 'error',
        duration: Infinity,
      })
    }
  }

  if (variant === 'bottom-bar') {
    return (
      <button
        onClick={handleLogout}
        title="Sair da aplicação"
        className={cn(
          'group ring-offset-secondary focus-visible:ring-primary flex min-h-[60px] min-w-[60px] flex-col items-center justify-center gap-1 rounded-md p-1.5 transition-all focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          className,
        )}
      >
        <div className="text-secondary-foreground">
          <LogOutIcon className="size-5" />
        </div>
        <Text variant="label-14-14-400" className="text-secondary-foreground">
          Sair
        </Text>
      </button>
    )
  }

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      size="icon"
      title="Sair da aplicação"
      className={cn('lg:cursor-pointer', className)}
    >
      <LogOutIcon className="size-5" />
    </Button>
  )
}
