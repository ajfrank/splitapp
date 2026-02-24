"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { GroupMemberWithUser } from "@/lib/types";

/**
 * Fetch all members of a group
 */
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ["members", groupId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_members")
        .select("*, user:users(*)")
        .eq("group_id", groupId);

      if (error) throw error;
      return (data ?? []) as GroupMemberWithUser[];
    },
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}
