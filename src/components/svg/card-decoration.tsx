import React from 'react'

type IconProps = React.HTMLAttributes<SVGElement> & {
  className?: string
  width?: number
  height?: number
}

export function CardDecoration({
  className,
  width = 56,
  height = 56,
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
      {...props}
    >
      <path d="M56 56C55.84 25.143 30.857.16 0 0v56h56z" fill="currentColor" />
    </svg>
  )
}
