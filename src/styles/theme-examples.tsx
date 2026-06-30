/**
 * THEME USAGE EXAMPLES
 * Every token is available as a Tailwind utility class.
 * Open this file as a quick cheat-sheet — it is NOT imported anywhere.
 */

export default function ThemeExamples() {
  return (
    <div className="p-8 space-y-10 bg-base text-text font-sans">

      {/* ── COLORS ─────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Brand colors</h2>

        {/* Backgrounds */}
        <div className="bg-primary p-4 text-text-on-primary rounded-btn">bg-primary</div>
        <div className="bg-primary-light p-4 text-text-on-primary rounded-btn">bg-primary-light</div>
        <div className="bg-primary-dark p-4 text-text-on-primary rounded-btn">bg-primary-dark</div>

        <div className="bg-secondary p-4 text-text-inverse rounded-btn">bg-secondary</div>
        <div className="bg-secondary-light p-4 text-text-inverse rounded-btn">bg-secondary-light</div>

        <div className="bg-accent p-4 rounded-btn">bg-accent</div>
        <div className="bg-base-alt p-4 rounded-btn border border-border">bg-base-alt</div>
        <div className="bg-surface p-4 rounded-btn border border-border">bg-surface</div>
        <div className="bg-surface-dark p-4 text-text-inverse rounded-btn">bg-surface-dark</div>

        {/* Text colors */}
        <p className="text-primary font-semibold">text-primary</p>
        <p className="text-secondary font-semibold">text-secondary</p>
        <p className="text-accent font-semibold">text-accent</p>
        <p className="text-text">text-text (default body)</p>
        <p className="text-text-muted">text-text-muted (captions)</p>
        <p className="bg-secondary text-text-inverse px-2 rounded">text-text-inverse</p>
        <p className="bg-primary text-text-on-primary px-2 rounded">text-text-on-primary</p>
      </section>

      {/* ── SEMANTIC COLORS ────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Semantic</h2>
        <div className="bg-success-light text-success p-3 rounded-card">Success message</div>
        <div className="bg-warning-light text-warning p-3 rounded-card">Warning message</div>
        <div className="bg-danger-light text-danger p-3 rounded-card">Error message</div>
        <div className="bg-info-light text-info p-3 rounded-card">Info message</div>
      </section>

      {/* ── BUTTONS ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-primary btn-pill">Primary Pill</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-outline">Outline</button>
          <button className="btn btn-ghost">Ghost</button>
          {/* Tailwind utility equivalent — no component class needed */}
          <button className="bg-primary hover:bg-primary-dark text-text-on-primary font-semibold px-6 py-2.5 rounded-btn transition-colors">
            Utility-built button
          </button>
        </div>
      </section>

      {/* ── CARDS ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Cards</h2>
        <div className="card">Light card — <code>.card</code></div>
        <div className="card-dark text-text-inverse">Dark card — <code>.card-dark</code></div>
        {/* Tailwind utilities directly */}
        <div className="bg-surface rounded-card shadow-card p-6 border border-border">
          Utility-built card
        </div>
      </section>

      {/* ── BADGES ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-primary">New</span>
          <span className="badge badge-accent">Featured</span>
          <span className="badge badge-success">Active</span>
          {/* Utility-built */}
          <span className="inline-flex items-center px-3 py-0.5 rounded-pill bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
            Custom badge
          </span>
        </div>
      </section>

      {/* ── TYPOGRAPHY ─────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Typography</h2>
        <h1 className="font-display text-4xl font-black text-secondary">Display heading</h1>
        <p className="font-sans text-text">Body text — font-sans</p>
        <code className="font-mono text-sm bg-base-alt px-2 py-1 rounded">font-mono code</code>
        <p className="text-gradient-brand text-3xl font-black">Gradient brand text</p>
      </section>

      {/* ── LINKS ──────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Links</h2>
        {/* Styled automatically by base layer */}
        <a href="#">Default link (auto-styled by base layer)</a>
        {/* Manual utility override */}
        <a href="#" className="text-link hover:text-link-hover no-underline font-semibold">
          No-underline link
        </a>
      </section>

      {/* ── BORDERS & RADIUS ───────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Borders & radius</h2>
        <div className="border border-border rounded-btn p-3">rounded-btn + border-border</div>
        <div className="border border-border-dark rounded-card p-3">rounded-card + border-border-dark</div>
        <span className="border border-primary rounded-pill px-4 py-1 inline-block">rounded-pill</span>
      </section>

      {/* ── SHADOWS ────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Shadows</h2>
        <div className="shadow-primary rounded-card p-4 bg-base">shadow-primary (orange glow)</div>
        <div className="shadow-card rounded-card p-4 bg-base">shadow-card</div>
        <div className="shadow-dark rounded-card p-4 bg-surface-dark text-text-inverse">shadow-dark</div>
      </section>

      {/* ── GRADIENTS ──────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Gradients</h2>
        {/* Use CSS variable gradients via arbitrary value */}
        <div className="bg-[var(--gradient-brand)] rounded-card p-6 text-white font-bold">
          gradient-brand
        </div>
        <div className="bg-[var(--gradient-dark)] rounded-card p-6 text-white font-bold">
          gradient-dark
        </div>
        <div className="bg-[var(--gradient-hero)] rounded-card p-6 text-white font-bold">
          gradient-hero
        </div>
        {/* Standard Tailwind gradient using tokens */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-card p-6 text-white font-bold">
          from-primary to-accent
        </div>
      </section>

      {/* ── OVERLAY ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold mb-2">Overlay</h2>
        <div className="relative rounded-card overflow-hidden h-32">
          <div className="absolute inset-0 bg-[url('/placeholder.jpg')] bg-cover" />
          <div className="overlay-dark absolute inset-0" />
          <p className="relative z-10 text-white p-4 font-bold">overlay-dark on top of image</p>
        </div>
      </section>

    </div>
  );
}
