"use client";
import { motion } from "framer-motion";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

const SectionTitle = ({ title, subtitle }: SectionTitleProps) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-16 text-center"
    >
      <h2 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tighter text-foreground uppercase italic font-black">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">{subtitle}</p>
      )}
      <div className="mx-auto mt-6 h-1 w-20 bg-primary" />
    </motion.div>
  );
};

export default SectionTitle;
