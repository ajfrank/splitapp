import type { SplitType } from "@/lib/types";

interface SplitInput {
  userId: string;
  value: number; // percentage, exact amount, or shares depending on type
}

interface SplitResult {
  userId: string;
  amount: number;
}

export function calculateSplits(
  totalAmount: number,
  splitType: SplitType,
  members: string[],
  inputs?: SplitInput[]
): SplitResult[] {
  switch (splitType) {
    case "equal":
      return splitEqual(totalAmount, members);
    case "percentage":
      return splitByPercentage(totalAmount, inputs ?? []);
    case "exact":
      return splitExact(inputs ?? []);
    case "shares":
      return splitByShares(totalAmount, inputs ?? []);
    default:
      return splitEqual(totalAmount, members);
  }
}

function splitEqual(total: number, members: string[]): SplitResult[] {
  const count = members.length;
  if (count === 0) return [];

  const perPerson = Math.floor((total * 100) / count) / 100;
  const remainder = Math.round((total - perPerson * count) * 100) / 100;

  return members.map((userId, i) => ({
    userId,
    amount: i === 0 ? perPerson + remainder : perPerson,
  }));
}

function splitByPercentage(
  total: number,
  inputs: SplitInput[]
): SplitResult[] {
  return inputs.map(({ userId, value }) => ({
    userId,
    amount: Math.round(total * (value / 100) * 100) / 100,
  }));
}

function splitExact(inputs: SplitInput[]): SplitResult[] {
  return inputs.map(({ userId, value }) => ({
    userId,
    amount: value,
  }));
}

function splitByShares(total: number, inputs: SplitInput[]): SplitResult[] {
  const totalShares = inputs.reduce((sum, { value }) => sum + value, 0);
  if (totalShares === 0) return [];

  return inputs.map(({ userId, value }) => ({
    userId,
    amount: Math.round(total * (value / totalShares) * 100) / 100,
  }));
}
