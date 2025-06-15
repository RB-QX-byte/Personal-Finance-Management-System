"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BudgetStepCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function BudgetStepCard({ title, description, children }: BudgetStepCardProps) {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  )
}
// v0-block-end
