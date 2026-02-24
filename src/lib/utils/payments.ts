// Payment link generators for multiple payment providers

export interface PaymentLinkOptions {
  username: string;
  amount: number;
  note: string;
}

export type PaymentProvider = "venmo" | "paypal" | "cashapp";

// Venmo
export function generateVenmoDeepLink({ username, amount, note }: PaymentLinkOptions): string {
  const params = new URLSearchParams({
    txn: "pay",
    recipients: username,
    amount: amount.toFixed(2),
    note,
  });
  return `venmo://paycharge?${params.toString()}`;
}

export function generateVenmoWebLink({ username, amount, note }: PaymentLinkOptions): string {
  const params = new URLSearchParams({
    txn: "pay",
    recipients: username,
    amount: amount.toFixed(2),
    note,
  });
  return `https://venmo.com/?${params.toString()}`;
}

// PayPal
export function generatePayPalLink({ username, amount, note }: PaymentLinkOptions): string {
  // PayPal.me link format
  const encodedNote = encodeURIComponent(note);
  return `https://paypal.me/${username}/${amount.toFixed(2)}USD?note=${encodedNote}`;
}

// Cash App
export function generateCashAppDeepLink({ username, amount, note }: PaymentLinkOptions): string {
  const encodedNote = encodeURIComponent(note);
  return `cashapp://cash.app/pay/${username}/${amount.toFixed(2)}?note=${encodedNote}`;
}

export function generateCashAppWebLink({ username, amount }: PaymentLinkOptions): string {
  // Cash App $cashtag format
  const cashtag = username.startsWith("$") ? username.slice(1) : username;
  return `https://cash.app/$${cashtag}/${amount.toFixed(2)}`;
}

// Helper to get payment links for a provider
export function getPaymentLinks(
  provider: PaymentProvider,
  options: PaymentLinkOptions
): { deepLink: string; webLink: string } {
  switch (provider) {
    case "venmo":
      return {
        deepLink: generateVenmoDeepLink(options),
        webLink: generateVenmoWebLink(options),
      };
    case "paypal":
      return {
        deepLink: generatePayPalLink(options),
        webLink: generatePayPalLink(options),
      };
    case "cashapp":
      return {
        deepLink: generateCashAppDeepLink(options),
        webLink: generateCashAppWebLink(options),
      };
  }
}

// Provider metadata
export const PAYMENT_PROVIDERS: Record<
  PaymentProvider,
  { name: string; color: string; bgColor: string; hoverColor: string }
> = {
  venmo: {
    name: "Venmo",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
  },
  paypal: {
    name: "PayPal",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    hoverColor: "hover:bg-indigo-100",
  },
  cashapp: {
    name: "Cash App",
    color: "text-green-600",
    bgColor: "bg-green-50",
    hoverColor: "hover:bg-green-100",
  },
};
