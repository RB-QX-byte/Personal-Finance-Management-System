"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const trendData = [
  { category: "Food", thisMonth: 654, lastMonth: 580, change: 12.8 },
  { category: "Transport", thisMonth: 387, lastMonth: 420, change: -7.9 },
  { category: "Shopping", thisMonth: 723, lastMonth: 650, change: 11.2 },
  { category: "Entertainment", thisMonth: 156, lastMonth: 200, change: -22.0 },
  { category: "Utilities", thisMonth: 234, lastMonth: 240, change: -2.5 },
]

const chartConfig = {
  thisMonth: {
    label: "This Month",
    color: "hsl(var(--primary))",
  },
  lastMonth: {
    label: "Last Month",
    color: "hsl(var(--muted-foreground))",
  },
}

export function TrendAnalysis() {
  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardHeader>
        <CardTitle>Spending Trends</CardTitle>
        <p className="text-sm text-muted-foreground">Month-over-month comparison by category</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChartContainer config={chartConfig} className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} barGap={4}>
              <XAxis dataKey="category" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
              <YAxis
                axisLine={false}
                tickLine={false}
                className="text-xs text-muted-foreground"
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="lastMonth" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} opacity={0.6} />
              <Bar dataKey="thisMonth" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="space-y-3">
          {trendData.map((item, index) => {
            const isIncrease = item.change > 0
            const isDecrease = item.change < 0
            const isFlat = Math.abs(item.change) < 1

            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {isIncrease && <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />}
                    {isDecrease && <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />}
                    {isFlat && <Minus className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <span className="font-medium text-foreground">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    ${item.thisMonth} vs ${item.lastMonth}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      isIncrease
                        ? "text-red-600 dark:text-red-400 bg-red-500/10"
                        : isDecrease
                          ? "text-green-600 dark:text-green-400 bg-green-500/10"
                          : "text-muted-foreground"
                    }`}
                  >
                    {isIncrease ? "+" : ""}
                    {item.change.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
// v0-block-end
