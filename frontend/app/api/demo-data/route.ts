import { NextResponse } from "next/server"

export async function GET() {
  const demoData = {
    netWorth: {
      current: 87500,
      target: 125000,
      monthlyChange: 2.4,
    },
    kpis: [
      {
        title: "Cash & Savings",
        value: 45230,
        change: 12.5,
        isPositive: true,
      },
      {
        title: "Investments",
        value: 62840,
        change: 8.2,
        isPositive: true,
      },
      {
        title: "Liabilities",
        value: 20570,
        change: -3.1,
        isPositive: false,
      },
    ],
    transactions: [
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
      // Add more transactions...
    ],
    budgets: [
      {
        category: "Food & Dining",
        budget: 800,
        spent: 654,
        color: "bg-orange-500",
        emoji: "🍽️",
      },
      {
        category: "Transportation",
        budget: 400,
        spent: 387,
        color: "bg-green-500",
        emoji: "🚗",
      },
      // Add more budget categories...
    ],
    forecast: {
      data: [
        { month: "Jan", actual: 4200, predicted: null },
        { month: "Feb", actual: 3800, predicted: null },
        { month: "Mar", actual: 4500, predicted: null },
        { month: "Apr", actual: 4100, predicted: null },
        { month: "May", actual: 4300, predicted: null },
        { month: "Jun", actual: 3900, predicted: null },
        { month: "Jul", actual: 4600, predicted: 4600 },
        { month: "Aug", actual: null, predicted: 4800 },
        { month: "Sep", actual: null, predicted: 4950 },
        { month: "Oct", actual: null, predicted: 5100 },
        { month: "Nov", actual: null, predicted: 5200 },
        { month: "Dec", actual: null, predicted: 5350 },
      ],
      insights: [
        {
          type: "prediction",
          title: "Spending Likely to Rise",
          description: "Based on your patterns, spending may increase by 6% next month due to holiday season.",
          confidence: 89,
        },
        // Add more insights...
      ],
    },
  }

  return NextResponse.json(demoData)
}
// v0-block-end
