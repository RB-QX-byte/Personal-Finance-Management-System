"use client"

import { useState, useCallback } from "react"

interface Transaction {
  id: string
  amount: number
  date: Date
  category: string
  merchant: string
  tags: string[]
  notes: string
  attachment?: File
}

interface TransactionData {
  amount: number
  date: Date
  category: string
  merchant: string
  tags: string[]
  notes: string
  attachment?: File
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addTransaction = useCallback(async (data: TransactionData) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
      }

      setTransactions((prev) => [newTransaction, ...prev])

      // Simulate WebSocket push to dashboard
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("transaction-added", {
            detail: newTransaction,
          }),
        )
      }
    } catch (error) {
      throw new Error("Failed to add transaction")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    transactions,
    addTransaction,
    isLoading,
  }
}
// v0-block-end
