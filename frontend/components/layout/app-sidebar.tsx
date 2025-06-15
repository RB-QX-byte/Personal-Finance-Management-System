"use client"

import { Home, CreditCard, TrendingUp, Settings, Wallet, Target } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CreateBudgetWizard } from "@/components/budgets/create-budget-wizard"
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: CreditCard,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: Target,
  },
  {
    title: "Forecast",
    url: "/forecast",
    icon: TrendingUp,
  },
]

const quickActions = [
  {
    id: "add-transaction",
    title: "Add Transaction",
    description: "Record a new expense or income",
    icon: Wallet,
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
    url: "/goals/new",
    icon: TrendingUp,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    action: "navigate",
  },
  {
    id: "pay-bills",
    title: "Pay Bills",
    url: "/bills",
    icon: CreditCard,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    action: "navigate",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [createBudgetOpen, setCreateBudgetOpen] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)

  const handleQuickAction = (actionId: string, actionType: string, url?: string) => {
    switch (actionId) {
      case "create-budget":
        setCreateBudgetOpen(true)
        break
      case "add-transaction":
        setAddTransactionOpen(true)
        break
      default:
        if (actionType === "navigate" && url) {
          window.location.href = url
        }
        break
    }
  }

  return (
    <>
      <Sidebar className="border-r border-border/40 backdrop-blur-xl bg-card/30">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">FinanceFlow</h2>
              <p className="text-xs text-muted-foreground">Personal Finance</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 px-3 py-2 pl-4 rounded-lg transition-all hover:bg-accent/50"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickActions.map((action) => (
                  <SidebarMenuItem key={action.id}>
                    <SidebarMenuButton asChild>
                      <button
                        type="button"
                        onClick={() => handleQuickAction(action.id, action.action, action.url)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-accent/50 w-full text-left"
                        onMouseEnter={() => {
                          // Prefetch data on hover for better performance
                          if (action.id === "create-budget") {
                            // Prefetch budget categories and spending data
                            fetch("/api/budget-demo").catch(() => {})
                          }
                        }}
                        aria-label={`${action.title}: ${action.description}`}
                      >
                        <div className={`p-2 rounded-lg ${action.bgColor}`}>
                          <action.icon className={`w-4 h-4 ${action.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground block truncate">{action.title}</span>
                          <span className="text-xs text-muted-foreground block truncate">{action.description}</span>
                        </div>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-accent/50"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/40">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john@example.com</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Pro
            </Badge>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Create Budget Wizard Modal */}
      <CreateBudgetWizard open={createBudgetOpen} onOpenChange={setCreateBudgetOpen} />

      {/* Add Transaction Modal */}
      <AddTransactionModal open={addTransactionOpen} onOpenChange={setAddTransactionOpen} />
    </>
  )
}
