"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  CalendarIcon,
  TrendingUp,
  AlertTriangle,
  Check,
  Target,
  Brain,
  Zap,
} from "lucide-react"
import { format, addWeeks, addMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { useBudgets } from "@/hooks/use-budgets"
import { BudgetStepCard } from "./budget-step-card"

interface CreateBudgetWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface BudgetForm {
  categories: string[]
  amount: number
  duration: "monthly" | "weekly" | "custom"
  startDate: Date
  endDate: Date
  notifications: {
    at75: boolean
    at100: boolean
  }
}

interface CategoryData {
  id: string
  name: string
  icon: string
  color: string
  avgSpend: number
  trend: number[]
}

const STEPS = [
  { id: 1, title: "Select Categories", description: "Choose spending categories to budget" },
  { id: 2, title: "Set Limit", description: "Define your spending limit" },
  { id: 3, title: "Choose Duration", description: "Set the budget timeframe" },
  { id: 4, title: "Review & Alerts", description: "Review and configure notifications" },
]

export function CreateBudgetWizard({ open, onOpenChange }: CreateBudgetWizardProps) {
  const { createBudget } = useBudgets()
  const [currentStep, setCurrentStep] = useState(1)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [form, setForm] = useState<BudgetForm>({
    categories: [],
    amount: 0,
    duration: "monthly",
    startDate: new Date(),
    endDate: addMonths(new Date(), 1),
    notifications: {
      at75: true,
      at100: true,
    },
  })
  const [categorySearch, setCategorySearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Prefetch budget data when modal opens
  useEffect(() => {
    if (open && categories.length === 0) {
      fetchBudgetData()
    }
  }, [open])

  const fetchBudgetData = useCallback(async () => {
    setIsLoadingData(true)
    try {
      const response = await fetch("/api/budget-demo")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch budget data:", error)
      // Fallback to default categories
      setCategories([
        {
          id: "food",
          name: "Food & Dining",
          icon: "🍽️",
          color: "bg-orange-500",
          avgSpend: 650,
          trend: [45, 52, 48, 65, 58, 62, 67],
        },
        {
          id: "transport",
          name: "Transportation",
          icon: "🚗",
          color: "bg-green-500",
          avgSpend: 420,
          trend: [38, 42, 45, 41, 39, 44, 42],
        },
        {
          id: "shopping",
          name: "Shopping",
          icon: "🛒",
          color: "bg-blue-500",
          avgSpend: 580,
          trend: [65, 72, 58, 89, 76, 82, 58],
        },
        {
          id: "entertainment",
          name: "Entertainment",
          icon: "🎬",
          color: "bg-purple-500",
          avgSpend: 280,
          trend: [25, 32, 28, 35, 30, 28, 32],
        },
        {
          id: "utilities",
          name: "Utilities",
          icon: "⚡",
          color: "bg-yellow-500",
          avgSpend: 240,
          trend: [24, 24, 25, 23, 24, 25, 24],
        },
        {
          id: "healthcare",
          name: "Healthcare",
          icon: "🏥",
          color: "bg-red-500",
          avgSpend: 180,
          trend: [15, 18, 22, 16, 19, 17, 18],
        },
      ])
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  // Calculate suggested amount based on selected categories
  const suggestedAmount = form.categories.reduce((total, categoryId) => {
    const category = categories.find((c) => c.id === categoryId)
    return total + (category?.avgSpend || 0)
  }, 0)

  // Update amount when categories change
  useEffect(() => {
    if (form.categories.length > 0 && form.amount === 0) {
      setForm((prev) => ({ ...prev, amount: suggestedAmount }))
    }
  }, [form.categories, suggestedAmount])

  // Update end date when duration changes
  useEffect(() => {
    if (form.duration === "monthly") {
      setForm((prev) => ({ ...prev, endDate: addMonths(prev.startDate, 1) }))
    } else if (form.duration === "weekly") {
      setForm((prev) => ({ ...prev, endDate: addWeeks(prev.startDate, 1) }))
    }
  }, [form.duration, form.startDate])

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (form.categories.length === 0) {
          newErrors.categories = "Please select at least one category"
        }
        break
      case 2:
        if (form.amount <= 0) {
          newErrors.amount = "Please enter a valid budget amount"
        }
        break
      case 3:
        if (form.duration === "custom" && form.endDate <= form.startDate) {
          newErrors.dateRange = "End date must be after start date"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      setErrors({}) // Clear errors when going back
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }))

    // Clear category error
    if (errors.categories) {
      setErrors((prev) => ({ ...prev, categories: "" }))
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsSubmitting(true)

    try {
      await createBudget({
        categories: form.categories,
        amount: form.amount,
        duration: form.duration,
        startDate: form.startDate,
        endDate: form.endDate,
        notifications: form.notifications,
      })

      toast({
        title: "Budget created successfully! 🎯",
        description: `$${form.amount.toLocaleString()} budget for ${form.categories.length} categories`,
        duration: 3000,
      })

      // Reset form and close modal
      setForm({
        categories: [],
        amount: 0,
        duration: "monthly",
        startDate: new Date(),
        endDate: addMonths(new Date(), 1),
        notifications: { at75: true, at100: true },
      })
      setCurrentStep(1)
      setErrors({})
      onOpenChange(false)
    } catch {
      toast({
        title: "Error creating budget",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return form.categories.length > 0
      case 2:
        return form.amount > 0
      case 3:
        return form.duration !== "custom" || form.endDate > form.startDate
      case 4:
        return true
      default:
        return false
    }
  }

  const filteredCategories = categories.filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return

      switch (event.key) {
        case "Escape":
          onOpenChange(false)
          break
        case "ArrowRight":
          if (event.ctrlKey && canProceed()) {
            handleNext()
          }
          break
        case "ArrowLeft":
          if (event.ctrlKey && currentStep > 1) {
            handlePrevious()
          }
          break
        case "Enter":
          if (event.ctrlKey) {
            if (currentStep === STEPS.length) {
              handleSubmit()
            } else if (canProceed()) {
              handleNext()
            }
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, currentStep])

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BudgetStepCard title="Select Categories" description="Choose the spending categories you want to budget for">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-10"
                  aria-label="Search budget categories"
                />
              </div>

              {errors.categories && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {errors.categories}
                </motion.div>
              )}

              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto"
                role="group"
                aria-label="Budget categories"
              >
                {isLoadingData ? (
                  <div className="col-span-2 flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading categories...
                    </div>
                  </div>
                ) : (
                  filteredCategories.map((category) => {
                    const isSelected = form.categories.includes(category.id)

                    return (
                      <motion.button
                        key={category.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCategoryToggle(category.id)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          isSelected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent",
                        )}
                        aria-pressed={isSelected}
                        aria-describedby={`category-${category.id}-description`}
                        tabIndex={0}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl" aria-hidden="true">
                            {category.icon}
                          </span>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p id={`category-${category.id}-description`} className="text-xs text-muted-foreground">
                              Avg: ${category.avgSpend}/month
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mini sparkline */}
                          <div
                            className="flex items-end gap-0.5 h-6"
                            aria-label={`Spending trend for ${category.name}`}
                          >
                            {category.trend.map((value, trendIndex) => (
                              <div
                                key={trendIndex}
                                className={cn(
                                  "w-1 rounded-sm transition-colors",
                                  isSelected ? "bg-primary" : "bg-muted-foreground/30",
                                )}
                                style={{ height: `${(value / Math.max(...category.trend)) * 100}%` }}
                                aria-hidden="true"
                              />
                            ))}
                          </div>

                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                              aria-hidden="true"
                            >
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })
                )}
              </div>

              {form.categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-sm font-medium text-primary">{form.categories.length} categories selected</p>
                  <p className="text-xs text-muted-foreground">
                    Combined average spending: ${suggestedAmount.toLocaleString()}/month
                  </p>
                </motion.div>
              )}
            </div>
          </BudgetStepCard>
        )

      case 2:
        return (
          <BudgetStepCard
            title="Set Your Budget Limit"
            description="Define how much you want to spend on selected categories"
          >
            <div className="space-y-6">
              {/* Budget Amount Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="budget-amount" className="text-sm font-medium">
                    Budget Amount
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    Suggested: ${suggestedAmount.toLocaleString()}
                  </Badge>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="budget-amount"
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 0
                      setForm((prev) => ({ ...prev, amount: value }))
                      if (errors.amount) {
                        setErrors((prev) => ({ ...prev, amount: "" }))
                      }
                    }}
                    className={cn(
                      "text-2xl font-bold h-14 pl-8 pr-4",
                      errors.amount && "border-destructive focus-visible:ring-destructive",
                    )}
                    placeholder="0"
                    min="0"
                    step="50"
                    aria-describedby="budget-amount-error budget-amount-help"
                  />
                </div>

                {errors.amount && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="budget-amount-error"
                    className="text-sm text-destructive flex items-center gap-1"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {errors.amount}
                  </motion.div>
                )}

                {/* Slider */}
                <div className="space-y-2">
                  <Slider
                    value={[form.amount]}
                    onValueChange={([value]) => {
                      setForm((prev) => ({ ...prev, amount: value }))
                      if (errors.amount) {
                        setErrors((prev) => ({ ...prev, amount: "" }))
                      }
                    }}
                    max={suggestedAmount * 2}
                    min={0}
                    step={50}
                    className="w-full"
                    aria-label="Budget amount slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>${(suggestedAmount * 2).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Budget Visualization */}
              {form.amount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="relative w-32 h-32 mx-auto">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                      aria-label={`Budget visualization: ${Math.round((form.amount / suggestedAmount) * 100)}% of average spending`}
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/20"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className={cn(
                          "transition-colors",
                          form.amount <= suggestedAmount * 0.7
                            ? "text-primary"
                            : form.amount <= suggestedAmount * 1.2
                              ? "text-yellow-500"
                              : "text-red-500",
                        )}
                        strokeDasharray={`${Math.min((form.amount / (suggestedAmount * 1.5)) * 283, 283)} 283`}
                        initial={{ strokeDasharray: "0 283" }}
                        animate={{
                          strokeDasharray: `${Math.min((form.amount / (suggestedAmount * 1.5)) * 283, 283)} 283`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">
                          {Math.round((form.amount / suggestedAmount) * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">vs avg</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    {form.amount < suggestedAmount * 0.8 && (
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Conservative budget - great for saving!</span>
                      </div>
                    )}
                    {form.amount > suggestedAmount * 1.2 && (
                      <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">Above average - monitor closely</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </BudgetStepCard>
        )

      case 3:
        return (
          <BudgetStepCard title="Choose Duration" description="Set the timeframe for your budget">
            <div className="space-y-6">
              <RadioGroup
                value={form.duration}
                onValueChange={(value: "monthly" | "weekly" | "custom") =>
                  setForm((prev) => ({ ...prev, duration: value }))
                }
                className="space-y-3"
                aria-label="Budget duration options"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                    <div className="font-medium">Monthly</div>
                    <div className="text-sm text-muted-foreground">Budget resets every month</div>
                  </Label>
                  <Badge variant="secondary">Recommended</Badge>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                    <div className="font-medium">Weekly</div>
                    <div className="text-sm text-muted-foreground">Budget resets every week</div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="flex-1 cursor-pointer">
                    <div className="font-medium">Custom Range</div>
                    <div className="text-sm text-muted-foreground">Set your own start and end dates</div>
                  </Label>
                </div>
              </RadioGroup>

              {errors.dateRange && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {errors.dateRange}
                </motion.div>
              )}

              {form.duration === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="start-date"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            aria-label={`Start date: ${format(form.startDate, "PPP")}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(form.startDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.startDate}
                            onSelect={(date) => {
                              if (date) {
                                setForm((prev) => ({ ...prev, startDate: date }))
                                if (errors.dateRange) {
                                  setErrors((prev) => ({ ...prev, dateRange: "" }))
                                }
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="end-date"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            aria-label={`End date: ${format(form.endDate, "PPP")}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(form.endDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.endDate}
                            onSelect={(date) => {
                              if (date) {
                                setForm((prev) => ({ ...prev, endDate: date }))
                                if (errors.dateRange) {
                                  setErrors((prev) => ({ ...prev, dateRange: "" }))
                                }
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="p-4 rounded-lg bg-accent/30 border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Budget Summary</span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Duration: {format(form.startDate, "MMM d")} - {format(form.endDate, "MMM d, yyyy")}
                  </p>
                  <p>Categories: {form.categories.length} selected</p>
                  <p>Total Budget: ${form.amount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </BudgetStepCard>
        )

      case 4:
        return (
          <BudgetStepCard title="Review & Configure Alerts" description="Review your budget and set up notifications">
            <div className="space-y-6">
              {/* Budget Summary Card */}
              <div className="p-6 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Budget Summary</h3>
                    <p className="text-sm text-muted-foreground">Ready to create your budget</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">${form.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold capitalize">{form.duration}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Categories ({form.categories.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {form.categories.map((categoryId) => {
                      const category = categories.find((c) => c.id === categoryId)
                      return category ? (
                        <Badge key={categoryId} variant="secondary" className="text-xs">
                          <span className="mr-1" aria-hidden="true">
                            {category.icon}
                          </span>
                          {category.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Notification Settings</h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label htmlFor="alert-75" className="font-medium cursor-pointer">
                        75% Alert
                      </Label>
                      <p className="text-sm text-muted-foreground">Get notified when you reach 75% of your budget</p>
                    </div>
                    <Switch
                      id="alert-75"
                      checked={form.notifications.at75}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, at75: checked },
                        }))
                      }
                      aria-describedby="alert-75-description"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label htmlFor="alert-100" className="font-medium cursor-pointer">
                        100% Alert
                      </Label>
                      <p className="text-sm text-muted-foreground">Get notified when you reach your budget limit</p>
                    </div>
                    <Switch
                      id="alert-100"
                      checked={form.notifications.at100}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, at100: checked },
                        }))
                      }
                      aria-describedby="alert-100-description"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Preview */}
              <div className="space-y-3">
                <h4 className="font-medium">Budget Progress Preview</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current spending</span>
                    <span>$0 / ${form.amount.toLocaleString()}</span>
                  </div>
                  <Progress value={0} className="h-3" aria-label="Budget progress: 0% used" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% used</span>
                    <span>${form.amount.toLocaleString()} remaining</span>
                  </div>
                </div>
              </div>

              {/* AI Insights Preview */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">AI Insight</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on your spending patterns, this budget should help you save approximately $
                  {Math.round((suggestedAmount - form.amount) * 0.8)} per month while maintaining your lifestyle.
                </p>
              </div>
            </div>
          </BudgetStepCard>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-card/95 backdrop-blur-xl border-border/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{
            duration: 0.2,
            ease: [0.33, 1, 0.68, 1],
          }}
          className="flex flex-col h-full max-h-[90vh]"
        >
          <DialogHeader className="px-6 py-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">Create Budget</DialogTitle>
              <div
                className="flex items-center gap-2"
                role="progressbar"
                aria-valuenow={currentStep}
                aria-valuemin={1}
                aria-valuemax={STEPS.length}
              >
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      currentStep >= step.id ? "bg-primary" : "bg-muted",
                    )}
                    aria-label={`Step ${step.id} of ${STEPS.length}: ${step.title}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep} of {STEPS.length}
              </span>
              <span>{STEPS[currentStep - 1]?.title}</span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between p-6 border-t border-border/40 bg-card/50">
            <Button
              type="button"
              variant="ghost"
              onClick={currentStep === 1 ? () => onOpenChange(false) : handlePrevious}
              disabled={isSubmitting}
              aria-label={currentStep === 1 ? "Cancel budget creation" : "Go to previous step"}
            >
              {currentStep === 1 ? (
                "Cancel"
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={currentStep === STEPS.length ? handleSubmit : handleNext}
              disabled={!canProceed() || isSubmitting}
              aria-label={
                currentStep === STEPS.length ? "Create budget" : `Go to next step: ${STEPS[currentStep]?.title}`
              }
            >
              {currentStep === STEPS.length ? (
                isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1" />
                    Create Budget
                  </>
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
