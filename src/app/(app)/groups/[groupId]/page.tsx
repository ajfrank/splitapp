"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { Plus, BarChart3, Receipt, PieChart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { ExpenseEditModal } from "@/components/expenses/expense-edit-modal";
import { ExpenseFilter, filterExpenses, type ExpenseFilters } from "@/components/expenses/expense-filter";
import { InviteButton } from "@/components/groups/invite-button";
import { MembersList } from "@/components/groups/members-list";
import { GroupSettings } from "@/components/groups/group-settings";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, ExpenseCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { toast } from "@/hooks/use-toast";
import { useRecurringExpenses } from "@/hooks/use-recurring-expenses";
import type { Group, ExpenseWithRelations, GroupMemberWithUser } from "@/lib/types";

interface Props {
  params: Promise<{ groupId: string }>;
}

const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "all",
  dateFrom: "",
  dateTo: "",
};

export default function GroupPage({ params }: Props) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null);
  const supabase = createClient();
  const initialized = useRef(false);
  const recurringProcessed = useRef(false);
  const { processRecurringExpenses } = useRecurringExpenses();

  useEffect(() => {
    if (initialized.current && refreshKey === 0) return;
    if (!initialized.current) initialized.current = true;

    (async () => {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }

      // Parallelize all database queries for better performance
      const [groupResult, membersResult, expensesResult] = await Promise.all([
        supabase.from("groups").select("*").eq("id", groupId).single(),
        supabase.from("group_members").select("*, user:users(*)").eq("group_id", groupId),
        supabase.from("expenses")
          .select("*, paid_by_user:users!paid_by(*), splits:expense_splits(*, user:users(*))")
          .eq("group_id", groupId)
          .order("expense_date", { ascending: false }),
      ]);

      const { data: groupData, error: gErr } = groupResult;
      const { data: membersData, error: mErr } = membersResult;
      const { data: expensesData, error: eErr } = expensesResult;

      if (gErr) toast({ title: "Error", description: gErr.message, variant: "destructive" });
      if (mErr) toast({ title: "Error", description: mErr.message, variant: "destructive" });
      if (eErr) toast({ title: "Error", description: eErr.message, variant: "destructive" });

      setGroup(groupData as Group);
      setMembers((membersData as GroupMemberWithUser[]) ?? []);
      setExpenses((expensesData as ExpenseWithRelations[]) ?? []);
      setLoading(false);

      // Process recurring expenses (only once per page load)
      if (!recurringProcessed.current) {
        recurringProcessed.current = true;
        const result = await processRecurringExpenses(groupId);
        if (result.created > 0) {
          toast({
            title: "Recurring expenses",
            description: `Created ${result.created} recurring expense${result.created > 1 ? "s" : ""}`,
          });
          setRefreshKey((k) => k + 1);
        }
      }
    })();
  }, [supabase, groupId, refreshKey, processRecurringExpenses]);

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

  const refresh = () => setRefreshKey((k) => k + 1);

  // Get current user's membership info
  const currentMember = members.find((m) => m.user_id === currentUserId);
  const isAdmin = currentMember?.role === "admin";

  // Filter expenses
  const filteredExpenses = filterExpenses(expenses, filters);

  // Get members for editing (need name and id)
  const membersList = members.map((m) => ({
    id: m.user_id,
    name: m.user?.full_name || "Unknown",
  }));

  if (loading) {
    return (
      <>
        <Header title="" showBack />
        <div className="space-y-4 p-4">
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-10" />
            <Skeleton className="h-10 w-10" />
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full border-2 border-white" />
            ))}
          </div>
          <div>
            <Skeleton className="h-5 w-24 mb-3" />
            <ListSkeleton count={4} ItemComponent={ExpenseCardSkeleton} />
          </div>
        </div>
      </>
    );
  }

  if (!group) return <div className="p-4 text-center">Group not found</div>;

  return (
    <>
      <Header
        title={group.name}
        showBack
        action={
          <div className="flex items-center gap-1">
            <GroupSettings
              group={group}
              members={members}
              currentUserId={currentUserId || ""}
              isAdmin={isAdmin}
              onUpdate={refresh}
            />
            <Link href={`/groups/${groupId}/analytics`}>
              <Button variant="ghost" size="icon"><PieChart className="h-5 w-5" /></Button>
            </Link>
            <Link href={`/groups/${groupId}/balances`}>
              <Button variant="ghost" size="icon"><BarChart3 className="h-5 w-5" /></Button>
            </Link>
          </div>
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

        {/* Search and Filter */}
        <ExpenseFilter filters={filters} onFiltersChange={setFilters} />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              Expenses
              {filteredExpenses.length !== expenses.length && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredExpenses.length} of {expenses.length})
                </span>
              )}
            </h2>
            <Link href={`/groups/${groupId}/balances`}>
              <Button variant="link" size="sm">View Balances</Button>
            </Link>
          </div>
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Add your first expense to start tracking"
              action={
                <Link href={`/groups/${groupId}/expenses/new`}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </Link>
              }
              className="py-8"
            />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No matching expenses"
              description="Try adjusting your search or filters"
              className="py-8"
            />
          ) : (
            <AnimatedList className="space-y-2">
              {filteredExpenses.map((expense) => (
                <AnimatedListItem key={expense.id}>
                  <ExpenseCard
                    expense={expense}
                    currency={group.currency}
                    onEdit={setEditingExpense}
                  />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingExpense && (
        <ExpenseEditModal
          expense={editingExpense}
          members={membersList}
          currency={group.currency}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
