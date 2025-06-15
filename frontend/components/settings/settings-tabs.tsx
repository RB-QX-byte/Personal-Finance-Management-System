"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "./profile-settings"
import { BankConnections } from "./bank-connections"
import { SecuritySettings } from "./security-settings"
import { PreferencesSettings } from "./preferences-settings"

export function SettingsTabs() {
  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="banks">Bank Connections</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileSettings />
      </TabsContent>

      <TabsContent value="banks">
        <BankConnections />
      </TabsContent>

      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>

      <TabsContent value="preferences">
        <PreferencesSettings />
      </TabsContent>
    </Tabs>
  )
}
// v0-block-end
