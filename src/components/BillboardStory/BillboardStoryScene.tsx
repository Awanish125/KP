"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isVideoMedia } from "./billboardStoryTypes";
import type { StoryStep } from "./billboardStoryTypes";

interface Props {
  steps: StoryStep[];
  stepIndex: number;
  flipDuration?: number;
}

export default function BillboardStoryScene({ steps, stepIndex, flipDuration = 1.15 }: Props) {
  const [displayIdx, setDisplayIdx] = useState(stepIndex);
  const cardRef = useRef<HTMLDivElement>(null);
  const tlRef   = useRef<gsap.core.Timeline | null>(null);
  const prevIdx = useRef(stepIndex);

  useEffect(() => () => { tlRef.current?.kill(); }, []);

  useEffect(() => {
    if (prevIdx.current === stepIndex) return;
    prevIdx.current = stepIndex;

    const card = cardRef.current;
    if (!card) return;

    tlRef.current?.kill();
    const half = flipDuration / 2;
    const tl = gsap.timeline();
    tlRef.current = tl;

    // Rotate to edge (90°), swap image at midpoint, rotate back
    tl.to(card, { rotateY: 90, duration: half, ease: "power2.in" });
    tl.call(() => setDisplayIdx(stepIndex));
    tl.to(card, { rotateY: 0, duration: half, ease: "power2.out" });
  }, [stepIndex, flipDuration]);

  const step = steps[displayIdx] ?? steps[0];

  return (
    <div
      style={{
        perspective: "1200px",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={cardRef}
        style={{
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ position: "relative", width: "100%", aspectRatio: "5/3", background: "#111" }}>
          {isVideoMedia(step.media) ? (
            <video
              key={step.media}
              src={step.media}
              autoPlay
              muted
              loop
              playsInline
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Image
              key={step.media}
              src={step.media}
              alt={step.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          )}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              border: "5px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
