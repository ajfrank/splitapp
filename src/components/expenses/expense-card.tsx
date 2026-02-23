"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, CATEGORIES } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import type { Expense } from "@/lib/types";

interface Props {
  expense: Expense;
  currency: string;
}

export function ExpenseCard({ expense, currency }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const category = CATEGORIES.find((c) => c.value === expense.category);

  async function handleDelete() {
    setIsDeleting(true);
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", expense.id);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">
          {category?.icon ?? "📦"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{expense.description}</p>
          <p className="text-xs text-gray-500">
            Paid by {expense.paid_by_user?.full_name ?? "Unknown"} &middot;{" "}
            {format(new Date(expense.expense_date), "MMM d")}
          </p>
        </div>
        <div className="text-right flex items-center gap-2">
          <span className="font-semibold text-sm">
            {formatCurrency(expense.amount, currency)}
          </span>
          {!showConfirm ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-500"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "..." : "Delete"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
