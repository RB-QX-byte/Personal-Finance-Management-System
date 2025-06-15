"use client"

import { useState, useCallback } from "react"

interface Budget {
  id: string
  categories: string[]
  amount: number
  duration: "monthly" | "weekly" | "custom"
  startDate: Date
  endDate: Date
  notifications: {
    at75: boolean
    at100: boolean
  }
  spent: number
  createdAt: Date
}

interface BudgetData {
  categories: string[]
  amount: number
  duration: "monthly" | "weekly" | "custom"
  startDate: Date
  endDate: Date
  notifications: {
    at75: boolean
    at100: boolean
  }
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const createBudget = useCallback(async (data: BudgetData) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newBudget: Budget = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        spent: 0,
        createdAt: new Date(),
      }

      setBudgets((prev) => [newBudget, ...prev])

      // Simulate optimistic UI update
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("budget-created", {
            detail: newBudget,
          }),
        )
      }
    } catch (error) {
      throw new Error("Failed to create budget")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    budgets,
    createBudget,
    isLoading,
  }
}
// v0-block-end
