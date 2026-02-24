import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  className?: string
  trend?: {
    value: number
    isUp: boolean
  }
}

export function StatCard({ title, value, icon: Icon, description, className, trend }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-slate-100/80 flex flex-shrink-0 items-center justify-center">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
            {trend.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}% dari bulan lalu
          </div>
        )}
      </CardContent>
    </Card>
  )
}
