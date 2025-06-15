import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <SettingsTabs />
      </div>
    </DashboardLayout>
  )
}
// v0-block-end
