"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  isClickable?: boolean;
  useSharedLayout?: boolean;
}

/**
 * Agon Logo Component
 * 
 * Supports Shared Layout Animation ("Logo Flight") and standard opacity fade.
 */
export const Logo = ({ className, isClickable = true, useSharedLayout = true }: LogoProps) => {
  const motionProps: any = useSharedLayout
    ? {
      layoutId: "main-logo",
      layout: true,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    }
    : {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.5 },
    };

  const content = (
    <motion.span
      {...motionProps}
      className={cn(
        "font-display italic font-black uppercase tracking-tighter transition-all select-none relative z-[100] drop-shadow-[0_0_15px_rgba(0,156,59,0.3)] group-hover:drop-shadow-[0_0_25px_rgba(0,156,59,0.5)]",
        className
      )}
    >
      AGON
    </motion.span>
  );

  if (!isClickable) return content;

  return (
    <Link href="/" className="inline-flex items-center group">
      {content}
    </Link>
  );
};
