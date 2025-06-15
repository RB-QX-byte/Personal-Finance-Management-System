"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShoppingCart, Car, Home, Coffee, Zap } from "lucide-react"
import Link from "next/link"

const recentTransactions = [
  {
    id: 1,
    merchant: "Amazon",
    category: "Shopping",
    amount: -89.99,
    date: "2024-01-15",
    icon: ShoppingCart,
    emoji: "🛒",
  },
  {
    id: 2,
    merchant: "Shell Gas Station",
    category: "Transportation",
    amount: -45.2,
    date: "2024-01-14",
    icon: Car,
    emoji: "⛽",
  },
  {
    id: 3,
    merchant: "Rent Payment",
    category: "Housing",
    amount: -1200.0,
    date: "2024-01-01",
    icon: Home,
    emoji: "🏠",
  },
  {
    id: 4,
    merchant: "Starbucks",
    category: "Food & Drink",
    amount: -5.75,
    date: "2024-01-14",
    icon: Coffee,
    emoji: "☕",
  },
  {
    id: 5,
    merchant: "Electric Bill",
    category: "Utilities",
    amount: -120.5,
    date: "2024-01-13",
    icon: Zap,
    emoji: "⚡",
  },
]

const categoryColors = {
  Shopping: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Transportation: "bg-green-500/10 text-green-600 dark:text-green-400",
  Housing: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "Food & Drink": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Utilities: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
}

export function RecentTransactions() {
  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions" className="flex items-center gap-1">
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-lg">
                {transaction.emoji}
              </div>
              <div>
                <p className="font-medium text-foreground">{transaction.merchant}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${categoryColors[transaction.category as keyof typeof categoryColors]}`}
                  >
                    {transaction.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{transaction.date}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`font-semibold ${
                  transaction.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                }`}
              >
                {transaction.amount < 0 ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
// v0-block-end
