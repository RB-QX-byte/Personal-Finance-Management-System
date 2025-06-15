"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown } from "lucide-react"

export function NetWorthHero() {
  const [netWorth, setNetWorth] = useState(0)
  const [progress, setProgress] = useState(0)

  const targetNetWorth = 125000
  const currentNetWorth = 87500
  const monthlyChange = 2.4
  const isPositive = monthlyChange > 0

  useEffect(() => {
    const timer = setTimeout(() => {
      setNetWorth(currentNetWorth)
      setProgress((currentNetWorth / targetNetWorth) * 100)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm border-border/40">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
      <div className="relative p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Net Worth</h2>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl lg:text-5xl font-bold text-foreground">${netWorth.toLocaleString()}</span>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isPositive
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(monthlyChange)}% this month
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to goal</span>
                <span className="font-medium">${targetNetWorth.toLocaleString()}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                ${(targetNetWorth - currentNetWorth).toLocaleString()} remaining to reach your goal
              </p>
            </div>
          </div>

          <div className="relative w-32 h-32 lg:w-40 lg:h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 ease-out"
                strokeDasharray={`${progress * 2.83} 283`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{Math.round(progress)}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
// v0-block-end
