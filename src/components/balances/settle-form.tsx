"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VenmoButton } from "@/components/balances/venmo-button";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  fromName: string;
  toName: string;
  toVenmo: string | null;
  currency: string;
}

export function SettleForm({
  groupId,
  fromUser,
  toUser,
  amount,
  fromName,
  toName,
  toVenmo,
  currency,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settled, setSettled] = useState(false);

  async function handleSettle() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("settlements").insert({
        group_id: groupId, from_user: fromUser, to_user: toUser, amount, currency,
      });
      setSettled(true);
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to record settlement", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{fromName}</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{toName}</span>
          </div>
          <span className="font-semibold">{formatCurrency(amount, currency)}</span>
        </div>

        <div className="flex gap-2">
          {toVenmo && (
            <VenmoButton
              username={toVenmo}
              amount={amount}
              note={`SplitApp settlement`}
            />
          )}
          <Button
            onClick={handleSettle}
            disabled={loading || settled}
            size="sm"
            className="flex-1"
            variant={settled ? "secondary" : "default"}
          >
            {settled ? (
              <>
                <Check className="h-4 w-4" />
                Settled
              </>
            ) : loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Mark as Settled"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
