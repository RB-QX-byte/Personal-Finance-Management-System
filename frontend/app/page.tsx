import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { NetWorthHero } from "@/components/dashboard/net-worth-hero"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Hero Section with Net Worth */}
        <NetWorthHero />

        {/* KPI Cards Grid */}
        <KPICards />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SpendingChart />
            <RecentTransactions />
          </div>
          <div className="space-y-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
// v0-block-end
