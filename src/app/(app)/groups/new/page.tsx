"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyPicker } from "@/components/ui/currency-picker";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NewGroupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("USD");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name, description, currency, created_by: session.user.id })
      .select()
      .single();

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setLoading(false); return; }

    const { error: memberErr } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: session.user.id, role: "admin" });

    if (memberErr) {
      await supabase.from("groups").delete().eq("id", group.id);
      toast({ title: "Error", description: memberErr.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    router.push(`/groups/${group.id}`);
  }

  return (
    <>
      <Header title="New Group" showBack />
      <form onSubmit={handleSubmit} className="space-y-6 p-4">
        <div className="space-y-2">
          <Label htmlFor="name">Group Name</Label>
          <Input id="name" name="name" placeholder="e.g., Summer Trip 2025" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input id="description" name="description" placeholder="What's this group for?" />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <CurrencyPicker value={currency} onChange={setCurrency} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create Group"}
        </Button>
      </form>
    </>
  );
}
