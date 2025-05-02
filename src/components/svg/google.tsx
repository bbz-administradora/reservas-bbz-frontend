import React from 'react'

type IconProps = React.HTMLAttributes<SVGElement> & {
  className?: string
  width?: number
  height?: number
}

export function GoogleIcon({
  className,
  width = 21,
  height = 20,
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 21 20"
      className={className}
      {...props}
    >
      <g clipPath="url(#clip0_15_78)">
        <mask
          id="a"
          style={{
            maskType: 'luminance',
          }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={-1}
          width={21}
          height={21}
        >
          <path
            d="M10.812.242c2.389 0 4.53.862 6.232 2.272l-2.57 2.57a6.017 6.017 0 00-3.662-1.236A6.14 6.14 0 004.661 10a6.14 6.14 0 006.151 6.15c2.858 0 5.073-1.462 5.602-4.057l.058-.29h-5.418v-3.38h8.88c.11.523.18 1.07.18 1.577 0 6.222-4.428 9.757-9.302 9.757A9.73 9.73 0 011.054 10 9.73 9.73 0 0110.812.242z"
            fill="#fff"
            stroke="#fff"
            strokeWidth={0.484847}
          />
        </mask>
        <g mask="url(#a)">
          <path
            d="M7.231 10L.145 15.418V4.58L7.231 10z"
            fill="#FBBC05"
            stroke="#fff"
            strokeWidth={0.484847}
          />
        </g>
        <mask
          id="b"
          style={{
            maskType: 'luminance',
          }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={-1}
          width={21}
          height={21}
        >
          <path
            d="M20.13 8.181h-9.318v3.864h5.364c-.5 2.454-2.591 3.864-5.364 3.864a5.897 5.897 0 01-5.909-5.91 5.897 5.897 0 015.91-5.909c1.408 0 2.681.5 3.681 1.319l2.909-2.91C15.63.954 13.358 0 10.813 0c-5.546 0-10 4.455-10 10 0 5.546 4.454 10 10 10 5 0 9.545-3.636 9.545-10 0-.59-.091-1.227-.228-1.818z"
            fill="#fff"
          />
        </mask>
        <g mask="url(#b)">
          <path
            d="M-.097 4.09L7.63 10l3.182-2.773 10.91-1.773V-.909H-.098v5z"
            fill="#EA4335"
          />
        </g>
        <mask
          id="c"
          style={{
            maskType: 'luminance',
          }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={-1}
          width={21}
          height={21}
        >
          <path
            d="M20.13 8.181h-9.318v3.864h5.364c-.5 2.454-2.591 3.864-5.364 3.864a5.897 5.897 0 01-5.909-5.91 5.897 5.897 0 015.91-5.909c1.408 0 2.681.5 3.681 1.319l2.909-2.91C15.63.954 13.358 0 10.813 0c-5.546 0-10 4.455-10 10 0 5.546 4.454 10 10 10 5 0 9.545-3.636 9.545-10 0-.59-.091-1.227-.228-1.818z"
            fill="#fff"
          />
        </mask>
        <g mask="url(#c)">
          <path
            d="M-.097 15.909L13.54 5.454l3.591.455L21.721-.91v21.818H-.097v-5z"
            fill="#34A853"
          />
        </g>
        <mask
          id="d"
          style={{
            maskType: 'luminance',
          }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={-1}
          width={21}
          height={21}
        >
          <path
            d="M20.13 8.181h-9.318v3.864h5.364c-.5 2.454-2.591 3.864-5.364 3.864a5.897 5.897 0 01-5.909-5.91 5.897 5.897 0 015.91-5.909c1.408 0 2.681.5 3.681 1.319l2.909-2.91C15.63.954 13.358 0 10.813 0c-5.546 0-10 4.455-10 10 0 5.546 4.454 10 10 10 5 0 9.545-3.636 9.545-10 0-.59-.091-1.227-.228-1.818z"
            fill="#fff"
          />
        </mask>
        <g mask="url(#d)">
          <path
            d="M21.721 20.909L7.631 9.999 5.811 8.637l15.91-4.545v16.818z"
            fill="#4285F4"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_15_78">
          <path fill="#fff" transform="translate(.5)" d="M0 0H20V20H0z" />
        </clipPath>
      </defs>
    </svg>
  )
}
