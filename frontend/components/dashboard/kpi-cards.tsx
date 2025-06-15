"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react"

const kpiData = [
  {
    title: "Cash & Savings",
    value: "$45,230",
    change: "+12.5%",
    isPositive: true,
    icon: Wallet,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Investments",
    value: "$62,840",
    change: "+8.2%",
    isPositive: true,
    icon: TrendingUp,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Liabilities",
    value: "$20,570",
    change: "-3.1%",
    isPositive: false,
    icon: CreditCard,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  },
]

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpiData.map((kpi, index) => (
        <Card
          key={index}
          className="relative overflow-hidden backdrop-blur-sm bg-card/50 border-border/40 hover:bg-card/70 transition-all duration-300 hover:scale-[1.02]"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  kpi.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {kpi.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs last month</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
// v0-block-end
