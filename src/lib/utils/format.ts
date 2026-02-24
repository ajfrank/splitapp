import { getCurrencySymbol as getSymbol, ALL_CURRENCIES } from "./currencies";

export function formatCurrency(amount: number, currency: string = "USD"): string {
  const symbol = getSymbol(currency);
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
}

export function getCurrencySymbol(currency: string): string {
  return getSymbol(currency);
}

// Legacy export for backward compatibility
export const CURRENCIES = ALL_CURRENCIES.slice(0, 6).map((c) => ({
  value: c.code,
  label: `${c.code} (${c.symbol})`,
}));

export const CATEGORIES = [
  { value: "food", label: "Food & Drink", icon: "🍔" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "lodging", label: "Lodging", icon: "🏨" },
  { value: "entertainment", label: "Entertainment", icon: "🎬" },
  { value: "other", label: "Other", icon: "📦" },
] as const;
