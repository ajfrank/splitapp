"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentButtons } from "@/components/balances/payment-buttons";
import { formatCurrency } from "@/lib/utils/format";
import type { DebtEdge } from "@/lib/types";

interface UserInfo {
  full_name: string;
  venmo_username: string | null;
  paypal_username?: string | null;
  cashapp_username?: string | null;
}

interface Props {
  groupId: string;
  balances: Record<string, number>;
  debts: DebtEdge[];
  userMap: Record<string, UserInfo>;
  currency: string;
  currentUserId?: string;
}

export function BalanceSummary({ groupId, balances, debts, userMap, currency, currentUserId }: Props) {
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
                <span className="text-sm">
                  {user?.full_name ?? "Unknown"}
                  {userId === currentUserId && (
                    <span className="text-gray-400 ml-1">(You)</span>
                  )}
                </span>
                <span
                  className={`text-sm font-medium ${
                    rounded > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : rounded < 0
                      ? "text-red-600 dark:text-red-400"
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
        <CardContent className="space-y-4">
          {debts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">All settled up!</p>
          ) : (
            debts.map((debt, i) => {
              const fromUser = userMap[debt.from];
              const toUser = userMap[debt.to];
              const isCurrentUserPaying = debt.from === currentUserId;

              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm flex-1">
                      <span className="font-medium">
                        {fromUser?.full_name ?? "Unknown"}
                        {debt.from === currentUserId && (
                          <span className="text-gray-400 ml-1">(You)</span>
                        )}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500"> owes </span>
                      <span className="font-medium">
                        {toUser?.full_name ?? "Unknown"}
                        {debt.to === currentUserId && (
                          <span className="text-gray-400 ml-1">(You)</span>
                        )}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(debt.amount, currency)}
                    </span>
                  </div>

                  {/* Payment buttons - show when current user owes someone */}
                  {isCurrentUserPaying && toUser && (
                    <PaymentButtons
                      venmoUsername={toUser.venmo_username}
                      paypalUsername={toUser.paypal_username}
                      cashappUsername={toUser.cashapp_username}
                      amount={debt.amount}
                      note={`SplitApp payment`}
                    />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {debts.length > 0 && (
        <Link href={`/groups/${groupId}/settle`}>
          <Button className="w-full">Record Settlement</Button>
        </Link>
      )}
    </div>
  );
}
