import { SkipNavLink } from '@/components/SkipNavLink'
import { env } from '@/infra/env'
import { manrope } from '@/style/fonts'
import '@/style/globals.css'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F6F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1D1D1B' },
  ],
}

export const metadata: Metadata = {
  title: 'Reserva de Salas - Gestão Inteligente para Ambientes Corporativos',
  description:
    'Sistema completo para gestão e reserva de salas corporativas. Agendamentos rápidos, controle de acesso, integração com Google Calendar e abertura remota via fechadura inteligente.',
  openGraph: {
    title: 'Reserva de Salas BBZ - Agende, Gerencie e Acesse com Facilidade',
    description:
      'Organize o uso de espaços corporativos com o sistema de reserva de salas da BBZ. Controle de horários, abertura via fechadura inteligente e integração com calendário.',
    url: '/',
    siteName: 'Reserva de Salas BBZ',
    images: [
      {
        url: `${env.NEXT_PUBLIC_BUCKET}/og-800x600-bbz.png`,
        width: 800,
        height: 600,
        alt: 'Reserva de Salas - Sistema Corporativo de Agendamento',
      },
      {
        url: `${env.NEXT_PUBLIC_BUCKET}/og-1800x1600-bbz.png`,
        width: 1800,
        height: 1600,
        alt: 'Reserva de Salas - Gestão de Ambientes e Acessos',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reserva de Salas BBZ - Agendamentos Inteligentes',
    description:
      'Otimize a gestão de salas da sua empresa com agendamentos inteligentes, controle de acesso e integração com Google Calendar.',
    images: [`${env.NEXT_PUBLIC_BUCKET}/og-800x600-reserva.png`],
  },
  verification: {
    google: '', // Adicione o código de verificação do Google, se necessário
  },
  metadataBase: new URL('https://gestao.bbz.com.br/'),
  alternates: {
    canonical: 'https://gestao.bbz.com.br/',
  },
  category: 'Sistema de Reserva de Salas Corporativas',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="BBZ" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${manrope.variable} font-manrope bg-background selection:bg-secondary selection:text-secondary-foreground flex min-h-screen w-[100vw] flex-col overflow-x-hidden scroll-smooth text-[16px] leading-[24px] font-normal tracking-[0.5px] antialiased`}
      >
        <SkipNavLink href="#main" />
        {children}
        <Toaster
          toastOptions={{
            style: {
              justifyContent: 'center',
            },
          }}
        />
      </body>
    </html>
  )
}
