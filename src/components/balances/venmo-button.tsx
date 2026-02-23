"use client";

import { Button } from "@/components/ui/button";
import { generateVenmoDeepLink, generateVenmoWebLink } from "@/lib/utils/venmo";
import { ExternalLink } from "lucide-react";

interface Props {
  username: string;
  amount: number;
  note: string;
}

export function VenmoButton({ username, amount, note }: Props) {
  function handleClick() {
    const deepLink = generateVenmoDeepLink({ username, amount, note });
    const webLink = generateVenmoWebLink({ username, amount, note });

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
      className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      Venmo
    </Button>
  );
}
