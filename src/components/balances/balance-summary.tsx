"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import type { DebtEdge } from "@/lib/types";

interface Props {
  groupId: string;
  balances: Record<string, number>;
  debts: DebtEdge[];
  userMap: Record<string, { full_name: string; venmo_username: string | null }>;
  currency: string;
}

export function BalanceSummary({ groupId, balances, debts, userMap, currency }: Props) {
  return (
    <div className="space-y-4">
      {/* Individual balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Individual Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(balances).map(([userId, balance]) => {
            const user = userMap[userId];
            const rounded = Math.round(balance * 100) / 100;
            return (
              <div key={userId} className="flex items-center justify-between">
                <span className="text-sm">{user?.full_name ?? "Unknown"}</span>
                <span
                  className={`text-sm font-medium ${
                    rounded > 0
                      ? "text-emerald-600"
                      : rounded < 0
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                >
                  {rounded > 0 ? "+" : ""}
                  {formatCurrency(rounded, currency)}
                  {rounded > 0 ? " (owed)" : rounded < 0 ? " (owes)" : " (settled)"}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Simplified debts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Simplified Debts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {debts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">All settled up!</p>
          ) : (
            debts.map((debt, i) => {
              const fromUser = userMap[debt.from];
              const toUser = userMap[debt.to];
              return (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="text-sm flex-1">
                    <span className="font-medium">{fromUser?.full_name ?? "Unknown"}</span>
                    <span className="text-gray-400"> owes </span>
                    <span className="font-medium">{toUser?.full_name ?? "Unknown"}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {formatCurrency(debt.amount, currency)}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {debts.length > 0 && (
        <Link href={`/groups/${groupId}/settle`}>
          <Button className="w-full">Settle Up</Button>
        </Link>
      )}
    </div>
  );
}
