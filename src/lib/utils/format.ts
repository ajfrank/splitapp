const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export function formatCurrency(amount: number, currency: string = "USD"): string {
  const symbol = currencySymbols[currency] ?? currency + " ";
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] ?? currency;
}

export const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
];

export const CATEGORIES = [
  { value: "food", label: "Food & Drink", icon: "🍔" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "lodging", label: "Lodging", icon: "🏨" },
  { value: "entertainment", label: "Entertainment", icon: "🎬" },
  { value: "other", label: "Other", icon: "📦" },
] as const;
