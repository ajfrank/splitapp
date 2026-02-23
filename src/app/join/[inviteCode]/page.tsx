"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Group } from "@/lib/types";

interface Props {
  params: Promise<{ inviteCode: string }>;
}

export default function JoinGroupPage({ params }: Props) {
  const { inviteCode } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const { data } = await supabase
        .from("groups").select("*").eq("invite_code", inviteCode).single();
      setGroup(data as Group | null);
      setLoading(false);
    })();
  }, [supabase, inviteCode]);

  async function handleJoin() {
    if (!group) return;
    setJoining(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push(`/login`); return; }

    const { data: existing } = await supabase
      .from("group_members").select("id").eq("group_id", group.id).eq("user_id", session.user.id).single();
    if (existing) { router.push(`/groups/${group.id}`); return; }

    await supabase
      .from("group_members").insert({ group_id: group.id, user_id: session.user.id, role: "member" });
    router.push(`/groups/${group.id}`);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
    </div>;
  }

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Invalid invite link</p>
            <Link href="/dashboard" className="mt-4 block"><Button variant="outline">Go to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-xl font-bold">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <CardTitle>{group.name}</CardTitle>
          <CardDescription>{group.description || "You've been invited to join this group"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleJoin} className="w-full" disabled={joining}>
            {joining ? <><Loader2 className="h-4 w-4 animate-spin" /> Joining...</> : "Join Group"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
