"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateNextOccurrence, shouldGenerateInstance } from "@/lib/utils/recurring";
import { format, parseISO } from "date-fns";

/**
 * Hook to process recurring expenses and generate new instances
 */
export function useRecurringExpenses() {
  const processRecurringExpenses = useCallback(async (groupId: string) => {
    const supabase = createClient();

    // Fetch recurring expenses that might need processing
    const { data: recurringExpenses, error } = await supabase
      .from("expenses")
      .select("*, splits:expense_splits(*)")
      .eq("group_id", groupId)
      .eq("is_recurring", true)
      .not("next_occurrence_date", "is", null);

    if (error || !recurringExpenses) {
      console.error("Error fetching recurring expenses:", error);
      return { created: 0, errors: [] };
    }

    let created = 0;
    const errors: string[] = [];

    for (const expense of recurringExpenses) {
      // Check if we should generate a new instance
      if (!shouldGenerateInstance(expense.next_occurrence_date, expense.recurrence_end_date)) {
        continue;
      }

      try {
        // Create the new expense instance
        const newExpenseDate = expense.next_occurrence_date;
        const { data: newExpense, error: insertError } = await supabase
          .from("expenses")
          .insert({
            group_id: expense.group_id,
            description: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            category: expense.category,
            paid_by: expense.paid_by,
            expense_date: newExpenseDate,
            split_type: expense.split_type,
            receipt_url: expense.receipt_url,
            is_recurring: false, // Generated instances are not recurring
            parent_recurring_id: expense.id,
          })
          .select()
          .single();

        if (insertError) {
          errors.push(`Failed to create instance for "${expense.description}": ${insertError.message}`);
          continue;
        }

        // Copy splits from the parent expense
        if (expense.splits && expense.splits.length > 0) {
          const { error: splitsError } = await supabase
            .from("expense_splits")
            .insert(
              expense.splits.map((split: { user_id: string; amount: number; percentage: number | null; shares: number | null }) => ({
                expense_id: newExpense.id,
                user_id: split.user_id,
                amount: split.amount,
                percentage: split.percentage,
                shares: split.shares,
              }))
            );

          if (splitsError) {
            // Rollback the expense if splits fail
            await supabase.from("expenses").delete().eq("id", newExpense.id);
            errors.push(`Failed to create splits for "${expense.description}": ${splitsError.message}`);
            continue;
          }
        }

        // Update the parent expense with the next occurrence date
        const nextDate = calculateNextOccurrence(
          parseISO(newExpenseDate!),
          expense.recurrence_frequency!
        );

        // Check if next date is past the end date
        let shouldDeactivate = false;
        if (expense.recurrence_end_date) {
          const endDate = parseISO(expense.recurrence_end_date);
          if (nextDate > endDate) {
            shouldDeactivate = true;
          }
        }

        await supabase
          .from("expenses")
          .update({
            next_occurrence_date: shouldDeactivate ? null : format(nextDate, "yyyy-MM-dd"),
            is_recurring: !shouldDeactivate,
          })
          .eq("id", expense.id);

        created++;
      } catch (err) {
        errors.push(`Error processing "${expense.description}": ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return { created, errors };
  }, []);

  return { processRecurringExpenses };
}
