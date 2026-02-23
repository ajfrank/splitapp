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
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0) {
      result.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: rounded,
      });
    }

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (Math.round(debtors[i].amount * 100) === 0) i++;
    if (Math.round(creditors[j].amount * 100) === 0) j++;
  }

  return result;
}
