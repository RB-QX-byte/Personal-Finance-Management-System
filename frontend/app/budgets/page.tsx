import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BudgetOverview } from "@/components/budgets/budget-overview"
import { BudgetCategories } from "@/components/budgets/budget-categories"
import { BudgetInsights } from "@/components/budgets/budget-insights"

export default function BudgetsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
            <p className="text-muted-foreground">Plan and track your spending goals</p>
          </div>
        </div>

        <BudgetOverview />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BudgetCategories />
          </div>
          <div>
            <BudgetInsights />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
// v0-block-end
