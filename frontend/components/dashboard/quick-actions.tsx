"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Target, TrendingUp, CreditCard, PiggyBank, FileText } from "lucide-react"
import { CreateBudgetWizard } from "@/components/budgets/create-budget-wizard"
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal"

const quickActions = [
  {
    id: "add-transaction",
    title: "Add Transaction",
    description: "Record a new expense or income",
    icon: Plus,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    action: "modal",
  },
  {
    id: "create-budget",
    title: "Create Budget",
    description: "Set spending limits for categories",
    icon: Target,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    action: "modal",
  },
  {
    id: "investment-goal",
    title: "Investment Goal",
    description: "Plan your investment strategy",
    icon: TrendingUp,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    href: "/goals/new",
    action: "navigate",
  },
  {
    id: "pay-bills",
    title: "Pay Bills",
    description: "Manage upcoming payments",
    icon: CreditCard,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    href: "/bills",
    action: "navigate",
  },
  {
    id: "savings-plan",
    title: "Savings Plan",
    description: "Create automated savings",
    icon: PiggyBank,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-500/10",
    href: "/savings",
    action: "navigate",
  },
  {
    id: "generate-report",
    title: "Generate Report",
    description: "Export financial summary",
    icon: FileText,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10",
    href: "/reports",
    action: "navigate",
  },
]

export function QuickActions() {
  const [createBudgetOpen, setCreateBudgetOpen] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)

  const handleAction = (actionId: string, actionType: string, href?: string) => {
    switch (actionId) {
      case "create-budget":
        setCreateBudgetOpen(true)
        break
      case "add-transaction":
        setAddTransactionOpen(true)
        break
      default:
        if (actionType === "navigate" && href) {
          window.location.href = href
        }
        break
    }
  }

  return (
    <>
      <Card className="backdrop-blur-sm bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action, index) => (
            <Button
              key={action.id}
              variant="ghost"
              onClick={() => handleAction(action.id, action.action, action.href)}
              className="w-full justify-start h-auto p-4 hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02]"
              onMouseEnter={() => {
                // Prefetch data on hover for better performance
                if (action.id === "create-budget") {
                  fetch("/api/budget-demo").catch(() => {})
                }
              }}
              aria-label={`${action.title}: ${action.description}`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Create Budget Wizard Modal */}
      <CreateBudgetWizard open={createBudgetOpen} onOpenChange={setCreateBudgetOpen} />

      {/* Add Transaction Modal */}
      <AddTransactionModal open={addTransactionOpen} onOpenChange={setAddTransactionOpen} />
    </>
  )
}
