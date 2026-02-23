import { Variants } from "framer-motion";

// Fade in animation
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide up with fade
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Slide in from right (for toasts)
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

// Scale animation for icons
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// Stagger container for list animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// List item animation (use with staggerContainer)
export const listItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Spring transition for interactive elements
export const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

// Smooth transition
export const smoothTransition = {
  duration: 0.3,
  ease: "easeOut" as const,
};

// Float animation for empty state icons
export const floatAnimation = {
  y: [-4, 4, -4],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
