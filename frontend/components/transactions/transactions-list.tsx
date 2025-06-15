"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download } from "lucide-react"

const transactions = [
  {
    id: 1,
    date: "2024-01-15",
    merchant: "Amazon",
    category: "Shopping",
    amount: -89.99,
    emoji: "🛒",
    description: "Electronics purchase",
  },
  {
    id: 2,
    date: "2024-01-14",
    merchant: "Salary Deposit",
    category: "Income",
    amount: 4500.0,
    emoji: "💰",
    description: "Monthly salary",
  },
  {
    id: 3,
    date: "2024-01-14",
    merchant: "Shell Gas Station",
    category: "Transportation",
    amount: -45.2,
    emoji: "⛽",
    description: "Fuel purchase",
  },
  {
    id: 4,
    date: "2024-01-13",
    merchant: "Starbucks",
    category: "Food & Drink",
    amount: -5.75,
    emoji: "☕",
    description: "Coffee and pastry",
  },
  {
    id: 5,
    date: "2024-01-12",
    merchant: "Netflix",
    category: "Entertainment",
    amount: -15.99,
    emoji: "🎬",
    description: "Monthly subscription",
  },
  {
    id: 6,
    date: "2024-01-10",
    merchant: "Grocery Store",
    category: "Food & Drink",
    amount: -127.45,
    emoji: "🛒",
    description: "Weekly groceries",
  },
  {
    id: 7,
    date: "2024-01-08",
    merchant: "Electric Company",
    category: "Utilities",
    amount: -120.5,
    emoji: "⚡",
    description: "Monthly electric bill",
  },
  {
    id: 8,
    date: "2024-01-05",
    merchant: "Freelance Payment",
    category: "Income",
    amount: 850.0,
    emoji: "💼",
    description: "Web design project",
  },
]

const categoryColors = {
  Shopping: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Transportation: "bg-green-500/10 text-green-600 dark:text-green-400",
  "Food & Drink": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Entertainment: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  Utilities: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Income: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

export function TransactionsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const selectedCategory = "All"

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || transaction.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  {transaction.emoji}
                </div>
                <div>
                  <p className="font-medium text-foreground">{transaction.merchant}</p>
                  <p className="text-sm text-muted-foreground">{transaction.description}</p>
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
                  className={`font-semibold text-lg ${
                    transaction.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {transaction.amount < 0 ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
// v0-block-end
