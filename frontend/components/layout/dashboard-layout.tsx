"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Header } from "./header"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <AppSidebar />
        <main className="flex-1 transition-all duration-300">
          <Header />
          <div className="container mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
// v0-block-end
