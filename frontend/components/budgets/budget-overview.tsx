"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

const budgetOverview = {
  totalBudget: 4500,
  totalSpent: 3247,
  remaining: 1253,
  categories: [
    {
      name: "Food & Dining",
      budget: 800,
      spent: 654,
      color: "bg-orange-500",
      status: "on-track",
    },
    {
      name: "Transportation",
      budget: 400,
      spent: 387,
      color: "bg-green-500",
      status: "warning",
    },
    {
      name: "Shopping",
      budget: 600,
      spent: 723,
      color: "bg-blue-500",
      status: "over-budget",
    },
    {
      name: "Entertainment",
      budget: 300,
      spent: 156,
      color: "bg-purple-500",
      status: "on-track",
    },
  ],
}

export function BudgetOverview() {
  const spentPercentage = (budgetOverview.totalSpent / budgetOverview.totalBudget) * 100

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 backdrop-blur-sm bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Monthly Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Spent</span>
              <span className="font-medium">
                ${budgetOverview.totalSpent.toLocaleString()} / ${budgetOverview.totalBudget.toLocaleString()}
              </span>
            </div>
            <Progress value={spentPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{spentPercentage.toFixed(1)}% used</span>
              <span>${budgetOverview.remaining.toLocaleString()} remaining</span>
            </div>
          </div>

          <div className="space-y-4">
            {budgetOverview.categories.map((category, index) => {
              const percentage = (category.spent / category.budget) * 100
              const isOverBudget = category.spent > category.budget

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      <span className="font-medium text-foreground">{category.name}</span>
                      {category.status === "over-budget" && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Over Budget
                        </Badge>
                      )}
                      {category.status === "warning" && (
                        <Badge variant="secondary" className="text-xs text-yellow-600 dark:text-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Warning
                        </Badge>
                      )}
                      {category.status === "on-track" && (
                        <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          On Track
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      ${category.spent} / ${category.budget}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : ""}`}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Budget Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">{spentPercentage.toFixed(0)}%</div>
            <p className="text-sm text-muted-foreground">of budget used</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Categories on track</span>
              <span className="font-medium text-green-600 dark:text-green-400">2/4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Over budget</span>
              <span className="font-medium text-red-600 dark:text-red-400">1/4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Days remaining</span>
              <span className="font-medium text-foreground">12</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
// v0-block-end
