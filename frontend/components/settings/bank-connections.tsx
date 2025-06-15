"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

const connectedBanks = [
  {
    id: 1,
    name: "Chase Bank",
    accountType: "Checking",
    lastSync: "2 hours ago",
    status: "connected",
    balance: "$12,450.00",
    logo: "🏦",
  },
  {
    id: 2,
    name: "Wells Fargo",
    accountType: "Savings",
    lastSync: "1 day ago",
    status: "connected",
    balance: "$25,780.00",
    logo: "🏛️",
  },
  {
    id: 3,
    name: "American Express",
    accountType: "Credit Card",
    lastSync: "5 hours ago",
    status: "error",
    balance: "-$2,340.00",
    logo: "💳",
  },
]

export function BankConnections() {
  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-card/50 border-border/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Connected Accounts</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manage your bank and credit card connections</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedBanks.map((bank) => (
            <div
              key={bank.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center text-xl">
                  {bank.logo}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{bank.name}</h3>
                  <p className="text-sm text-muted-foreground">{bank.accountType}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {bank.status === "connected" ? (
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-xs text-muted-foreground">Last sync: {bank.lastSync}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-foreground">{bank.balance}</p>
                  <Badge variant={bank.status === "connected" ? "secondary" : "destructive"} className="text-xs">
                    {bank.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Account Aggregator Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-blue-600 dark:text-blue-400">Secure Connection</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  All bank connections use 256-bit encryption and are read-only. We never store your banking
                  credentials.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-accent/30">
              <h4 className="font-medium text-foreground">Auto-sync Frequency</h4>
              <p className="text-sm text-muted-foreground">Every 4 hours</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/30">
              <h4 className="font-medium text-foreground">Data Retention</h4>
              <p className="text-sm text-muted-foreground">24 months</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
// v0-block-end
