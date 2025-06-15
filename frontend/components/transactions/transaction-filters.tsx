"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Tag } from "lucide-react"

const categories = ["All", "Income", "Shopping", "Food & Drink", "Transportation", "Utilities", "Entertainment"]
const timeRanges = ["This Week", "This Month", "Last 3 Months", "This Year"]

export function TransactionFilters() {
  return (
    <Card className="backdrop-blur-sm bg-card/50 border-border/40">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Categories</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button key={category} variant="outline" size="sm" className="h-8 text-xs">
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Time Range</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {timeRanges.map((range) => (
                <Button key={range} variant="outline" size="sm" className="h-8 text-xs">
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
// v0-block-end
