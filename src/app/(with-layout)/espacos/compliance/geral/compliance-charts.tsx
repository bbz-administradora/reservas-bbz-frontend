'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { transformTextIntoCapitalizedWords } from '@/utils/textUtils'
import { MonitorSmartphone } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'

interface SupervisorData {
  name: string
  count: number
  compliantCount: number
  nonCompliantCount: number
}

interface PositionStatsData {
  position: string
  label: string
  count: number
  compliantCount: number
  nonCompliantCount: number
}

interface ComplianceChartsProps {
  compliantCount: number
  nonCompliantCount: number
  supervisors: SupervisorData[]
  positionStats: PositionStatsData[]
}

// Configuração de cores para os gráficos
// Para o gráfico de pizza, as chaves precisam corresponder ao campo "name" dos dados
const pieChartConfig = {
  'Em Dia': {
    label: 'Em Dia',
    color: 'hsl(142, 76%, 36%)',
  },
  Pendentes: {
    label: 'Pendentes',
    color: 'hsl(0, 84%, 60%)',
  },
} satisfies ChartConfig

const positionChartConfig = {
  compliant: {
    label: 'Em Dia',
    color: 'hsl(142, 76%, 36%)',
  },
  nonCompliant: {
    label: 'Pendentes',
    color: 'hsl(0, 84%, 60%)',
  },
} satisfies ChartConfig

const supervisorChartConfig = {
  compliant: {
    label: 'Em Dia',
    color: 'hsl(142, 76%, 36%)',
  },
  nonCompliant: {
    label: 'Pendentes',
    color: 'hsl(0, 84%, 60%)',
  },
} satisfies ChartConfig

export function ComplianceCharts({
  compliantCount,
  nonCompliantCount,
  supervisors,
  positionStats,
}: ComplianceChartsProps) {
  // Dados para gráfico de pizza (Compliance Geral)
  const pieData = [
    { name: 'Em Dia', value: compliantCount, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Pendentes', value: nonCompliantCount, fill: 'hsl(0, 84%, 60%)' },
  ]

  // Dados de cargo já vêm agregados do backend
  const positionData = positionStats.map((stat) => ({
    position: stat.label,
    compliant: stat.compliantCount,
    nonCompliant: stat.nonCompliantCount,
  }))

  // Dados dos supervisores (ordenados por mais pendentes)
  const supervisorData = supervisors
    .map((sup) => ({
      name: sup.name
        ? transformTextIntoCapitalizedWords(sup.name)
        : 'Sem supervisor',
      compliant: sup.compliantCount,
      nonCompliant: sup.nonCompliantCount,
    }))
    .sort((a, b) => b.nonCompliant - a.nonCompliant)

  const total = compliantCount + nonCompliantCount
  const compliancePercentage =
    total > 0 ? Math.round((compliantCount / total) * 100) : 0

  // Calcular altura dinâmica para o gráfico de supervisores (mais espaço por item)
  const supervisorChartHeight = Math.max(300, supervisorData.length * 40)

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      {/* Alerta para mobile */}
      <Alert className="md:hidden">
        <MonitorSmartphone className="h-4 w-4" />
        <AlertDescription>
          Os gráficos de análise estão disponíveis apenas na versão desktop.
        </AlertDescription>
      </Alert>

      {/* Gráficos - Visíveis apenas em desktop */}
      <div className="hidden md:flex md:flex-col md:gap-4">
        {/* Linha 1: Gráfico de Pizza e Gráfico por Cargo */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Gráfico 1: Pizza - Compliance Geral */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Compliance Geral</CardTitle>
              <CardDescription>
                {compliancePercentage}% dos colaboradores em dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={pieChartConfig}
                className="mx-auto aspect-square h-[300px]"
              >
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    strokeWidth={2}
                    label={({ name, value, percent }) =>
                      `${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {compliancePercentage}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-muted-foreground text-xs"
                              >
                                em dia
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico 2: Barras - Compliance por Cargo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Por Cargo</CardTitle>
              <CardDescription>
                Distribuição de compliance por cargo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={positionChartConfig}
                className="h-[220px]"
              >
                <BarChart
                  data={positionData}
                  layout="vertical"
                  margin={{ left: 0, right: 12 }}
                >
                  <YAxis
                    dataKey="position"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={85}
                    fontSize={12}
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="compliant"
                    stackId="a"
                    fill="hsl(142, 76%, 36%)"
                    radius={[0, 0, 0, 0]}
                    name="Em Dia"
                  />
                  <Bar
                    dataKey="nonCompliant"
                    stackId="a"
                    fill="hsl(0, 84%, 60%)"
                    radius={[0, 4, 4, 0]}
                    name="Pendentes"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Linha 2: Gráfico de Supervisores - Largura total */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Compliance por Supervisor</CardTitle>
            <CardDescription>
              Ordenado por quantidade de pendentes (maior para menor)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={supervisorChartConfig}
              style={{ height: `${supervisorChartHeight}px` }}
            >
              <BarChart
                data={supervisorData}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={200}
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <XAxis type="number" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="compliant"
                  stackId="a"
                  fill="hsl(142, 76%, 36%)"
                  radius={[0, 0, 0, 0]}
                  name="Em Dia"
                />
                <Bar
                  dataKey="nonCompliant"
                  stackId="a"
                  fill="hsl(0, 84%, 60%)"
                  radius={[0, 4, 4, 0]}
                  name="Pendentes"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
