"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ExpenseWithRelations } from "@/lib/types";

/**
 * Fetch all expenses for a group
 */
export function useExpenses(groupId: string) {
  return useQuery({
    queryKey: ["expenses", groupId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenses")
        .select("*, paid_by_user:users!paid_by(*), splits:expense_splits(*, user:users(*))")
        .eq("group_id", groupId)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ExpenseWithRelations[];
    },
    enabled: !!groupId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch recurring expenses that need processing
 */
export function useRecurringExpenses(groupId: string) {
  return useQuery({
    queryKey: ["recurring-expenses", groupId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenses")
        .select("*, splits:expense_splits(*)")
        .eq("group_id", groupId)
        .eq("is_recurring", true)
        .not("next_occurrence_date", "is", null);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}
