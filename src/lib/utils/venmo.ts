interface VenmoLinkOptions {
  username: string;
  amount: number;
  note: string;
}

export function generateVenmoDeepLink({ username, amount, note }: VenmoLinkOptions): string {
  const params = new URLSearchParams({
    txn: "pay",
    recipients: username,
    amount: amount.toFixed(2),
    note,
  });
  return `venmo://paycharge?${params.toString()}`;
}

export function generateVenmoWebLink({ username, amount, note }: VenmoLinkOptions): string {
  const params = new URLSearchParams({
    txn: "pay",
    recipients: username,
    amount: amount.toFixed(2),
    note,
  });
  return `https://venmo.com/?${params.toString()}`;
}
