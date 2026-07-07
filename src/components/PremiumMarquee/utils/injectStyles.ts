const STYLE_ID = 'pm-keyframes';

const CSS = `
  /* ── Gradient sweep ──────────────────────────────────────────────────── */
  @keyframes pm-sweep {
    0%   { transform: translateX(-140%); }
    100% { transform: translateX(260%); }
  }

  /* Light mode: dark shimmer so it reads on white/light backgrounds */
  .pm-gradient-sweep::after {
    content: '';
    position: absolute;
    inset-block: 0;
    left: 0;
    width: 38%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(0,102,175,0.04) 35%,
      rgba(0,102,175,0.07) 50%,
      rgba(0,102,175,0.04) 65%,
      transparent 100%
    );
    animation: pm-sweep 10s ease-in-out infinite;
    pointer-events: none;
    z-index: 10;
  }

  /* Dark mode: light shimmer */
  :where(.dark) .pm-gradient-sweep::after {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.05) 35%,
      rgba(255,255,255,0.10) 50%,
      rgba(255,255,255,0.05) 65%,
      transparent 100%
    );
  }

  /* ── Item hover tilt — subtle 3D lift, transform-only (compositor) ───── */
  .pm-item-tilt {
    transform: perspective(600px) rotateX(0deg) translateY(0) scale(1);
    will-change: auto;
  }
  .pm-item-tilt:hover {
    transform: perspective(600px) rotateX(7deg) translateY(-3px) scale(1.05);
    box-shadow: 0 10px 24px -12px rgba(20, 24, 29, 0.35);
  }

  /* ── Separator pulse ─────────────────────────────────────────────────── */
  @keyframes pm-sep-pulse {
    0%, 100% { opacity: 0.18; transform: scale(1); }
    50%       { opacity: 0.48; transform: scale(1.45); }
  }
  .pm-sep-pulse {
    animation: pm-sep-pulse 2.9s ease-in-out infinite;
    display: inline-block;
  }

  /* ── Floating noise ──────────────────────────────────────────────────── */
  @keyframes pm-noise-drift {
    0%   { transform: translate(0,    0   ); }
    25%  { transform: translate(-3%, -1.5%); }
    50%  { transform: translate(2%,   3%  ); }
    75%  { transform: translate(-1%,  2%  ); }
    100% { transform: translate(0,    0   ); }
  }
  .pm-noise::before {
    content: '';
    position: absolute;
    inset: -60%;
    opacity: 0.028;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px 180px;
    animation: pm-noise-drift 5s steps(2, end) infinite;
    pointer-events: none;
    z-index: 10;
  }

  /* ── Perspective wrapper ─────────────────────────────────────────────── */
  .pm-perspective {
    perspective: 900px;
    transform-style: preserve-3d;
  }

  /* ── Edge fade overlays ──────────────────────────────────────────────── */
  /* No backdrop-filter: the mask-image gradient already fades the edges.
     backdrop-filter would force a full GPU readback + composite pass on
     every frame even though the overlay is just 5rem wide. */
  .pm-edge-left,
  .pm-edge-right {
    pointer-events: none;
    z-index: 20;
    position: absolute;
    top: 0;
    bottom: 0;
    width: 5rem;
  }
  .pm-edge-left {
    left: 0;
    -webkit-mask-image: linear-gradient(to right, black 15%, transparent 100%);
    mask-image: linear-gradient(to right, black 15%, transparent 100%);
  }
  .pm-edge-right {
    right: 0;
    -webkit-mask-image: linear-gradient(to left, black 15%, transparent 100%);
    mask-image: linear-gradient(to left, black 15%, transparent 100%);
  }
`;

export function injectMarqueeStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}
