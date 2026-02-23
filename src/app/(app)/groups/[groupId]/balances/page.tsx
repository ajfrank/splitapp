"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { BalanceSummary } from "@/components/balances/balance-summary";
import { BalanceSkeleton } from "@/components/ui/skeleton";
import { simplifyDebts } from "@/lib/utils/debt-simplify";
import { calculateBalances } from "@/lib/utils/balances";
import { toast } from "@/hooks/use-toast";
import type { Group, DebtEdge, GroupMemberWithUser } from "@/lib/types";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function BalancesPage({ params }: Props) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [debts, setDebts] = useState<DebtEdge[]>([]);
  const [userMap, setUserMap] = useState<Record<string, { full_name: string; venmo_username: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const { data: groupData, error: gErr } = await supabase
        .from("groups").select("*").eq("id", groupId).single();
      const { data: members, error: mErr } = await supabase
        .from("group_members").select("*, user:users(*)").eq("group_id", groupId);
      const { data: expenses, error: eErr } = await supabase
        .from("expenses").select("*, splits:expense_splits(*)").eq("group_id", groupId);
      const { data: settlements, error: sErr } = await supabase
        .from("settlements").select("*").eq("group_id", groupId);

      if (gErr) toast({ title: "Error", description: gErr.message, variant: "destructive" });
      if (mErr) toast({ title: "Error", description: mErr.message, variant: "destructive" });
      if (eErr) toast({ title: "Error", description: eErr.message, variant: "destructive" });
      if (sErr) toast({ title: "Error", description: sErr.message, variant: "destructive" });

      setGroup(groupData as Group);

      const uMap: Record<string, { full_name: string; venmo_username: string | null }> = {};
      ((members ?? []) as GroupMemberWithUser[]).forEach((m) => {
        if (m.user) uMap[m.user_id] = { full_name: m.user.full_name, venmo_username: m.user.venmo_username };
      });
      setUserMap(uMap);

      const bal = calculateBalances(expenses ?? [], settlements ?? []);

      setBalances(Object.fromEntries(bal));
      setDebts(simplifyDebts(bal));
      setLoading(false);
    })();
  }, [supabase, groupId]);

  if (loading) {
    return (
      <>
        <Header title="Balances" showBack />
        <div className="p-4 space-y-4">
          <BalanceSkeleton />
          <BalanceSkeleton />
        </div>
      </>
    );
  }
  if (!group) return <div className="p-4 text-center">Group not found</div>;

  return (
    <>
      <Header title="Balances" showBack />
      <div className="p-4">
        <BalanceSummary groupId={groupId} balances={balances} debts={debts} userMap={userMap} currency={group.currency} />
      </div>
    </>
  );
}
