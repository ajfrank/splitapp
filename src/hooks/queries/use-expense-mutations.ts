"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ExpenseWithRelations } from "@/lib/types";

interface CreateExpenseParams {
  groupId: string;
  expense: {
    description: string;
    amount: number;
    currency: string;
    category: string;
    paid_by: string;
    expense_date: string;
    split_type: string;
    receipt_url?: string;
    is_recurring?: boolean;
    recurrence_frequency?: string | null;
    recurrence_end_date?: string | null;
    next_occurrence_date?: string | null;
  };
  splits: {
    user_id: string;
    amount: number;
    percentage?: number | null;
    shares?: number | null;
  }[];
}

interface DeleteExpenseParams {
  expenseId: string;
  groupId: string;
}

/**
 * Mutation hook for creating expenses with optimistic updates
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, expense, splits }: CreateExpenseParams) => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("expenses")
        .insert({ group_id: groupId, ...expense })
        .select()
        .single();

      if (error) throw error;

      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splits.map((s) => ({ expense_id: data.id, ...s })));

      if (splitError) {
        // Rollback expense
        await supabase.from("expenses").delete().eq("id", data.id);
        throw splitError;
      }

      return data;
    },
    onSuccess: (_, { groupId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
      toast({ title: "Created", description: "Expense has been added." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mutation hook for deleting expenses with optimistic updates
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId }: DeleteExpenseParams) => {
      const supabase = createClient();

      await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
      const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

      if (error) throw error;
    },
    onMutate: async ({ expenseId, groupId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["expenses", groupId] });

      // Snapshot previous value
      const previousExpenses = queryClient.getQueryData<ExpenseWithRelations[]>(["expenses", groupId]);

      // Optimistically remove the expense
      queryClient.setQueryData<ExpenseWithRelations[]>(
        ["expenses", groupId],
        (old) => old?.filter((e) => e.id !== expenseId) ?? []
      );

      return { previousExpenses };
    },
    onError: (error, { groupId }, context) => {
      // Rollback on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(["expenses", groupId], context.previousExpenses);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete expense.",
        variant: "destructive",
      });
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
      toast({ title: "Deleted", description: "Expense has been deleted." });
    },
  });
}

/**
 * Mutation hook for creating settlements
 */
export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      fromUser,
      toUser,
      amount,
      currency,
    }: {
      groupId: string;
      fromUser: string;
      toUser: string;
      amount: number;
      currency: string;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("settlements")
        .insert({
          group_id: groupId,
          from_user: fromUser,
          to_user: toUser,
          amount,
          currency,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      toast({ title: "Settled", description: "Payment has been recorded." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record settlement.",
        variant: "destructive",
      });
    },
  });
}
