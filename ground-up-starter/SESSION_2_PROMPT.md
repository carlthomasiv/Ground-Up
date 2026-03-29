# Ground Up — Claude Code Session 2
## Coffee Detail Screen + Spider Chart

Read `CLAUDE.md` fully before writing any code.

---

## Goal
Build the Coffee Detail screen — the hero screen of the app.
This is the most important screen visually. Every decision should pass the aesthetic test in CLAUDE.md.

---

## What to build

### 1. `/app/coffee/[id]/page.tsx`
Server component. Fetches coffee record from Supabase by ID.
Passes data to the client detail component.

### 2. `components/coffee-detail/CoffeeDetail.tsx`
Client component. Full detail view layout:

**Section 1 — Hero**
- Full-width bag photo (use Next.js Image, aspect ratio ~4:3)
- Gradient overlay: transparent at top → `var(--roast-deep)` at bottom
- Coffee name overlaid at bottom of photo in Playfair Display, large (48px+)
- Roaster name above coffee name in DM Mono, 10px, uppercase, accent-colored

**Section 2 — Origin tags**
Row of small tags: origin country, process, varietal
Style: DM Mono 9px uppercase, border `rgba(245,240,232,0.15)`, borderRadius 2px

**Section 3 — Spider Chart (centerpiece)**
- Use `SpiderChart` component from `components/spider-chart/SpiderChart.tsx`
- Size: 260px on mobile, 300px on desktop
- Include `SpiderModeToggle` above the chart (Both / Mine / Theirs)
- `editable={true}` — user can tap axes to adjust their layer
- `accentColor` should come from the coffee's `moment_tag` if set, else `var(--accent-light)`
- Below chart: two small legend items (dashed line = Roaster, solid = Mine)
- Save button appears only when user axes have changed (Framer Motion slide up from bottom)

**Section 4 — Flavor Tags**
Two groups visually separated:
- Roaster tags: muted border, muted text color  
- My tags: accent border, accent text, accent bg tint
- "+ Add" button to add new user tags (inline text input, adds on Enter)

**Section 5 — Brew Parameters**
Toggle between Simple and Advanced mode (DM Mono toggle, same pattern as SpiderModeToggle)

Simple fields: Brew Method, Dose, Yield, Ratio (computed)
Advanced adds: Brew Time, Temp, Grind Setting, Machine, Pressure, Filter

Each field: label in DM Mono 8px uppercase muted / value in DM Mono 12px cream

**Section 6 — Rating + Notes**
- Rating: large number (Playfair Display 64px) with /10 in muted
- Tap to edit: 0–10 slider, one decimal place
- Notes: textarea styled to match — dark background, cream text, no visible border, DM Sans
- Character: understated, like writing in a good notebook

**Section 7 — Brew Log strip**
Last 3 brew sessions shown as horizontal scroll cards
"View all" link to full brew log
Each card: date, method, dose→yield, short note

---

## Empty States
- No bag photo: show a beautiful typeset placeholder — just the roaster name and coffee name on the gradient, no broken image icon
- No user flavor axes yet: spider shows only roaster shape + a ghost version of the user shape with a "Add your interpretation →" prompt
- No brew logs: "Log your first brew" card in the same style as actual log cards

---

## Animations
- On mount: stagger reveal — photo first, then name, then each section fades up with 80ms delay between
- Spider chart edit mode: inline slider slides up from below with `AnimatePresence`
- Save button: slides up from below screen when unsaved changes exist
- All transitions: `ease: [0.16, 1, 0.3, 1]` (snappy ease-out)

---

## Data type (from Supabase)
Reference `lib/design-tokens.ts` for `FlavorAxes`, `CoffeeStatus`, `Moment` types.
The full coffee record shape mirrors `supabase/schema.sql`.

---

## Notes
- Mobile-first. This screen should feel native on a 390px phone.
- NO card shadows on the inner sections — use subtle `2px` gap between sections instead (matches the design system's "tiled" aesthetic)
- Sticky header: back arrow + coffee name (truncated) + share icon — appears after scrolling past the hero photo
