/**
 * Shared Framer Motion variants — Cogrion Motion System
 * Import these in any component for consistent animations.
 *
 * Usage:
 *   import { fadeUpMotion, staggerContainer } from "@/lib/motion";
 *   <motion.div variants={fadeUpMotion} initial="hidden" animate="visible" />
 */

/* ─── Page Transitions ─── */
export const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

/* ─── Fade Up (general purpose) ─── */
export const fadeUpMotion = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Fade In (simple) ─── */
export const fadeInMotion = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/* ─── Slide In from Left ─── */
export const slideInMotion = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Stagger Container ─── */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

/* ─── Stagger Item (use inside staggerContainer) ─── */
export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Card Hover (whileHover preset) ─── */
export const cardHoverMotion = {
  scale: 1.015,
  boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
  transition: { duration: 0.2, ease: "easeOut" },
};

/* ─── Card Tap ─── */
export const cardTapMotion = {
  scale: 0.99,
  transition: { duration: 0.1 },
};

/* ─── Expand / Collapse ─── */
export const expandMotion = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/* ─── Scale In (modals, popovers) ─── */
export const scaleInMotion = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

/* ─── Glow Pulse (for status indicators) ─── */
export const glowPulseMotion = {
  animate: {
    boxShadow: [
      "0 0 8px rgba(6, 182, 212, 0.15)",
      "0 0 20px rgba(6, 182, 212, 0.3)",
      "0 0 8px rgba(6, 182, 212, 0.15)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

/* ─── Semantic Pulse (AI processing) ─── */
export const semanticPulse = {
  animate: {
    opacity: [0.4, 1, 0.4],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

/* ─── Chart Line Draw ─── */
export const lineDrawMotion = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.5, ease: "easeInOut" },
  },
};
