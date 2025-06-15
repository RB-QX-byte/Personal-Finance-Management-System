"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"

const budgetCategories = [
  {
    id: 1,
    name: "Food & Dining",
    budget: 800,
    spent: 654,
    transactions: 23,
    color: "bg-orange-500",
    emoji: "🍽️",
  },
  {
    id: 2,
    name: "Transportation",
    budget: 400,
    spent: 387,
    transactions: 12,
    color: "bg-green-500",
    emoji: "🚗",
  },
  {
    id: 3,
    name: "Shopping",
    budget: 600,
    spent: 723,
    transactions: 18,
    color: "bg-blue-500",
    emoji: "🛒",
  },
  {
    id: 4,
    name: "Entertainment",
    budget: 300,
    spent: 156,
    transactions: 8,
    color: "bg-purple-500",
    emoji: "🎬",
  },
  {
    id: 5,
    name: "Utilities",
    budget: 250,
    spent: 234,
    transactions: 5,
    color: "bg-yellow-500",
    emoji: "⚡",
  },
  {
    id: 6,
    name: "Healthcare",
    budget: 200,
    spent: 89,
    transactions: 3,
    color: "bg-red-500",
    emoji: "🏥",
  },
]

export function BudgetCategories() {
  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget Categories</CardTitle>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgetCategories.map((category) => {
          const percentage = (category.spent / category.budget) * 100
          const isOverBudget = category.spent > category.budget
          const remaining = category.budget - category.spent

          return (
            <div
              key={category.id}
              className="p-4 rounded-lg border border-border/40 hover:bg-accent/30 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-lg">
                    {category.emoji}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.transactions} transactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${category.spent} / ${category.budget}
                  </span>
                  <span
                    className={`font-medium ${
                      isOverBudget
                        ? "text-red-600 dark:text-red-400"
                        : remaining < category.budget * 0.1
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {isOverBudget ? `$${Math.abs(remaining)} over` : `$${remaining} left`}
                  </span>
                </div>
                <Progress
                  value={Math.min(percentage, 100)}
                  className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : ""}`}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}% used</span>
                  {isOverBudget && (
                    <Badge variant="destructive" className="text-xs">
                      Over Budget
                    </Badge>
                  )}
                  {!isOverBudget && percentage > 90 && (
                    <Badge variant="secondary" className="text-xs text-yellow-600 dark:text-yellow-400">
                      Warning
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
// v0-block-end
