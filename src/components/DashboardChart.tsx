import React from 'react'
import { lazy, Suspense } from 'react'
import { ComponentLoading } from '../utils/lazyLoading'

// Lazy loading do gráfico (recharts é pesado)
const ChartComponent = lazy(() => import('./ChartComponent'))

interface DashboardChartProps {
  data: Array<{ date: string; interactions: number }>
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <Suspense fallback={<ComponentLoading size="lg" />}>
      <ChartComponent data={data} />
    </Suspense>
  )
} 