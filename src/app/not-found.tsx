/**
 * Branded 404 — an empty billboard, because of course it is.
 * The flicker on "AVAILABLE" is a pure-CSS opacity/text-shadow loop
 * (compositor-only) and is disabled for prefers-reduced-motion.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2.5rem",
        background: "var(--kp-dark)",
        padding: "2rem 1.5rem",
      }}
    >
      {/* The billboard */}
      <div style={{ width: "min(720px, 92vw)" }}>
        <div
          style={{
            position: "relative",
            border: "3px solid var(--kp-dark-2)",
            outline: "1px solid rgba(245, 247, 250, 0.12)",
            borderRadius: "0.75rem",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(245, 130, 31, 0.09), transparent 65%), var(--kp-dark-2)",
            padding: "clamp(2.5rem, 8vw, 5rem) clamp(1.5rem, 6vw, 4rem)",
            textAlign: "center",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.55)",
          }}
        >
          {/* Floodlight glow along the top edge */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: 2,
              background:
                "linear-gradient(90deg, transparent, var(--kp-orange-glow), transparent)",
            }}
          />
          <p
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: "var(--kp-orange)",
              margin: 0,
            }}
          >
            Error 404 · Prime Location
          </p>
          <h1
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "clamp(2.2rem, 7vw, 4.6rem)",
              lineHeight: 1.04,
              textTransform: "uppercase",
              color: "var(--kp-light)",
              margin: "1.2rem 0 0",
            }}
          >
            This hoarding is
            <br />
            <span className="kp-404-flicker" style={{ color: "var(--kp-orange)" }}>
              Available
            </span>
          </h1>
          <p
            style={{
              fontFamily: "var(--kp-font-body)",
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "rgba(245, 247, 250, 0.6)",
              maxWidth: "34rem",
              margin: "1.4rem auto 0",
            }}
          >
            The page you&rsquo;re looking for has moved on. Your brand, however,
            could live on a spot exactly this visible.
          </p>
        </div>

        {/* Billboard legs */}
        <div
          aria-hidden
          style={{ display: "flex", justifyContent: "center", gap: "18%" }}
        >
          <span style={{ width: 10, height: "clamp(3rem, 8vw, 5rem)", background: "var(--kp-dark-2)" }} />
          <span style={{ width: 10, height: "clamp(3rem, 8vw, 5rem)", background: "var(--kp-dark-2)" }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
        <Link
          href="/"
          className="no-underline"
          style={{
            fontFamily: "var(--kp-font-body)",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "1rem 2.2rem",
            borderRadius: 999,
            background: "var(--kp-orange)",
            color: "var(--kp-dark)",
            boxShadow: "0 8px 32px var(--kp-orange-glow)",
          }}
        >
          Back to Home
        </Link>
        <Link
          href="/contact"
          className="no-underline"
          style={{
            fontFamily: "var(--kp-font-body)",
            fontWeight: 600,
            fontSize: "0.95rem",
            padding: "1rem 2.2rem",
            borderRadius: 999,
            border: "1px solid rgba(245, 247, 250, 0.25)",
            color: "var(--kp-light)",
            background: "transparent",
          }}
        >
          Book This Space
        </Link>
      </div>

      <style>{`
        @keyframes kp-404-flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 22px var(--kp-orange-glow); }
          6%  { opacity: 0.45; text-shadow: none; }
          9%  { opacity: 1; }
          14% { opacity: 0.7; }
          17% { opacity: 1; text-shadow: 0 0 30px var(--kp-orange-glow); }
          52% { opacity: 1; }
          55% { opacity: 0.55; text-shadow: none; }
          58% { opacity: 1; text-shadow: 0 0 22px var(--kp-orange-glow); }
        }
        .kp-404-flicker { animation: kp-404-flicker 4.2s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .kp-404-flicker { animation: none; }
        }
      `}</style>
    </div>
  );
}
