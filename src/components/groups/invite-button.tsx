"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InviteButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/join/${inviteCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join my group on SplitApp", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={handleCopy} className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Check className="h-4 w-4 text-emerald-600" />
          </motion.div>
        ) : (
          <motion.div
            key="share"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Share2 className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
