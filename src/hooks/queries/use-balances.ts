"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SettlementWithUsers, GroupBalance, User } from "@/lib/types";

/**
 * Fetch balances for a group
 */
export function useGroupBalances(groupId: string) {
  return useQuery({
    queryKey: ["balances", groupId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_balances")
        .select("*, user:users(*)")
        .eq("group_id", groupId);

      if (error) throw error;
      return (data ?? []) as (GroupBalance & { user: User })[];
    },
    enabled: !!groupId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch settlements for a group
 */
export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: ["settlements", groupId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("settlements")
        .select("*, from_user_data:users!from_user(*), to_user_data:users!to_user(*)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SettlementWithUsers[];
    },
    enabled: !!groupId,
    staleTime: 30 * 1000,
  });
}
