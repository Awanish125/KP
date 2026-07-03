# Hero Marquee — Animation Reference

All animation behaviour is driven by `home.json` (or any data file that feeds
`PinnedHeroMarquee`). No code changes are needed to add words, change text, or
re-order layers.

---

## Scroll sequence

| Phase | Progress | What happens |
|---|---|---|
| **Scroll 1** | `0 → 0.36` | Hero heading fades. Marquee rows flash in, then exit in coordinated directions. |
| **Scroll 2** | `0.38 → 0.68` | Billboard only. Statistics count up from zero. |
| **Scroll 3** | `0.68 → 1.0` | Stats hold. Pin releases. Next section scrolls in. |

All three marquee rows animate **simultaneously** with the heading — there is no
dead zone between chapters.

### Row exit behaviors

| Row index | Exit behavior |
|---|---|
| `0` (top)    | Slides completely off-screen to the **left** |
| `1` (middle) | **Fades in place** — no horizontal movement |
| `2` (bottom) | Slides off-screen to the **left** (tiny cascade delay) |

---

## How to add a new word

Open `src/data/home.json` and add an object to any layer's `items` array:

```json
{
  "type": "text",
  "value": "MUMBAI",
  "color": "#FFFFFF",
  "fontWeight": 700,
  "fontSize": "clamp(2.4rem, 4.6vw, 5rem)",
  "uppercase": true,
  "tracking": "0.14em"
}
```

The word renders immediately at full opacity. Row-level visibility is
controlled by scroll progress — no per-word JS required.

---

## Timing constants

All chapter boundaries live in `src/components/hero/heroConfig.ts`.
Edit them to re-time the whole animation without touching any component.

| Constant | Default | Meaning |
|---|---|---|
| `HERO_PUSH_END` | `0.28` | Hero heading / content fully faded |
| `MARQUEE_ENTER_END` | `0.40` | All three rows fully opaque (fade in after heading exits) |
| `MARQUEE_HOLD_END` | `0.56` | Rows start their exit animation |
| `ROW_EXIT_END` | `0.74` | Top and middle rows fully gone |
| `ROW2_EXIT_END` | `0.78` | Bottom row fully gone (cascade delay) |

Stats timing lives in `src/components/hero/stats/heroStatsData.ts`:

| Field | Default | Meaning |
|---|---|---|
| `revealStart` | `0.38` | Count-up begins |
| `revealEnd` | `0.68` | Count-up fully complete |

---

## Configuring travel (scroll distance)

`travelFactor` in `home.json → hero.marquee` controls how many viewport heights
the pinned hero section occupies. Default is `2.0` (two scroll heights).

- Increase for a slower, more leisurely experience.
- Decrease for a tighter, snap-through feel.
- Mobile defaults to `1.8` if not explicitly set.

---

## Per-word options (all optional)

```json
{
  "type": "text",
  "value": "WORD",
  "color": "#FFFFFF",
  "fontWeight": 700,
  "fontSize": "clamp(2rem, 4vw, 5rem)",
  "uppercase": true,
  "italic": false,
  "tracking": "0.14em",
  "opacity": 1,
  "outline": false,
  "outlineColor": "#FFFFFF",
  "outlineWidth": "1px",
  "gradient": ["#F5821F", "#6F5BFF"],
  "iconBefore": { "type": "icon", "icon": "Star", "color": "#F5821F", "size": 16 },
  "iconAfter":  { "type": "icon", "icon": "ArrowRight", "color": "#fff", "size": 14 },
  "separator":  { "type": "text", "value": "/", "color": "#fff", "opacity": 0.5 }
}
```

---

## Per-layer options

```json
{
  "speed": 1.0,
  "opacity": 1,
  "y": 0,
  "scale": 1.0,
  "gap": 40,
  "separator": { ... }
}
```

> **Note:** `direction` is accepted in JSON but is not used in the current exit
> animation — row behaviors (slide vs. fade) are determined by row index (0, 1, 2).
