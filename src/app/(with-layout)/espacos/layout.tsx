import { SpaceTypeProvider } from '@/context/SpaceTypeProvider'

export default async function SpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SpaceTypeProvider>{children}</SpaceTypeProvider>
}
