"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard } from "lucide-react"

const stats = [
  {
    title: "Total Income",
    value: "$5,350",
    change: "+12.5%",
    isPositive: true,
    icon: ArrowUpRight,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Total Expenses",
    value: "$3,247",
    change: "+8.2%",
    isPositive: false,
    icon: ArrowDownRight,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    title: "Net Income",
    value: "$2,103",
    change: "+15.3%",
    isPositive: true,
    icon: DollarSign,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Transactions",
    value: "47",
    change: "+5 this week",
    isPositive: true,
    icon: CreditCard,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
]

export function TransactionStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="backdrop-blur-sm bg-card/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p
              className={`text-xs ${stat.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
// v0-block-end
