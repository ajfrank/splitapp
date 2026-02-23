"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { Group } from "@/lib/types";

interface GroupMemberData {
  user_id: string;
  user?: { full_name: string };
}

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function NewExpensePage({ params }: Props) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUserId(session.user.id);

      const { data: groupData } = await supabase
        .from("groups").select("*").eq("id", groupId).single();
      const { data: membersData } = await supabase
        .from("group_members").select("*, user:users(*)").eq("group_id", groupId);

      setGroup(groupData as Group);
      setMembers(((membersData ?? []) as GroupMemberData[]).map((m) => ({
        id: m.user_id,
        name: m.user?.full_name ?? "Unknown",
      })));
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
      <Header title="Add Expense" showBack />
      <div className="p-4">
        <ExpenseForm
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
          currency={group.currency}
        />
      </div>
    </>
  );
}
