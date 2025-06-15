"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { X, CalendarIcon, Camera, Upload, Check, Search, Plus, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTransactions } from "@/hooks/use-transactions"

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TransactionForm {
  amount: string
  date: Date
  category: string
  merchant: string
  tags: string[]
  notes: string
  attachment?: File
}

const categories = [
  { id: "food", name: "Food & Dining", icon: "🍽️", color: "bg-orange-500" },
  { id: "transport", name: "Transportation", icon: "🚗", color: "bg-green-500" },
  { id: "shopping", name: "Shopping", icon: "🛒", color: "bg-blue-500" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "bg-purple-500" },
  { id: "utilities", name: "Utilities", icon: "⚡", color: "bg-yellow-500" },
  { id: "healthcare", name: "Healthcare", icon: "🏥", color: "bg-red-500" },
  { id: "education", name: "Education", icon: "📚", color: "bg-indigo-500" },
  { id: "travel", name: "Travel", icon: "✈️", color: "bg-pink-500" },
  { id: "income", name: "Income", icon: "💰", color: "bg-emerald-500" },
  { id: "other", name: "Other", icon: "📝", color: "bg-gray-500" },
]

const recentMerchants = [
  { name: "Amazon", emoji: "📦" },
  { name: "Starbucks", emoji: "☕" },
  { name: "Shell", emoji: "⛽" },
  { name: "Netflix", emoji: "🎬" },
  { name: "Uber", emoji: "🚗" },
]

export function AddTransactionModal({ open, onOpenChange }: AddTransactionModalProps) {
  const { addTransaction } = useTransactions()
  const [form, setForm] = useState<TransactionForm>({
    amount: "",
    date: new Date(),
    category: "",
    merchant: "",
    tags: [],
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [merchantSearch, setMerchantSearch] = useState("")
  const [newTag, setNewTag] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const amountRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus amount field when modal opens
  useEffect(() => {
    if (open && amountRef.current) {
      setTimeout(() => amountRef.current?.focus(), 100)
    }
  }, [open])

  // Format amount input
  const handleAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    let cleaned = value.replace(/[^\d.]/g, "")

    // Handle "k" suffix for thousands
    if (value.toLowerCase().includes("k")) {
      const num = Number.parseFloat(cleaned) * 1000
      cleaned = num.toString()
    }

    // Format with commas and currency
    if (cleaned && !isNaN(Number.parseFloat(cleaned))) {
      const formatted = Number.parseFloat(cleaned).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      setForm((prev) => ({ ...prev, amount: formatted }))
    } else {
      setForm((prev) => ({ ...prev, amount: cleaned }))
    }

    // Clear amount error
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.amount || Number.parseFloat(form.amount.replace(/[^\d.]/g, "")) <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }

    if (!form.category) {
      newErrors.category = "Please select a category"
    }

    if (!form.merchant.trim()) {
      newErrors.merchant = "Please enter a merchant name"
    }

    setErrors(newErrors)

    // Trigger shake animation on error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = document.querySelector(`[data-error="true"]`) as HTMLElement
      if (firstErrorField) {
        firstErrorField.style.animation = "shake 0.08s ease-in-out 0s 2"
        setTimeout(() => {
          firstErrorField.style.animation = ""
        }, 160)
      }
    }

    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const transactionData = {
        amount: Number.parseFloat(form.amount.replace(/[^\d.]/g, "")),
        date: form.date,
        category: form.category,
        merchant: form.merchant,
        tags: form.tags,
        notes: form.notes,
        attachment: form.attachment,
      }

      await addTransaction(transactionData)

      // Success toast
      toast({
        title: "Transaction added ✓",
        description: `${form.merchant} - $${form.amount}`,
        duration: 3000,
      })

      // Reset form and close modal
      setForm({
        amount: "",
        date: new Date(),
        category: "",
        merchant: "",
        tags: [],
        notes: "",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error adding transaction",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle tag addition
  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag("")
    }
  }

  // Handle tag removal
  const removeTag = (tagToRemove: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }))
  }

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setForm((prev) => ({ ...prev, attachment: file }))
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const filteredCategories = categories.filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))

  const filteredMerchants = recentMerchants.filter((merchant) =>
    merchant.name.toLowerCase().includes(merchantSearch.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 bg-card/95 backdrop-blur-xl border-border/40">
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
            <DialogTitle className="text-xl font-semibold">Add Transaction</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Amount Field */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount *
              </Label>
              <div className="relative">
                <Input
                  ref={amountRef}
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={cn(
                    "text-2xl font-bold h-14 pl-8 pr-4",
                    errors.amount && "border-destructive focus-visible:ring-destructive",
                  )}
                  data-error={!!errors.amount}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                  $
                </span>
                {form.amount && !errors.amount && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Check className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}
              </div>
              {errors.amount && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.amount}
                </motion.p>
              )}
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !form.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.date ? format(form.date, "PPP 'at' p") : "Select date and time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={(date) => date && setForm((prev) => ({ ...prev, date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category *</Label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {filteredCategories.map((category) => (
                    <motion.button
                      key={category.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setForm((prev) => ({ ...prev, category: category.id }))}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border transition-all",
                        form.category === category.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium truncate">{category.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              {errors.category && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.category}
                </motion.p>
              )}
            </div>

            {/* Merchant */}
            <div className="space-y-2">
              <Label htmlFor="merchant" className="text-sm font-medium">
                Merchant *
              </Label>
              <div className="space-y-3">
                <Input
                  id="merchant"
                  placeholder="Enter merchant name..."
                  value={form.merchant}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, merchant: e.target.value }))
                    setMerchantSearch(e.target.value)
                    if (errors.merchant) {
                      setErrors((prev) => ({ ...prev, merchant: "" }))
                    }
                  }}
                  className={cn(errors.merchant && "border-destructive focus-visible:ring-destructive")}
                  data-error={!!errors.merchant}
                />
                {merchantSearch && filteredMerchants.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filteredMerchants.map((merchant) => (
                      <Button
                        key={merchant.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, merchant: merchant.name }))
                          setMerchantSearch("")
                        }}
                        className="h-8 text-xs"
                      >
                        <span className="mr-1">{merchant.emoji}</span>
                        {merchant.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {errors.merchant && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.merchant}
                </motion.p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags (Optional)</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} size="sm" disabled={!newTag.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="min-h-[80px] resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{form.notes.length}/200 characters</p>
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Attachment (Optional)</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {form.attachment ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">📎</div>
                      <span className="text-sm font-medium">{form.attachment.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm((prev) => ({ ...prev, attachment: undefined }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Drag and drop a file here, or click to select</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex gap-3 p-6 border-t border-border/40 bg-card/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Transaction"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// Shake animation keyframes
const shakeKeyframes = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
`

// Inject shake animation styles
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = shakeKeyframes
  document.head.appendChild(style)
}
// v0-block-end
