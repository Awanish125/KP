"use client";

import { motion } from "motion/react";

interface GalleryHeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  count?: number;
}

export function GalleryHero({ title, subtitle, description, count }: GalleryHeroProps) {
  if (!title && !subtitle && !description) return null;

  return (
    <div className="mb-12 max-w-2xl">
      {subtitle && (
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-xs font-semibold uppercase tracking-[0.35em] text-accent"
        >
          {subtitle}
        </motion.span>
      )}

      {title && (
        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="mt-3 bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-4xl font-extralight leading-tight text-transparent dark:from-white dark:via-white dark:to-accent lg:text-6xl"
        >
          {title}
        </motion.h1>
      )}

      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="mt-4 block h-px w-16 origin-left bg-gradient-to-r from-accent to-transparent"
      />

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted lg:text-base"
        >
          {description}
        </motion.p>
      )}

      {count !== undefined && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-3 text-xs uppercase tracking-wide text-text-muted"
        >
          {count} photographs
        </motion.p>
      )}
    </div>
  );
}
