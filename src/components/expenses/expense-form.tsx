"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { calculateSplits } from "@/lib/utils/splits";
import { CATEGORIES, getCurrencySymbol } from "@/lib/utils/format";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { SplitType, Category } from "@/lib/types";

interface Member {
  id: string;
  name: string;
}

interface Props {
  groupId: string;
  members: Member[];
  currentUserId: string;
  currency: string;
}

export function ExpenseForm({ groupId, members, currentUserId, currency }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [category, setCategory] = useState<Category>("other");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Split values per member
  const [splitValues, setSplitValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    members.forEach((m) => {
      initial[m.id] = splitType === "percentage" ? 100 / members.length : 1;
    });
    return initial;
  });

  useEffect(() => {
    const updated: Record<string, number> = {};
    members.forEach((m) => {
      if (splitType === "percentage") updated[m.id] = 100 / members.length;
      else if (splitType === "exact") updated[m.id] = 0;
      else updated[m.id] = 1;
    });
    setSplitValues(updated);
  }, [splitType, members]);

  // Selected members for the split
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );

  function toggleMember(id: string) {
    const next = new Set(selectedMembers);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedMembers(next);
  }

  function updateSplitValue(userId: string, value: number) {
    setSplitValues((prev) => ({ ...prev, [userId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toast({ title: "Invalid amount", description: "Please enter a valid amount", variant: "destructive" });
        setLoading(false);
        return;
      }

      const supabase = createClient();

      let receiptUrl: string | undefined;
      if (receiptFile) {
        const fileExt = receiptFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("receipts").upload(fileName, receiptFile);
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(uploadData.path);
          receiptUrl = publicUrl;
        }
      }

      const activeMemberIds = Array.from(selectedMembers);
      const splitInputs = activeMemberIds.map((userId) => ({
        userId,
        value: splitValues[userId] ?? (splitType === "percentage" ? 100 / activeMemberIds.length : 1),
      }));

      const splits = calculateSplits(numAmount, splitType, activeMemberIds, splitInputs);

      const { data: expense, error } = await supabase
        .from("expenses")
        .insert({
          group_id: groupId, description, amount: numAmount, currency,
          category, paid_by: paidBy, expense_date: expenseDate,
          split_type: splitType, receipt_url: receiptUrl,
        })
        .select().single();

      if (error) throw new Error(error.message);

      const { error: splitErr } = await supabase.from("expense_splits").insert(
        splits.map((s) => ({
          expense_id: expense.id, user_id: s.userId, amount: s.amount,
          percentage: splitType === "percentage" ? splitInputs.find((i) => i.userId === s.userId)?.value : null,
          shares: splitType === "shares" ? splitInputs.find((i) => i.userId === s.userId)?.value : null,
        }))
      );

      if (splitErr) {
        await supabase.from("expenses").delete().eq("id", expense.id);
        throw new Error(splitErr.message);
      }

      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create expense", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const currSymbol = getCurrencySymbol(currency);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount */}
      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {currSymbol}
          </span>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 text-2xl h-14 font-semibold"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          placeholder="What was it for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value as Category)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition-colors ${
                category === cat.value
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Paid by */}
      <div className="space-y-2">
        <Label>Paid by</Label>
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.id === currentUserId ? "(You)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />
      </div>

      {/* Receipt */}
      <div className="space-y-2">
        <Label>Receipt (optional)</Label>
        <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 p-4 hover:bg-gray-50 transition-colors">
          <Camera className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {receiptFile ? receiptFile.name : "Tap to upload receipt"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {/* Split type */}
      <div className="space-y-2">
        <Label>Split</Label>
        <Tabs value={splitType} onValueChange={(v) => setSplitType(v as SplitType)}>
          <TabsList className="w-full">
            <TabsTrigger value="equal" className="flex-1">Equal</TabsTrigger>
            <TabsTrigger value="percentage" className="flex-1">%</TabsTrigger>
            <TabsTrigger value="exact" className="flex-1">Exact</TabsTrigger>
            <TabsTrigger value="shares" className="flex-1">Shares</TabsTrigger>
          </TabsList>

          <TabsContent value="equal">
            <Card>
              <CardContent className="p-3 space-y-2">
                {members.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex-1">{m.name}</span>
                    {selectedMembers.has(m.id) && amount && (
                      <span className="text-gray-500">
                        {currSymbol}
                        {(parseFloat(amount) / selectedMembers.size).toFixed(2)}
                      </span>
                    )}
                  </label>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="percentage">
            <Card>
              <CardContent className="p-3 space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1">{m.name}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={splitValues[m.id] ?? 0}
                        onChange={(e) => updateSplitValue(m.id, parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-right"
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exact">
            <Card>
              <CardContent className="p-3 space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1">{m.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{currSymbol}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={splitValues[m.id] ?? 0}
                        onChange={(e) => updateSplitValue(m.id, parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 text-right"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shares">
            <Card>
              <CardContent className="p-3 space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1">{m.name}</span>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={splitValues[m.id] ?? 1}
                      onChange={(e) => updateSplitValue(m.id, parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-right"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Button type="submit" className="w-full h-12" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Expense"
        )}
      </Button>
    </form>
  );
}
