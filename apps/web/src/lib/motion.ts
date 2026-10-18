import type { Variants, Transition } from 'framer-motion';

/**
 * Standard professional easing curves & durations (180ms - 240ms)
 */
export const MOTION_DURATIONS = {
  fast: 0.15,
  standard: 0.2,
  gentle: 0.25,
};

export const MOTION_EASE = [0.25, 0.1, 0.25, 1] as const;

export const standardTransition: Transition = {
  duration: MOTION_DURATIONS.standard,
  ease: MOTION_EASE,
};

/**
 * Page-level enter and exit transitions for seamless route switching
 */
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASE,
    },
  },
};

/**
 * Modal backdrop and card entrance variants
 */
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: MOTION_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: MOTION_EASE },
  },
};

/**
 * Interactive card hover elevation
 */
export const cardHoverVariants: Variants = {
  initial: { y: 0 },
  hover: {
    y: -3,
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  tap: {
    scale: 0.99,
    transition: { duration: 0.1 },
  },
};

/**
 * Staggered container and child variants for list views
 */
export const staggerContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: MOTION_EASE },
  },
};
