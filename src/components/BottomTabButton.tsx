'use client'

import { webserver } from '@/infra/webserver'
import { cn } from '@/utils/mergeClassNames'
import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import { Text } from './Text'

interface BottomTabButtonProps extends LinkProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function BottomTabButton({
  label,
  children,
  className,
  ...props
}: BottomTabButtonProps) {
  const pathname = usePathname()
  const href = props.href.toString().replace(webserver.host, '').trim() || ''

  const isActive = pathname === href

  const textColor = isActive ? 'text-secondary' : 'text-secondary-foreground'

  return (
    <Link
      {...props}
      className={cn(
        'group ring-offset-secondary focus-visible:ring-primary flex min-h-[60px] min-w-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-md p-1.5 transition-all focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
        isActive && 'bg-primary shadow-xl',
      )}
    >
      {/* Ícone passado como children */}
      <div
        className={cn(
          textColor,
          'group-hover:text-secondary-foreground transition-all',
        )}
      >
        {children}
      </div>
      {/* Texto do botão */}
      <Text
        variant="label-14-14-400"
        className={cn(
          textColor,
          'group-hover:text-secondary-foreground transition-all',
        )}
      >
        {label}
      </Text>
    </Link>
  )
}
