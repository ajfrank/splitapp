"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  pieceCount?: number;
  onComplete?: () => void;
}

const COLORS = [
  "#10B981", // emerald
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
];

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    return {
      id: i,
      x: Math.random() * 100,
      color: COLORS[colorIndex] as string,
      delay: Math.random() * 0.3,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
    };
  });
}

export const Confetti = memo(function Confetti({
  active,
  duration = 2000,
  pieceCount = 50,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setPieces(generatePieces(pieceCount));
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, pieceCount, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              opacity: 1,
              x: `${piece.x}vw`,
              y: -20,
              rotate: 0,
              scale: piece.scale,
            }}
            animate={{
              opacity: [1, 1, 0],
              y: "100vh",
              rotate: piece.rotation + 720,
            }}
            transition={{
              duration: duration / 1000,
              delay: piece.delay,
              ease: "easeOut",
            }}
            className="absolute top-0 w-3 h-3"
            style={{
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

export function SuccessCheckmark({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex items-center justify-center ${className}`}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 52 52"
        className="w-16 h-16"
      >
        <motion.circle
          cx="26"
          cy="26"
          r="25"
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.path
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l7 7 17-17"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
      </motion.svg>
    </motion.div>
  );
}
