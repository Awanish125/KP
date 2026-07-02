"use client";

import { motion } from "motion/react";

interface GalleryOverlayProps {
  onClick?: () => void;
}

export function GalleryOverlay({ onClick }: GalleryOverlayProps) {
  return (
    <motion.div
      aria-hidden
      onClick={onClick}
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="absolute inset-0 bg-black/80"
      style={{ WebkitBackdropFilter: "blur(24px)" }}
    />
  );
}
