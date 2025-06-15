"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const chartData = [
  { month: "Jan", spending: 2400, income: 4000 },
  { month: "Feb", spending: 1398, income: 3800 },
  { month: "Mar", spending: 3800, income: 4200 },
  { month: "Apr", spending: 3908, income: 4100 },
  { month: "May", spending: 4800, income: 4300 },
  { month: "Jun", spending: 3800, income: 4000 },
  { month: "Jul", spending: 4300, income: 4500 },
]

const chartConfig = {
  spending: {
    label: "Spending",
    color: "hsl(var(--destructive))",
  },
  income: {
    label: "Income",
    color: "hsl(var(--primary))",
  },
}

export function SpendingChart() {
  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Income vs Spending</span>
          <span className="text-sm font-normal text-muted-foreground">Last 7 months</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
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
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="spending"
                stroke="hsl(var(--destructive))"
                fillOpacity={1}
                fill="url(#spendingGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
// v0-block-end
