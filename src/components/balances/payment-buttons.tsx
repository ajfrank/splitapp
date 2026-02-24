"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPaymentLinks,
  PAYMENT_PROVIDERS,
  type PaymentProvider,
  type PaymentLinkOptions,
} from "@/lib/utils/payments";

interface PaymentButtonProps {
  provider: PaymentProvider;
  username: string;
  amount: number;
  note: string;
}

export function PaymentButton({ provider, username, amount, note }: PaymentButtonProps) {
  const meta = PAYMENT_PROVIDERS[provider];

  function handleClick() {
    const options: PaymentLinkOptions = { username, amount, note };
    const { deepLink, webLink } = getPaymentLinks(provider, options);

    // Try deep link first, fall back to web
    const start = Date.now();
    window.location.href = deepLink;

    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(webLink, "_blank");
      }
    }, 1500);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`gap-1.5 ${meta.color} border-current/20 ${meta.hoverColor}`}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {meta.name}
    </Button>
  );
}

interface PaymentButtonsProps {
  venmoUsername?: string | null;
  paypalUsername?: string | null;
  cashappUsername?: string | null;
  amount: number;
  note: string;
}

export function PaymentButtons({
  venmoUsername,
  paypalUsername,
  cashappUsername,
  amount,
  note,
}: PaymentButtonsProps) {
  const hasAnyPayment = venmoUsername || paypalUsername || cashappUsername;

  if (!hasAnyPayment) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {venmoUsername && (
        <PaymentButton
          provider="venmo"
          username={venmoUsername}
          amount={amount}
          note={note}
        />
      )}
      {paypalUsername && (
        <PaymentButton
          provider="paypal"
          username={paypalUsername}
          amount={amount}
          note={note}
        />
      )}
      {cashappUsername && (
        <PaymentButton
          provider="cashapp"
          username={cashappUsername}
          amount={amount}
          note={note}
        />
      )}
    </div>
  );
}
