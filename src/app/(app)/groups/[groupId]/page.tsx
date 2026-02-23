"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { InviteButton } from "@/components/groups/invite-button";
import { MembersList } from "@/components/groups/members-list";
import { toast } from "@/hooks/use-toast";
import type { Group, Expense, GroupMember } from "@/lib/types";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function GroupPage({ params }: Props) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current && refreshKey === 0) return;
    if (!initialized.current) initialized.current = true;

    (async () => {
      const { data: groupData, error: gErr } = await supabase
        .from("groups").select("*").eq("id", groupId).single();
      const { data: membersData, error: mErr } = await supabase
        .from("group_members").select("*, user:users(*)").eq("group_id", groupId);
      const { data: expensesData, error: eErr } = await supabase
        .from("expenses")
        .select("*, paid_by_user:users!paid_by(*), splits:expense_splits(*, user:users(*))")
        .eq("group_id", groupId)
        .order("expense_date", { ascending: false });

      if (gErr) toast({ title: "Error", description: gErr.message, variant: "destructive" });
      if (mErr) toast({ title: "Error", description: mErr.message, variant: "destructive" });
      if (eErr) toast({ title: "Error", description: eErr.message, variant: "destructive" });

      setGroup(groupData as Group);
      setMembers((membersData as GroupMember[]) ?? []);
      setExpenses((expensesData as Expense[]) ?? []);
      setLoading(false);
    })();
  }, [supabase, groupId, refreshKey]);

  useEffect(() => {
    const channel = supabase
      .channel(`group-page-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` }, () => {
        setRefreshKey((k) => k + 1);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` }, () => {
        setRefreshKey((k) => k + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, groupId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
    </div>;
  }

  if (!group) return <div className="p-4 text-center">Group not found</div>;

  return (
    <>
      <Header
        title={group.name}
        showBack
        action={
          <Link href={`/groups/${groupId}/balances`}>
            <Button variant="ghost" size="icon"><BarChart3 className="h-5 w-5" /></Button>
          </Link>
        }
      />
      <div className="space-y-4 p-4">
        <div className="flex gap-2">
          <Link href={`/groups/${groupId}/expenses/new`} className="flex-1">
            <Button className="w-full gap-2"><Plus className="h-4 w-4" /> Add Expense</Button>
          </Link>
          <InviteButton inviteCode={group.invite_code} />
        </div>
        <MembersList members={members} />
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Expenses</h2>
            <Link href={`/groups/${groupId}/balances`}>
              <Button variant="link" size="sm">View Balances</Button>
            </Link>
          </div>
          {expenses.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No expenses yet. Add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} currency={group.currency} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
