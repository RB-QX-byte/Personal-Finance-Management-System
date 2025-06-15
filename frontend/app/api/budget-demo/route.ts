import { NextResponse } from "next/server"

export async function GET() {
  // Simulate network delay for realistic loading
  await new Promise((resolve) => setTimeout(resolve, 300))

  const budgetDemoData = {
    categories: [
      {
        id: "food",
        name: "Food & Dining",
        icon: "🍽️",
        color: "bg-orange-500",
        avgSpend: 650,
        trend: [45, 52, 48, 65, 58, 62, 67],
        transactions: 23,
        insights: {
          suggestion: "Consider meal planning to reduce dining out expenses",
          potentialSavings: 120,
        },
      },
      {
        id: "transport",
        name: "Transportation",
        icon: "🚗",
        color: "bg-green-500",
        avgSpend: 420,
        trend: [38, 42, 45, 41, 39, 44, 42],
        transactions: 12,
        insights: {
          suggestion: "Carpooling or public transport could reduce costs",
          potentialSavings: 85,
        },
      },
      {
        id: "shopping",
        name: "Shopping",
        icon: "🛒",
        color: "bg-blue-500",
        avgSpend: 580,
        trend: [65, 72, 58, 89, 76, 82, 58],
        transactions: 18,
        insights: {
          suggestion: "Wait 24 hours before non-essential purchases",
          potentialSavings: 150,
        },
      },
      {
        id: "entertainment",
        name: "Entertainment",
        icon: "🎬",
        color: "bg-purple-500",
        avgSpend: 280,
        trend: [25, 32, 28, 35, 30, 28, 32],
        transactions: 8,
        insights: {
          suggestion: "Look for free community events and activities",
          potentialSavings: 60,
        },
      },
      {
        id: "utilities",
        name: "Utilities",
        icon: "⚡",
        color: "bg-yellow-500",
        avgSpend: 240,
        trend: [24, 24, 25, 23, 24, 25, 24],
        transactions: 5,
        insights: {
          suggestion: "Energy-efficient appliances can reduce bills",
          potentialSavings: 30,
        },
      },
      {
        id: "healthcare",
        name: "Healthcare",
        icon: "🏥",
        color: "bg-red-500",
        avgSpend: 180,
        trend: [15, 18, 22, 16, 19, 17, 18],
        transactions: 3,
        insights: {
          suggestion: "Preventive care can reduce long-term costs",
          potentialSavings: 25,
        },
      },
      {
        id: "education",
        name: "Education",
        icon: "📚",
        color: "bg-indigo-500",
        avgSpend: 150,
        trend: [12, 15, 18, 14, 16, 15, 17],
        transactions: 4,
        insights: {
          suggestion: "Online courses often cost less than in-person",
          potentialSavings: 40,
        },
      },
      {
        id: "travel",
        name: "Travel",
        icon: "✈️",
        color: "bg-pink-500",
        avgSpend: 320,
        trend: [20, 35, 45, 25, 30, 40, 32],
        transactions: 6,
        insights: {
          suggestion: "Book flights and hotels in advance for better rates",
          potentialSavings: 95,
        },
      },
    ],
    recentBudgets: [
      {
        id: "1",
        name: "Monthly Essentials",
        categories: ["food", "transport", "utilities"],
        amount: 1200,
        spent: 890,
        duration: "monthly",
        daysLeft: 12,
        status: "on-track",
      },
      {
        id: "2",
        name: "Entertainment Budget",
        categories: ["entertainment", "shopping"],
        amount: 400,
        spent: 156,
        duration: "monthly",
        daysLeft: 12,
        status: "under-budget",
      },
      {
        id: "3",
        name: "Health & Wellness",
        categories: ["healthcare", "education"],
        amount: 300,
        spent: 245,
        duration: "monthly",
        daysLeft: 12,
        status: "warning",
      },
    ],
    insights: [
      {
        type: "suggestion",
        title: "Optimize Food Budget",
        description: "You could save $120/month by meal planning and cooking at home more often.",
        impact: 120,
        confidence: 87,
      },
      {
        type: "warning",
        title: "Shopping Overspend",
        description: "Your shopping category is 23% above average this month.",
        impact: -89,
        confidence: 94,
      },
      {
        type: "opportunity",
        title: "Transportation Savings",
        description: "Consider using public transport 2 days a week to save $85/month.",
        impact: 85,
        confidence: 76,
      },
    ],
    spendingPatterns: {
      peakDays: ["Friday", "Saturday", "Sunday"],
      peakHours: [12, 13, 18, 19, 20],
      seasonalTrends: {
        spring: { multiplier: 1.0, categories: ["travel", "shopping"] },
        summer: { multiplier: 1.2, categories: ["travel", "entertainment"] },
        fall: { multiplier: 0.9, categories: ["shopping", "education"] },
        winter: { multiplier: 1.1, categories: ["utilities", "food"] },
      },
    },
    recommendations: {
      budgetOptimization: [
        {
          category: "food",
          currentSpend: 650,
          recommendedBudget: 550,
          strategies: ["Meal planning", "Bulk buying", "Home cooking"],
        },
        {
          category: "shopping",
          currentSpend: 580,
          recommendedBudget: 450,
          strategies: ["24-hour rule", "Price comparison", "Seasonal sales"],
        },
      ],
      savingsGoals: [
        {
          name: "Emergency Fund",
          targetAmount: 5000,
          currentAmount: 1200,
          monthlyContribution: 300,
          timeToGoal: 13,
        },
      ],
    },
  }

  return NextResponse.json(budgetDemoData)
}
// v0-block-end
