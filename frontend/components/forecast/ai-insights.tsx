"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertTriangle, Target, Zap } from "lucide-react"

const aiInsights = [
  {
    id: 1,
    type: "prediction",
    title: "Spending Likely to Rise",
    description: "Based on your patterns, spending may increase by 6% next month due to holiday season.",
    confidence: 89,
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    id: 2,
    type: "warning",
    title: "Budget Risk Alert",
    description: "Your shopping category is trending 23% above average. Consider setting stricter limits.",
    confidence: 94,
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    id: 3,
    type: "opportunity",
    title: "Savings Opportunity",
    description: "You could save $180/month by optimizing your subscription services and dining habits.",
    confidence: 76,
    icon: Target,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    id: 4,
    type: "insight",
    title: "Peak Spending Days",
    description: "You tend to spend 40% more on Fridays and weekends. Plan accordingly.",
    confidence: 91,
    icon: Zap,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
]

export function AIInsights() {
  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardHeader className="flex flex-row items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <CardTitle>AI Insights</CardTitle>
        <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
          Live
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {aiInsights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 rounded-lg border border-border/40 hover:bg-accent/30 transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${insight.bgColor} group-hover:scale-110 transition-transform`}>
                <insight.icon className={`w-4 h-4 ${insight.color}`} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {insight.confidence}% confident
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                <Badge variant="secondary" className={`text-xs ${insight.color} ${insight.bgColor}`}>
                  {insight.type}
                </Badge>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-6 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Recommendation</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Focus on reducing shopping expenses this month to stay within budget. Consider implementing a 24-hour
            waiting period for non-essential purchases.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
// v0-block-end
