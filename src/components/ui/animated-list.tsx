"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { staggerContainer, listItem } from "@/lib/animations";
import { cn } from "@/lib/utils/cn";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div variants={listItem} className={cn(className)}>
      {children}
    </motion.div>
  );
}
