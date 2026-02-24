"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Save, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileSkeleton, Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [venmoUsername, setVenmoUsername] = useState("");
  const [paypalUsername, setPaypalUsername] = useState("");
  const [cashappUsername, setCashappUsername] = useState("");
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
        const typedUser = userData as User;
        setUser(typedUser);
        setVenmoUsername(typedUser.venmo_username ?? "");
        setPaypalUsername((typedUser as User & { paypal_username?: string | null }).paypal_username ?? "");
        setCashappUsername((typedUser as User & { cashapp_username?: string | null }).cashapp_username ?? "");
      }
      setLoading(false);
    })();
  }, [supabase, router]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({
        venmo_username: venmoUsername || null,
        paypal_username: paypalUsername || null,
        cashapp_username: cashappUsername || null,
      })
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
      <Header
        title="Profile"
        showBack
        action={<ThemeToggle />}
      />
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
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Settings
            </CardTitle>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your Venmo username (without the @)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypal">PayPal Username</Label>
              <Input
                id="paypal"
                placeholder="username or email"
                value={paypalUsername}
                onChange={(e) => setPaypalUsername(e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your PayPal.me username or email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashapp">Cash App $Cashtag</Label>
              <Input
                id="cashapp"
                placeholder="$username"
                value={cashappUsername}
                onChange={(e) => setCashappUsername(e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your Cash App $cashtag (with or without the $)
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
