"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, Smartphone, Key, Eye, AlertTriangle } from "lucide-react"

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-green-600 dark:text-green-400">2FA Enabled</h4>
                <p className="text-sm text-muted-foreground">
                  Your account is protected with two-factor authentication
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
              Active
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label>SMS Authentication</Label>
                  <p className="text-xs text-muted-foreground">+1 (555) ***-4567</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label>Authenticator App</Label>
                  <p className="text-xs text-muted-foreground">Google Authenticator</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Manage 2FA Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Biometric Login</Label>
                <p className="text-xs text-muted-foreground">Use fingerprint or face recognition</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-xs text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Login Notifications</Label>
                <p className="text-xs text-muted-foreground">Get notified of new device logins</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Data Export</Label>
                <p className="text-xs text-muted-foreground">Allow downloading your financial data</p>
              </div>
              <Switch />
            </div>
          </div>

          <div className="pt-4 border-t border-border/40">
            <Button variant="outline" className="w-full mb-3">
              <Eye className="w-4 h-4 mr-2" />
              View Active Sessions
            </Button>
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Delete Account</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
// v0-block-end
