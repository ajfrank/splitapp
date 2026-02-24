"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ExpenseWithRelations } from "@/lib/types";

const PAGE_SIZE = 20;

interface UsePaginatedExpensesOptions {
  groupId: string;
  initialData?: ExpenseWithRelations[];
}

interface UsePaginatedExpensesResult {
  expenses: ExpenseWithRelations[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginatedExpenses({
  groupId,
  initialData = [],
}: UsePaginatedExpensesOptions): UsePaginatedExpensesResult {
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const offsetRef = useRef(initialData.length);
  const supabase = createClient();

  const fetchExpenses = useCallback(
    async (offset: number, append: boolean) => {
      const { data, error, count } = await supabase
        .from("expenses")
        .select(
          "*, paid_by_user:users!paid_by(*), splits:expense_splits(*, user:users(*))",
          { count: "exact" }
        )
        .eq("group_id", groupId)
        .order("expense_date", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching expenses:", error);
        return;
      }

      const newExpenses = (data as ExpenseWithRelations[]) ?? [];

      if (append) {
        setExpenses((prev) => [...prev, ...newExpenses]);
      } else {
        setExpenses(newExpenses);
      }

      setTotalCount(count ?? 0);
      setHasMore(newExpenses.length === PAGE_SIZE);
      offsetRef.current = offset + newExpenses.length;
    },
    [supabase, groupId]
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchExpenses(offsetRef.current, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchExpenses]);

  const refresh = useCallback(async () => {
    setLoading(true);
    offsetRef.current = 0;
    await fetchExpenses(0, false);
    setLoading(false);
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    loadMore,
    refresh,
  };
}
