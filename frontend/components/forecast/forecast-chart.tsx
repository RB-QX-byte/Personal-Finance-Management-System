"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from "recharts"
import { Badge } from "@/components/ui/badge"

const forecastData = [
  { month: "Jan", actual: 4200, predicted: null },
  { month: "Feb", actual: 3800, predicted: null },
  { month: "Mar", actual: 4500, predicted: null },
  { month: "Apr", actual: 4100, predicted: null },
  { month: "May", actual: 4300, predicted: null },
  { month: "Jun", actual: 3900, predicted: null },
  { month: "Jul", actual: 4600, predicted: 4600 },
  { month: "Aug", actual: null, predicted: 4800 },
  { month: "Sep", actual: null, predicted: 4950 },
  { month: "Oct", actual: null, predicted: 5100 },
  { month: "Nov", actual: null, predicted: 5200 },
  { month: "Dec", actual: null, predicted: 5350 },
]

const chartConfig = {
  actual: {
    label: "Actual",
    color: "hsl(var(--primary))",
  },
  predicted: {
    label: "Predicted",
    color: "hsl(var(--muted-foreground))",
  },
}

export function ForecastChart() {
  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Financial Forecast</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">AI-powered predictions based on your spending patterns</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          AI Powered
        </Badge>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
              <YAxis
                axisLine={false}
                tickLine={false}
                className="text-xs text-muted-foreground"
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ReferenceLine x="Jul" stroke="hsl(var(--border))" strokeDasharray="2 2" />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#actualGradient)"
                strokeWidth={2}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--muted-foreground))"
                fillOpacity={1}
                fill="url(#predictedGradient)"
                strokeWidth={2}
                strokeDasharray="5 5"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 rounded-lg bg-accent/30">
            <p className="text-sm text-muted-foreground">Predicted Growth</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">+16.3%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/30">
            <p className="text-sm text-muted-foreground">Confidence Level</p>
            <p className="text-lg font-semibold text-primary">87%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/30">
            <p className="text-sm text-muted-foreground">Next Month</p>
            <p className="text-lg font-semibold text-foreground">$4,800</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
// v0-block-end
