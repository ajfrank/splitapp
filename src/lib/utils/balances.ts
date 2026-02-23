interface ExpenseWithSplits {
  paid_by: string;
  amount: number;
  splits?: { user_id: string; amount: number }[];
}

interface SettlementRecord {
  from_user: string;
  to_user: string;
  amount: number;
}

export function calculateBalances(
  expenses: ExpenseWithSplits[],
  settlements: SettlementRecord[]
): Map<string, number> {
  const bal = new Map<string, number>();

  expenses.forEach((expense) => {
    bal.set(expense.paid_by, (bal.get(expense.paid_by) ?? 0) + Number(expense.amount));
    (expense.splits ?? []).forEach((s) => {
      bal.set(s.user_id, (bal.get(s.user_id) ?? 0) - Number(s.amount));
    });
  });

  settlements.forEach((s) => {
    bal.set(s.from_user, (bal.get(s.from_user) ?? 0) + Number(s.amount));
    bal.set(s.to_user, (bal.get(s.to_user) ?? 0) - Number(s.amount));
  });

  return bal;
}
