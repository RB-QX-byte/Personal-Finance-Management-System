import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { TransactionStats } from "@/components/transactions/transaction-stats"

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Track and manage your financial activity</p>
          </div>
        </div>

        <TransactionStats />
        <TransactionFilters />
        <TransactionsList />
      </div>
    </DashboardLayout>
  )
}
// v0-block-end
