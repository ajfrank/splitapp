"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, ChevronRight, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/utils/format";
import { toast } from "@/hooks/use-toast";
import type { Group } from "@/lib/types";

interface GroupMembership {
  group: Group | null;
}

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      setUserName(session.user.user_metadata?.full_name?.split(" ")[0] ?? "there");

      const { data: memberships, error: memErr } = await supabase
        .from("group_members")
        .select("group:groups(*)")
        .eq("user_id", session.user.id);

      if (memErr) { toast({ title: "Error", description: memErr.message, variant: "destructive" }); }

      if (memberships && memberships.length > 0) {
        const groups = (memberships as unknown as GroupMembership[])
          .map((m) => m.group)
          .filter((g): g is Group => g !== null)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setGroups(groups);
      }
      setLoading(false);
    })();
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="My Groups"
        action={
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sign out
          </Button>
        }
      />

      <div className="space-y-4 p-4">
        <p className="text-sm text-gray-500">Hi, {userName}</p>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold">No groups yet</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a group to start splitting expenses
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-xs text-gray-500">
                          {getCurrencySymbol(group.currency)} &middot; {group.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Link href="/groups/new" className="block">
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </Link>
      </div>
    </>
  );
}
