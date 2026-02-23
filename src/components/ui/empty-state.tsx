"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { scaleIn, slideUp, floatAnimation } from "@/lib/animations";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  // Optional: add celebration mode for "all settled" states
  celebrate?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  celebrate = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={slideUp}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center py-16 text-center px-4",
        className
      )}
    >
      <motion.div
        variants={scaleIn}
        animate={celebrate ? floatAnimation : "animate"}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
          celebrate ? "bg-emerald-100" : "bg-gray-100"
        )}
      >
        <Icon
          className={cn(
            "h-8 w-8",
            celebrate ? "text-emerald-600" : "text-gray-400"
          )}
        />
      </motion.div>
      <motion.h2
        variants={slideUp}
        transition={{ delay: 0.2 }}
        className={cn(
          "text-lg font-semibold",
          celebrate ? "text-emerald-900" : "text-gray-900"
        )}
      >
        {title}
      </motion.h2>
      <motion.p
        variants={slideUp}
        transition={{ delay: 0.3 }}
        className="mt-1 text-sm text-gray-500 max-w-xs"
      >
        {description}
      </motion.p>
      {action && (
        <motion.div
          variants={slideUp}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
