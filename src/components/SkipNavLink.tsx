interface SkipNavLinkProps {
  href: string
  text?: string
}

export function SkipNavLink({
  href,
  text = 'Pular para o conteúdo principal',
}: SkipNavLinkProps) {
  return (
    <a
      className="sr-only"
      href={href}
      tabIndex={0}
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    >
      {text}
    </a>
  )
}
