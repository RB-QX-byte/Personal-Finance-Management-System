import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ForecastChart } from "@/components/forecast/forecast-chart"
import { AIInsights } from "@/components/forecast/ai-insights"
import { TrendAnalysis } from "@/components/forecast/trend-analysis"

export default function ForecastPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Forecast & Insights</h1>
            <p className="text-muted-foreground">AI-powered financial predictions and analysis</p>
          </div>
        </div>

        <ForecastChart />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIInsights />
          <TrendAnalysis />
        </div>
      </div>
    </DashboardLayout>
  )
}
// v0-block-end
