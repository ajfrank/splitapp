"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { SettleForm } from "@/components/balances/settle-form";
import { simplifyDebts } from "@/lib/utils/debt-simplify";
import { calculateBalances } from "@/lib/utils/balances";
import { formatCurrency } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { Group, DebtEdge, Settlement, GroupMemberWithUser } from "@/lib/types";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function SettlePage({ params }: Props) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [debts, setDebts] = useState<DebtEdge[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
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
      const { data: settlementsData, error: sErr } = await supabase
        .from("settlements").select("*, from_user_data:users!from_user(*), to_user_data:users!to_user(*)").eq("group_id", groupId).order("created_at", { ascending: false });

      if (gErr) toast({ title: "Error", description: gErr.message, variant: "destructive" });
      if (mErr) toast({ title: "Error", description: mErr.message, variant: "destructive" });
      if (eErr) toast({ title: "Error", description: eErr.message, variant: "destructive" });
      if (sErr) toast({ title: "Error", description: sErr.message, variant: "destructive" });

      setGroup(groupData as Group);
      setSettlements((settlementsData as Settlement[]) ?? []);

      const uMap: Record<string, { full_name: string; venmo_username: string | null }> = {};
      ((members ?? []) as GroupMemberWithUser[]).forEach((m) => {
        if (m.user) uMap[m.user_id] = { full_name: m.user.full_name, venmo_username: m.user.venmo_username };
      });
      setUserMap(uMap);

      const bal = calculateBalances(expenses ?? [], settlementsData ?? []);
      setDebts(simplifyDebts(bal));
      setLoading(false);
    })();
  }, [supabase, groupId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
    </div>;
  }
  if (!group) return <div className="p-4 text-center">Group not found</div>;

  return (
    <>
      <Header title="Settle Up" showBack />
      <div className="space-y-4 p-4">
        {debts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">All settled up!</p>
        ) : (
          debts.map((debt, i) => (
            <SettleForm
              key={i} groupId={groupId}
              fromUser={debt.from} toUser={debt.to} amount={debt.amount}
              fromName={userMap[debt.from]?.full_name ?? "Unknown"}
              toName={userMap[debt.to]?.full_name ?? "Unknown"}
              toVenmo={userMap[debt.to]?.venmo_username ?? null}
              currency={group.currency}
            />
          ))
        )}
        {settlements.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Settlement History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settlements.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span>{s.from_user_data?.full_name} paid {s.to_user_data?.full_name}</span>
                    <span className="font-medium">{formatCurrency(s.amount, group.currency)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
