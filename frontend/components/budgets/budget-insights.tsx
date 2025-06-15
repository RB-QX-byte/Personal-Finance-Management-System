"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from "lucide-react"

const insights = [
  {
    type: "warning",
    title: "Shopping Budget Alert",
    description: "You've exceeded your shopping budget by $123 this month.",
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    type: "tip",
    title: "Save on Transportation",
    description: "Consider carpooling or public transport to reduce costs by 20%.",
    icon: Lightbulb,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    type: "positive",
    title: "Entertainment Savings",
    description: "Great job! You're 48% under budget in entertainment.",
    icon: TrendingDown,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    type: "trend",
    title: "Food Spending Trend",
    description: "Your dining expenses increased 15% compared to last month.",
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
]

export function BudgetInsights() {
  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardHeader>
        <CardTitle>Budget Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="p-3 rounded-lg border border-border/40 hover:bg-accent/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${insight.bgColor} mt-0.5`}>
                <insight.icon className={`w-4 h-4 ${insight.color}`} />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium text-foreground text-sm">{insight.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                <Badge variant="secondary" className={`text-xs ${insight.color} ${insight.bgColor}`}>
                  {insight.type}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
// v0-block-end
