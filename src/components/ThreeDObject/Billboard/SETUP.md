# TrackingBillboard — Complete Setup Guide

One WebGL canvas. One model. Flies between sections as you scroll.

---

## How it works

```
page.tsx
  └── <TrackingBillboard ref={billRef} />     ← ONE fixed canvas, z-index:5
  └── <section id="s2">
        <div className="w-1/2"> content </div>
        <div className="w-1/2" />              ← invisible slot (marks space)
      </section>
```

The canvas is `position: fixed`. GSAP ScrollTrigger scrubs its `left / scale / opacity`
between sections. Invisible `w-1/2` divs in each section mark where the model should land.
The model physically slides + spins between sections — no teleporting, no multiple canvases.

---

## Methods (via `billRef.current`)

```tsx
const billRef = useRef<TrackingBillboardHandle>(null);
<TrackingBillboard ref={billRef} initialImage="/kp.png" />
```

| Method | What it does |
|---|---|
| `billRef.current.wrapRef` | The fixed canvas div — pass to GSAP directly |
| `rotateTo(degrees, options?)` | GSAP-eased rotation to an absolute angle |
| `resetRotation(options?)` | GSAP-eased return to 0° |
| `setRotationDirect(degrees)` | Instant set, no tween — for scroll-scrubbed transit |
| `changePoster(face, url, duration?)` | Crossfade poster image |
| `startScrollRotation(deg, trigger, images?)` | Wire 360° spin to a pinned section |
| `stopScrollRotation()` | Kill the scroll rotation trigger |

### rotateTo options
```tsx
bill.rotateTo(360, {
  duration: 1.8,          // seconds
  ease: "power2.inOut",   // any GSAP ease string
  images: [               // poster swaps at degree milestones
    { atDegrees: 90,  front: "/img1.png" },
    { atDegrees: 180, front: "/img2.png", back: "/back.png" },
  ],
});
```

---

## Adding a new section (step-by-step)

Say you want to add **S-5** with the billboard on the LEFT.

### Step 1 — Add the section in JSX

```tsx
// After your existing last section:
<section id="s5" className="relative flex h-screen">

  {/* Slot div — invisible, marks LEFT half for the canvas */}
  <div className="hidden md:block w-1/2 h-full" aria-hidden="true" />

  {/* Your content on the RIGHT */}
  <div className="w-full md:w-1/2 flex items-center px-8 md:px-16">
    <div>
      <h2 className="text-4xl text-white">Your heading</h2>
      <p className="text-white/40">Your body copy.</p>
    </div>
  </div>

</section>
```

### Step 2 — Add the transition scrub (inside `useGSAP`)

```tsx
// Add BEFORE the existing "After S-4 ends" block.
// Previous section (S-4) had the canvas on the RIGHT (left: 50%).
// S-5 wants it on the LEFT (left: 0%).
// Model was at ~540° (360° S-4 base + transit spins) after S-4 → use that as fromDeg.

scrubTransition("#s5", 50, 0, 540, 720);
//               ^id   ^from  ^to  ^rotStart ^rotEnd  (360° spin during transit)
```

### Step 3 — Add the onEnter handler

```tsx
ScrollTrigger.create({
  trigger: "#s5",
  start: "top top",
  onEnter() {
    gsap.set(wrap, { left: "0%", width: "50%", scale: 1 });
    bill.changePoster("front", "/your-image.png");
    bill.rotateTo(760, { duration: 1.5, ease: "power2.inOut" });
  },
  onLeaveBack() {
    bill.stopScrollRotation();
    gsap.set(wrap, { left: "50%", width: "50%" });
    // restore S-4 state
  },
});
```

### Step 4 — Fade out after S-5 (if it's the last section)

```tsx
ScrollTrigger.create({
  trigger: "#s5",
  start: "bottom bottom",
  onEnter() {
    bill.stopScrollRotation();
    gsap.to(wrap, { opacity: 0, scale: 0.85, duration: 0.5 });
  },
  onLeaveBack() {
    gsap.to(wrap, { opacity: 1, scale: 1, duration: 0.3 });
  },
});
```

---

## Hiding the billboard in a middle section

Say layout is: S-2 (visible) → **S-3 (NO billboard)** → S-4 (visible).

```tsx
// S-2 fully visible — position normally
ScrollTrigger.create({
  trigger: "#s2",
  start: "top top",
  onEnter() {
    gsap.set(wrap, { left: "50%", opacity: 1, scale: 1 });
    bill.changePoster("front", IMG.i1);
  },
});

// S-2 → S-3 : model shrinks + fades OUT as S-3 enters
ScrollTrigger.create({
  trigger: "#s3",
  start: "top bottom",
  end:   "top top",
  scrub: 0.4,
  onUpdate(self) {
    const p = self.progress;
    gsap.set(wrap, {
      opacity: 1 - p,          // fade out
      scale:   1 - 0.15 * p,  // shrink
    });
    bill.setRotationDirect(180 + 180 * p); // spin while fading
  },
});

// S-3 section — no billboard (hidden)
// No onEnter needed — canvas is already opacity:0

// S-3 → S-4 : model fades back IN on the other side
ScrollTrigger.create({
  trigger: "#s4",
  start: "top bottom",
  end:   "top top",
  scrub: 0.4,
  onUpdate(self) {
    const p = self.progress;
    gsap.set(wrap, {
      left:    `${50 * p}%`,  // slide in from left: 0 → 50%
      opacity: p,
      scale:   0.85 + 0.15 * p,
    });
    bill.setRotationDirect(360 + 180 * p);
  },
});

ScrollTrigger.create({
  trigger: "#s4",
  start: "top top",
  onEnter() {
    gsap.set(wrap, { left: "50%", opacity: 1, scale: 1 });
    bill.changePoster("front", IMG.i2);
    bill.rotateTo(540, { duration: 1.5 });
  },
});
```

---

## Customizing transitions

`scrubTransition` is defined inside `useGSAP` in `page.tsx`:

```tsx
function scrubTransition(
  triggerId: string,   // CSS id of the ENTERING section
  fromPct: number,     // canvas left% when leaving current section
  toPct: number,       // canvas left% when entering new section
  fromDeg: number,     // model rotation (°) at start of transit
  toDeg: number,       // model rotation (°) at end of transit
  peakScale = 1.12,    // how much the canvas scales up mid-flight
) { ... }
```

### Make it scale more aggressively
```tsx
scrubTransition("#s3", 50, 0, 180, 360, 1.25);  // scale up to 1.25× mid-flight
```

### Make it not scale at all (just slide)
```tsx
scrubTransition("#s3", 50, 0, 180, 360, 1.0);   // peakScale=1 = no pulse
```

### Make it spin faster (more degrees during transit)
```tsx
scrubTransition("#s3", 50, 0, 180, 540);  // 360° spin instead of 180°
```

### Slow down the scrub
Change `scrub: 0.5` inside `scrubTransition` to a higher value (e.g., `scrub: 1`) for more lag.

### Custom easing on position (not scrubbed — instant GSAP tween instead)
If you want a non-scrubbed, eased fly animation triggered at section entry:
```tsx
ScrollTrigger.create({
  trigger: "#s3",
  start: "top 40%",
  onEnter() {
    gsap.to(wrap, {
      left: "0%", scale: 1,
      duration: 0.9, ease: "expo.inOut",
    });
    bill.rotateTo(360, { duration: 0.9, ease: "expo.inOut" });
  },
});
```

---

## Changing images

```tsx
// Instantly swap
bill.changePoster("front", "/new-image.png");

// Slower crossfade (1.5 seconds)
bill.changePoster("front", "/new-image.png", 1.5);

// Change both sides
bill.changePoster("front", "/front.png");
bill.changePoster("back", "/back.png");

// Change during rotation milestones
bill.rotateTo(360, {
  images: [
    { atDegrees: 90,  front: "/img-at-90.png" },
    { atDegrees: 180, front: "/img-at-180.png", back: "/back-at-180.png" },
    { atDegrees: 270, front: "/img-at-270.png" },
  ],
});
```

---

## Pinned 360° scroll section

```tsx
// In JSX — tall wrapper provides scroll distance:
<div id="pin-wrapper" style={{ height: "400vh" }}>
  <section className="sticky top-0 h-screen flex">
    <div className="w-1/2"> ... content steps ... </div>
    <div className="hidden md:block w-1/2 h-full" aria-hidden="true" />
  </section>
</div>

// In useGSAP:
ScrollTrigger.create({
  trigger: "#pin-wrapper",
  start: "top top",
  onEnter() {
    gsap.set(wrap, { left: "50%", width: "50%" });
    bill.startScrollRotation(
      360,               // total degrees across the full wrapper scroll
      "#pin-wrapper",    // the tall wrapper (NOT the sticky section)
      [
        { atDegrees: 0,   front: "/step-1.png" },
        { atDegrees: 90,  front: "/step-2.png" },
        { atDegrees: 180, front: "/step-3.png" },
        { atDegrees: 270, front: "/step-4.png" },
      ],
    );
  },
  onLeaveBack() {
    bill.stopScrollRotation();
  },
});
```

---

## Canvas wrapper — direct GSAP properties

`billRef.current.wrapRef.current` is the raw `HTMLDivElement`. Animate any CSS:

```tsx
const wrap = billRef.current.wrapRef.current;

// Move to specific viewport position
gsap.to(wrap, { top: "10vh", left: "25%", width: "50%", height: "80vh" });

// Fade in
gsap.to(wrap, { opacity: 1, scale: 1, duration: 0.5 });

// Hide
gsap.to(wrap, { opacity: 0, scale: 0.85, duration: 0.4 });

// Instant set (no animation)
gsap.set(wrap, { left: "0%", scale: 1, opacity: 1 });
```

---

## Mobile notes

The canvas `width: 50%` means it occupies the right or left half of the screen.
On mobile (< 768px) the slot divs are hidden (`hidden md:block`), so the canvas
can cover more of the screen. Adjust the mobile canvas size in `TrackingBillboard.tsx`
initial style or in the individual `onEnter` handlers:

```tsx
onEnter() {
  const isMobile = window.innerWidth < 768;
  gsap.set(wrap, {
    left:  isMobile ? "0%"  : "50%",
    width: isMobile ? "100%" : "50%",
    opacity: 1, scale: 1,
  });
}
```

---

## File reference

| File | Purpose |
|---|---|
| `TrackingBillboard.tsx` | Single canvas component, exposes handle |
| `DivScene.tsx` | R3F scene — auto-fits camera, applies rotation |
| `BillboardMesh.tsx` | The actual 3D billboard model |
| `page.tsx` | Layout + all ScrollTrigger position logic |
| `SETUP.md` | This file |

**To change model size / appearance:** open `BillboardMesh.tsx` and adjust the Leva defaults
(width, height, pole height, etc.) or tweak `MODEL_H / MODEL_W / PADDING` in `DivScene.tsx`.
