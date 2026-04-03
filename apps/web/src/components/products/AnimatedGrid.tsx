"use client";

import { motion } from "framer-motion";

export default function AnimatedGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
    >
      {children}
    </motion.div>
  );
}
