"use client";

import { useState, useEffect } from "react";
import { Loader2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { calculateSplits } from "@/lib/utils/splits";
import { CATEGORIES, getCurrencySymbol } from "@/lib/utils/format";
import { RECURRENCE_OPTIONS, calculateNextOccurrence } from "@/lib/utils/recurring";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ExpenseWithRelations, SplitType, Category, RecurrenceFrequency } from "@/lib/types";

interface Member {
  id: string;
  name: string;
}

interface ExpenseEditModalProps {
  expense: ExpenseWithRelations;
  members: Member[];
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function ExpenseEditModal({
  expense,
  members,
  currency,
  open,
  onOpenChange,
  onSaved,
}: ExpenseEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>(expense.split_type);
  const [category, setCategory] = useState<Category>(expense.category);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [description, setDescription] = useState(expense.description);
  const [paidBy, setPaidBy] = useState(expense.paid_by);
  const [expenseDate, setExpenseDate] = useState(expense.expense_date);

  // Recurring expense options
  const [isRecurring, setIsRecurring] = useState(expense.is_recurring);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    expense.recurrence_frequency || "monthly"
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(expense.recurrence_end_date || "");

  const [splitValues, setSplitValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    expense.splits?.forEach((split) => {
      if (expense.split_type === "percentage" && split.percentage != null) {
        initial[split.user_id] = split.percentage;
      } else if (expense.split_type === "shares" && split.shares != null) {
        initial[split.user_id] = split.shares;
      } else if (expense.split_type === "exact") {
        initial[split.user_id] = split.amount;
      } else {
        initial[split.user_id] = 1;
      }
    });
    // Fill in missing members
    members.forEach((m) => {
      if (!(m.id in initial)) {
        initial[m.id] = splitType === "percentage" ? 0 : splitType === "exact" ? 0 : 1;
      }
    });
    return initial;
  });

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(expense.splits?.map((s) => s.user_id) || members.map((m) => m.id))
  );

  useEffect(() => {
    // Reset values when split type changes
    const updated: Record<string, number> = {};
    members.forEach((m) => {
      if (splitType === "percentage") updated[m.id] = 100 / members.length;
      else if (splitType === "exact") updated[m.id] = 0;
      else updated[m.id] = 1;
    });
    setSplitValues(updated);
  }, [splitType, members]);

  function toggleMember(id: string) {
    const next = new Set(selectedMembers);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedMembers(next);
  }

  function updateSplitValue(userId: string, value: number) {
    setSplitValues((prev) => ({ ...prev, [userId]: value }));
  }

  async function handleSave() {
    setLoading(true);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toast({ title: "Invalid amount", description: "Please enter a valid amount", variant: "destructive" });
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Calculate next occurrence date for recurring expenses
      const nextOccurrenceDate = isRecurring
        ? format(calculateNextOccurrence(expenseDate, recurrenceFrequency), "yyyy-MM-dd")
        : null;

      // Update the expense
      const { error: expenseError } = await supabase
        .from("expenses")
        .update({
          description,
          amount: numAmount,
          category,
          paid_by: paidBy,
          expense_date: expenseDate,
          split_type: splitType,
          is_recurring: isRecurring,
          recurrence_frequency: isRecurring ? recurrenceFrequency : null,
          recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
          next_occurrence_date: nextOccurrenceDate,
        })
        .eq("id", expense.id);

      if (expenseError) throw new Error(expenseError.message);

      // Delete old splits and create new ones
      await supabase.from("expense_splits").delete().eq("expense_id", expense.id);

      const activeMemberIds = Array.from(selectedMembers);
      const splitInputs = activeMemberIds.map((userId) => ({
        userId,
        value: splitValues[userId] ?? (splitType === "percentage" ? 100 / activeMemberIds.length : 1),
      }));

      const splits = calculateSplits(numAmount, splitType, activeMemberIds, splitInputs);

      const { error: splitError } = await supabase.from("expense_splits").insert(
        splits.map((s) => ({
          expense_id: expense.id,
          user_id: s.userId,
          amount: s.amount,
          percentage: splitType === "percentage" ? splitInputs.find((i) => i.userId === s.userId)?.value : null,
          shares: splitType === "shares" ? splitInputs.find((i) => i.userId === s.userId)?.value : null,
        }))
      );

      if (splitError) throw new Error(splitError.message);

      toast({ title: "Saved", description: "Expense has been updated." });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update expense",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const currSymbol = getCurrencySymbol(currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {currSymbol}
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-xl h-12 font-semibold"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was it for?"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value as Category)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm border transition-colors ${
                    category === cat.value
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paid by */}
          <div className="space-y-2">
            <Label>Paid by</Label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          {/* Recurring */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </div>
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Make recurring</span>
              </div>
            </label>

            {isRecurring && (
              <Card>
                <CardContent className="p-3 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Frequency</Label>
                    <select
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                      className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {RECURRENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">End date (optional)</Label>
                    <Input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      min={expenseDate}
                    />
                    <p className="text-xs text-gray-400">Leave empty for no end date</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Split type */}
          <div className="space-y-2">
            <Label>Split</Label>
            <Tabs value={splitType} onValueChange={(v) => setSplitType(v as SplitType)}>
              <TabsList className="w-full">
                <TabsTrigger value="equal" className="flex-1">Equal</TabsTrigger>
                <TabsTrigger value="percentage" className="flex-1">%</TabsTrigger>
                <TabsTrigger value="exact" className="flex-1">Exact</TabsTrigger>
                <TabsTrigger value="shares" className="flex-1">Shares</TabsTrigger>
              </TabsList>

              <TabsContent value="equal">
                <Card>
                  <CardContent className="p-3 space-y-2">
                    {members.map((m) => (
                      <label key={m.id} className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(m.id)}
                          onChange={() => toggleMember(m.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="flex-1">{m.name}</span>
                        {selectedMembers.has(m.id) && amount && (
                          <span className="text-gray-500">
                            {currSymbol}
                            {(parseFloat(amount) / selectedMembers.size).toFixed(2)}
                          </span>
                        )}
                      </label>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="percentage">
                <Card>
                  <CardContent className="p-3 space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 text-sm">
                        <span className="flex-1">{m.name}</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={splitValues[m.id] ?? 0}
                            onChange={(e) => updateSplitValue(m.id, parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right"
                          />
                          <span className="text-gray-400">%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exact">
                <Card>
                  <CardContent className="p-3 space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 text-sm">
                        <span className="flex-1">{m.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">{currSymbol}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={splitValues[m.id] ?? 0}
                            onChange={(e) => updateSplitValue(m.id, parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shares">
                <Card>
                  <CardContent className="p-3 space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 text-sm">
                        <span className="flex-1">{m.name}</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={splitValues[m.id] ?? 1}
                          onChange={(e) => updateSplitValue(m.id, parseInt(e.target.value) || 0)}
                          className="w-20 h-8 text-right"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !description.trim()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
