"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Pencil, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReceiptThumbnail } from "@/components/ui/receipt-viewer";
import { formatCurrency, CATEGORIES } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import type { ExpenseWithRelations } from "@/lib/types";

interface Props {
  expense: ExpenseWithRelations;
  currency: string;
  onEdit?: (expense: ExpenseWithRelations) => void;
}

export function ExpenseCard({ expense, currency, onEdit }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const category = CATEGORIES.find((c) => c.value === expense.category);

  async function handleDelete() {
    setIsDeleting(true);
    const supabase = createClient();
    await supabase.from("expense_splits").delete().eq("expense_id", expense.id);
    await supabase.from("expenses").delete().eq("id", expense.id);
    router.refresh();
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md overflow-hidden">
      <CardContent className="p-0">
        {/* Main row - clickable to expand */}
        <button
          type="button"
          className="w-full flex items-center gap-3 p-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-lg shrink-0">
            {category?.icon ?? "📦"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{expense.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paid by {expense.paid_by_user?.full_name ?? "Unknown"} &middot;{" "}
              {format(new Date(expense.expense_date), "MMM d")}
            </p>
          </div>
          <div className="text-right flex items-center gap-2 shrink-0">
            <span className="font-semibold text-sm">
              {formatCurrency(expense.amount, currency)}
            </span>
            {expense.receipt_url && (
              <Receipt className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                {/* Split details */}
                {expense.splits && expense.splits.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Split ({expense.split_type})
                    </p>
                    <div className="grid gap-1">
                      {expense.splits.map((split) => (
                        <div
                          key={split.id}
                          className="flex justify-between text-sm text-gray-600 dark:text-gray-300"
                        >
                          <span>{split.user?.full_name ?? "Unknown"}</span>
                          <span>{formatCurrency(split.amount, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Receipt thumbnail */}
                {expense.receipt_url && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Receipt
                    </p>
                    <ReceiptThumbnail
                      src={expense.receipt_url}
                      alt={`Receipt for ${expense.description}`}
                      className="w-20 h-20"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(expense);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  )}
                  <AnimatePresence mode="wait">
                    {!showConfirm ? (
                      <motion.div
                        key="delete-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirm(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="confirm-btns"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 flex gap-1"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirm(false);
                          }}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "..." : "Confirm"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
