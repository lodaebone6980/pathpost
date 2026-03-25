"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

// FadeIn with direction
interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  delay?: number;
}

const directionMap = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: 30 },
  right: { x: -30 },
  none: {},
};

export function FadeIn({
  children,
  direction = "up",
  duration = 0.5,
  delay = 0,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// AnimatedPage with exit
export function AnimatedPage({ children, ...props }: { children: ReactNode } & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Stagger container
export function StaggerContainer({ children, ...props }: { children: ReactNode } & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Stagger item
export function StaggerItem({ children, ...props }: { children: ReactNode } & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
