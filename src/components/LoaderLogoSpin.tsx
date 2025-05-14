import { Loader2Icon } from 'lucide-react'
import { Text } from './Text'
import { LogoBbz } from './svg/logo-bbz'

export function LoaderLogoSpinWrapper() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 lg:gap-7">
      <LogoBbz className="z-10 w-[280px]" />
      <div className="flex flex-col items-center justify-center gap-7">
        <Text
          variant="title-18-24-700"
          className="text-primary max-w-lg text-center lg:max-w-2xl"
        >
          Loading{' '}
          <span className="animate-[pulse_2s_cubic-bezier(0.4,_0,_0.6,_1)_infinite]">
            .
          </span>
          <span className="animate-[pulse_2.5s_cubic-bezier(0.4,_0,_0.6,_1)_infinite]">
            .
          </span>
          <span className="animate-[pulse_3s_cubic-bezier(0.4,_0,_0.6,_1)_infinite]">
            .
          </span>
        </Text>

        <Loader2Icon className="text-primary h-10 w-10 animate-spin sm:h-12 sm:w-12 lg:h-16 lg:w-16" />
      </div>
    </div>
  )
}

export function LoaderLogoSpin() {
  return (
    <main className="bg-background fixed top-0 z-50 flex h-screen w-screen">
      {/* wrapper */}
      {LoaderLogoSpinWrapper()}
    </main>
  )
}

export function LoadingScreen() {
  return (
    <div className="animate-scaleIn supports-[backdrop-filter]:bg-background/90 dark:supports-[backdrop-filter]:bg-background/90 absolute inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center gap-7 backdrop-blur">
      <LogoBbz className="z-10 w-[280px]" />
      <Text variant="headline-24-45-700">
        Carregando{' '}
        <span className="animate-[pulse_2s_cubic-bezier(0.4,_0,_0.6,_1)_infinite]">
          .
        </span>
        <span className="animate-[pulse_2.5s_cubic-bezier(0.4,_0,_0.6,_1)_infinite]">
          .
        </span>
        <span className="animate-[pulse_3s_cubic-bezier(0.4,_0,_0.6,_1)_infinite]">
          .
        </span>
      </Text>
    </div>
  )
}
