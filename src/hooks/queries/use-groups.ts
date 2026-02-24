"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Group } from "@/lib/types";

interface GroupMembership {
  group: Group | null;
}

/**
 * Fetch all groups the current user is a member of
 */
export function useGroups(userId: string | null) {
  return useQuery({
    queryKey: ["groups", userId],
    queryFn: async () => {
      if (!userId) return [];

      const supabase = createClient();
      const { data: memberships, error } = await supabase
        .from("group_members")
        .select("group:groups(*)")
        .eq("user_id", userId);

      if (error) throw error;

      return (memberships as unknown as GroupMembership[])
        .map((m) => m.group)
        .filter((g): g is Group => g !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch a single group by ID
 */
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      return data as Group;
    },
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}
