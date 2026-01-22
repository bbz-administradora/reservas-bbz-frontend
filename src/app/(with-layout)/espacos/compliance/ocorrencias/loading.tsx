import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function OcorrenciasLoading() {
  return (
    <div
      id="main"
      className="wrapper flex flex-1 flex-col items-center gap-5 pt-5 pb-28 lg:pb-10"
    >
      {/* Header Skeleton */}
      <div className="mt-10 flex w-full max-w-6xl flex-col gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-[350px]" />
            <Skeleton className="h-5 w-[200px]" />
          </div>
        </div>
      </div>

      {/* Cards de Resumo Skeleton */}
      <div className="grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-9 w-[60px]" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Filtros Skeleton */}
      <div className="flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 min-w-[200px] flex-1" />
        </div>
        <Skeleton className="h-5 w-[120px]" />
      </div>

      {/* Tabela Skeleton - Desktop */}
      <Card className="hidden w-full max-w-6xl md:block">
        <CardContent className="p-0">
          <div className="p-4">
            {/* Header da Tabela */}
            <div className="flex gap-4 border-b pb-4">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
            {/* Linhas da Tabela */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b py-4">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-[120px]" />
                  <Skeleton className="h-4 w-[180px]" />
                </div>
                <Skeleton className="h-6 w-[80px] rounded-full" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-6 w-[90px] rounded-full" />
                <Skeleton className="h-8 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cards Skeleton - Mobile */}
      <div className="flex w-full max-w-6xl flex-col gap-4 md:hidden">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-6 w-[90px] rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginação Skeleton */}
      <div className="flex w-full max-w-6xl justify-center gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  )
}
