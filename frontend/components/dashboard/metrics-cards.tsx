import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "@/lib/api/claims"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList, Inbox, CheckCircle2, Activity, Clock, Zap, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricsCardsProps {
  metrics: DashboardMetrics
  isLoading?: boolean
  previousMetrics?: DashboardMetrics
}

function TrendIndicator({ current, previous, inverse = false }: { current: number; previous?: number; inverse?: boolean }) {
  if (previous === undefined) return null
  
  const diff = current - previous
  if (diff === 0) return <Minus className="h-3 w-3 text-muted-foreground" aria-label="No change" />
  
  const isPositive = inverse ? diff < 0 : diff > 0
  const Icon = diff > 0 ? TrendingUp : TrendingDown
  const color = isPositive ? "text-green-600" : "text-red-600"
  
  return (
    <span className={`flex items-center gap-0.5 text-xs ${color}`} aria-label={`${diff > 0 ? 'Up' : 'Down'} ${Math.abs(diff)} from yesterday`}>
      <Icon className="h-3 w-3" />
      {Math.abs(diff)}
    </span>
  )
}

export function MetricsCards({ metrics, isLoading = false, previousMetrics }: MetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Assigned to Me
          </CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{metrics.my_caseload}</div>
            <TrendIndicator current={metrics.my_caseload} previous={previousMetrics?.my_caseload} inverse />
          </div>
          <p className="text-xs text-muted-foreground">
            Active claims in your caseload
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Review Queue
          </CardTitle>
          <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{metrics.queue_depth}</div>
            <TrendIndicator current={metrics.queue_depth} previous={previousMetrics?.queue_depth} inverse />
          </div>
          <p className="text-xs text-muted-foreground">
            AI-completed claims ready for pickup
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            AI Processing
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{metrics.processing_queue_depth}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            Claims currently in AI analysis
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Processed Today
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{metrics.processed_today}</div>
            <TrendIndicator current={metrics.processed_today} previous={previousMetrics?.processed_today} />
          </div>
          <p className="text-xs text-muted-foreground">
            Decisions recorded by you
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Processing
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{metrics.avg_processing_time_minutes}m</div>
            <TrendIndicator current={metrics.avg_processing_time_minutes} previous={previousMetrics?.avg_processing_time_minutes} inverse />
          </div>
          <p className="text-xs text-muted-foreground">
            Assignment to decision
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Auto-Approved
          </CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{metrics.auto_approved_today ?? 0}</div>
            <TrendIndicator current={metrics.auto_approved_today ?? 0} previous={previousMetrics?.auto_approved_today} />
          </div>
          <p className="text-xs text-muted-foreground">
            Auto-approved today
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
