"use client";

/**
 * LevaPanel — tiny wrapper so the `leva` package is only loaded when
 * TrackingBillboard receives showLeva={true}.
 * Imported via next/dynamic so it is excluded from the main bundle otherwise.
 */
import { Leva } from "leva";

export default function LevaPanel() {
  return <Leva collapsed />;
}
