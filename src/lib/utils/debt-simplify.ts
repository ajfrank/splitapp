import type { DebtEdge } from "@/lib/types";

/**
 * Minimizes the number of transactions needed to settle all debts.
 * 1. Calculate net balance per person (positive = creditor, negative = debtor)
 * 2. Greedily match largest debtor to largest creditor
 */
export function simplifyDebts(
  balances: Map<string, number>
): DebtEdge[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  balances.forEach((balance, id) => {
    // Round to 2 decimal places to avoid floating point issues
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0) {
      creditors.push({ id, amount: rounded });
    } else if (rounded < 0) {
      debtors.push({ id, amount: Math.abs(rounded) });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result: DebtEdge[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;

    const amount = Math.min(debtor.amount, creditor.amount);
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0) {
      result.push({
        from: debtor.id,
        to: creditor.id,
        amount: rounded,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (Math.round(debtor.amount * 100) === 0) i++;
    if (Math.round(creditor.amount * 100) === 0) j++;
  }

  return result;
}
