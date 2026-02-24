"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import {
  SpendingByCategory,
  SpendingByMonth,
  SpendingTotals,
} from "@/components/analytics/spending-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { Group, ExpenseWithRelations } from "@/lib/types";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function AnalyticsPage({ params }: Props) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const [groupResult, expensesResult] = await Promise.all([
        supabase.from("groups").select("*").eq("id", groupId).single(),
        supabase
          .from("expenses")
          .select("*, paid_by_user:users!paid_by(*), splits:expense_splits(*, user:users(*))")
          .eq("group_id", groupId)
          .order("expense_date", { ascending: false }),
      ]);

      const { data: groupData, error: gErr } = groupResult;
      const { data: expensesData, error: eErr } = expensesResult;

      if (gErr) toast({ title: "Error", description: gErr.message, variant: "destructive" });
      if (eErr) toast({ title: "Error", description: eErr.message, variant: "destructive" });

      setGroup(groupData as Group);
      setExpenses((expensesData as ExpenseWithRelations[]) ?? []);
      setLoading(false);
    })();
  }, [supabase, groupId]);

  if (loading) {
    return (
      <>
        <Header title="Analytics" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!group) return <div className="p-4 text-center">Group not found</div>;

  return (
    <>
      <Header title="Analytics" showBack />
      <div className="p-4 space-y-4">
        <SpendingTotals expenses={expenses} currency={group.currency} />
        <SpendingByCategory expenses={expenses} currency={group.currency} />
        <SpendingByMonth expenses={expenses} currency={group.currency} />
      </div>
    </>
  );
}
