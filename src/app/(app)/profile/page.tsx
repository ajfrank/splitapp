"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileSkeleton, Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [venmoUsername, setVenmoUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }

      if (userData) {
        setUser(userData as User);
        setVenmoUsername(userData.venmo_username ?? "");
      }
      setLoading(false);
    })();
  }, [supabase, router]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({ venmo_username: venmoUsername || null })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Your profile has been updated." });
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <>
        <Header title="Profile" showBack />
        <div className="space-y-4 p-4">
          <Card>
            <CardContent className="pt-6">
              <ProfileSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-10 w-full" />
        </div>
      </>
    );
  }

  if (!user) {
    return <div className="p-4 text-center">User not found</div>;
  }

  return (
    <>
      <Header title="Profile" showBack />
      <div className="space-y-4 p-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback>
                <UserIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user.full_name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venmo">Venmo Username</Label>
              <Input
                id="venmo"
                placeholder="@username"
                value={venmoUsername}
                onChange={(e) => setVenmoUsername(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Add your Venmo username so others can pay you directly.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );
}
