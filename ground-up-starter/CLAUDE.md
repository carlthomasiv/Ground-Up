# Ground Up — Claude Code Project Brief

## What this is
A personal coffee archive app built by a principal-level design leader as both a working product and a design/AI portfolio statement. Every screen should be case-study worthy. This is not a utility app — it's a craft object.

## The one-line pitch
"Track your coffees, understand your palate, share what you love — beautifully."

## Product family
- **Ground Up** — this app, for home coffee enthusiasts
- **First Crack** — future roaster-side companion (not in scope yet)

---

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + CSS custom properties for design tokens
- **Database + Auth**: Supabase (PostgreSQL, Row Level Security, Auth)
- **Deployment**: Vercel
- **Animations**: Framer Motion
- **Charts**: Custom SVG spider chart (no chart libraries — we own this component entirely)
- **Image handling**: Supabase Storage + Next.js Image
- **OCR / Enrichment**: API routes calling external services (Anthropic Claude API for enrichment)

---

## Design System

### Fonts
```css
/* Display / headings */
font-family: 'Playfair Display', serif;

/* Data / labels / UI chrome */
font-family: 'DM Mono', monospace;

/* Body / prose */
font-family: 'DM Sans', sans-serif;
```
Import in layout: `https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600`

### Color Tokens
```css
:root {
  --cream:        #F5F0E8;
  --ink:          #1A1612;
  --warm-mid:     #7A6A58;
  --roast:        #3D2B1F;
  --roast-deep:   #2A1D14;
  --accent:       #C4622D;
  --accent-light: #E8A87C;
  --muted:        #B5A898;
  --sand:         #EDE8DF;
}
```

### Moment Theme Tokens
Each "moment" (morning/afternoon/evening/weekend) has its own accent color that tints the share card and certain UI elements:
```js
const momentThemes = {
  morning:   { accent: '#F5C842', bg: 'morning'   }, // warm gold
  afternoon: { accent: '#A8C4A0', bg: 'afternoon' }, // sage green
  evening:   { accent: '#C4A0E8', bg: 'evening'   }, // lavender
  weekend:   { accent: '#E8A87C', bg: 'weekend'   }, // amber
}
```

### Spacing & Radius
- Border radius: `2px` everywhere (almost sharp — deliberate craft feel, not rounded/bubbly)
- Section padding: `48px` desktop, `24px` mobile
- Component gap grid: `2px` between grid items (creates a "tiled" feel)

### Typography Scale
```
Display:  Playfair Display, 48–80px, weight 700, tracking -0.02em
Heading:  Playfair Display, 28–36px, weight 600
Label:    DM Mono, 9–11px, weight 400, tracking 0.15em, UPPERCASE
Body:     DM Sans, 14–15px, weight 300, line-height 1.7
Data:     DM Mono, 11–13px, weight 500
```

---

## Component Philosophy

**Never use a UI library component if it can be built simply.** No shadcn, no Radix for visual components — we own the aesthetic entirely. Utility hooks from Radix (useDialog, etc.) are fine.

**Every component should look intentional at every state:**
- Default
- Hover (subtle, never jarring)
- Loading (skeleton that matches the component's shape exactly)
- Empty (never a blank space — always a designed empty state)
- Error

**Dark backgrounds default.** The app is primarily dark-themed (roast-deep/roast backgrounds). Light surfaces (`--cream`, `--sand`) are used for cards and data surfaces within dark contexts — not as page backgrounds.

---

## Key Components to Build

### 1. SpiderChart (Priority: Critical)
Two-layer SVG radar chart. This is the most important visual component.

**Spec:**
- 7 axes: Acidity, Fruit, Body, Roast, Sweetness, Floral, Finish
- Layer 1 (Roaster): white dashed outline only, NO fill. Renders first, sits behind.
- Layer 2 (Mine): solid colored fill (low opacity ~0.15) + solid stroke. Color inherits from `--accent` or moment theme.
- Both layers share identical axis geometry — shapes overlap when palates agree, diverge when they don't.
- Toggle modes: `'both'` | `'mine'` | `'roaster'` — animated transition between states
- Tap/click a point to enter edit mode for that axis (slider appears inline)
- Grid lines: 3 concentric shapes, very low opacity (0.08)
- Axis labels: DM Mono, 7px, UPPERCASE, 0.06em tracking
- The chart MUST be a custom SVG — do not use Recharts or Victory for this

**Data shape:**
```ts
type FlavorAxes = {
  acidity:   number; // 0–10
  fruit:     number;
  body:      number;
  roast:     number;
  sweetness: number;
  floral:    number;
  finish:    number;
}
```

### 2. CoffeeDetailScreen
The hero screen. Layout from top:
- Full-bleed bag photo (top 40% of screen) with gradient fade to dark
- Coffee name (Playfair Display, large) overlaid on photo bottom
- Roaster name + origin tags
- SpiderChart (center stage)
- Flavor tags (roaster tags muted, user tags accent-colored)
- Brew parameters section (expandable: simple ↔ advanced)
- Tasting notes (rich text)
- Rating (0–10, single decimal, not stars)

### 3. ShareCard
Exportable card component. Renders identically whether shown in-app or exported as PNG.
- Moment-themed background (4 variants — see Moment Theme Tokens)
- Background is a layered radial gradient — NOT a flat color
- All text, spider chart, tags, and brew params inside a single contained card
- Export via `html2canvas` or `dom-to-image-more`
- Moment label in top-left (DM Mono, UPPERCASE, accent-colored)
- "GROUND UP" wordmark top-right (very muted)
- Spider chart: smaller version, same two-layer logic
- Flavor tags: roaster tags muted, mine in moment accent color
- Rating large in bottom-left (Playfair Display)
- Brew params bottom-right (DM Mono, small)

### 4. BagScanFlow
Multi-step flow:
1. Camera / image upload
2. "Reading bag..." loading state (animated, coffee-themed — not a generic spinner)
3. Enrichment result review — show what was pulled, let user correct
4. Spider chart seed from roaster data
5. Save → navigate to CoffeeDetail

### 5. ShelfScreen (Home)
Grid of CoffeeCards. Status-driven grouping:
- "In the Grinder" (currently drinking)
- "Running Low"  
- "Up Next" (want to try)
- Filter/sort bar (origin, process, rating, roast date)

Empty state: NOT a blank grid. Show a ghost CoffeeCard with a beautifully typeset prompt to add the first coffee.

---

## Database Schema (Supabase)

See `supabase/schema.sql` for the full migration.

Key tables:
- `profiles` — extends Supabase auth.users
- `coffees` — the core coffee record
- `brew_logs` — brew sessions tied to a coffee
- `user_rigs` — grinder + machine profile per user

Row Level Security: ALL tables have RLS enabled. Users can only read/write their own data.

---

## API Routes

### `/api/enrich-bag`
POST with image → returns structured coffee data
- Calls Anthropic Claude API (claude-sonnet-4-6) 
- Prompt instructs it to extract: roaster, coffee name, origin, process, varietal, roast date, flavor notes
- Returns JSON matching the `coffees` table shape
- Falls back gracefully — partial data is fine, user confirms before saving

### `/api/scrape-roaster`  
POST with roaster URL → returns flavor axes + tasting notes
- Fetches roaster product page
- Calls Claude API to parse flavor language into the 7-axis FlavorAxes object
- Returns `{ roasterAxes: FlavorAxes, tasteNotes: string[] }`

---

## File Structure
```
/app
  /layout.tsx          — fonts, global styles, Supabase provider
  /page.tsx            — shelf / home (requires auth)
  /coffee/[id]/page.tsx — coffee detail
  /scan/page.tsx       — bag scan flow
  /share/[id]/page.tsx — shareable share card URL (public, no auth)
  /onboarding/page.tsx — rig setup + first coffee
  /api/
    /enrich-bag/route.ts
    /scrape-roaster/route.ts

/components
  /spider-chart/       — SpiderChart.tsx + hooks
  /share-card/         — ShareCard.tsx + moment themes
  /coffee-card/        — CoffeeCard.tsx (shelf tile)
  /brew-log/           — BrewLog.tsx + SimpleMode + AdvancedMode
  /scan-flow/          — multi-step scan component
  /ui/                 — Tag, Rating, StatusBadge, EmptyState

/lib
  /supabase/           — client.ts, server.ts, types.ts
  /enrichment/         — bag-ocr.ts, roaster-scrape.ts
  /design-tokens.ts    — moment themes, color constants

/supabase
  /schema.sql          — full migration
  /seed.sql            — sample coffee data for development
```

---

## Code Style Rules

1. **TypeScript strict mode** — no `any`, ever
2. **No inline styles** — Tailwind classes only, with CSS custom properties for design tokens
3. **Server Components by default** — only use `'use client'` when you need interactivity or browser APIs
4. **Loading states are not optional** — every async operation gets a skeleton, not a spinner
5. **Mobile-first breakpoints** — design for 390px first, scale up
6. **Framer Motion for all transitions** — `AnimatePresence` for mount/unmount, `layout` prop for list reorders
7. **SVG spider chart** — never replace with a charting library

---

## The Aesthetic Test

Before shipping any screen, ask:
- Would someone screenshot this and share it?
- Does it look like it belongs next to Onyx Coffee Lab's website?
- Does every state (loading, empty, error) feel designed — not defaulted?
- Is the typography hierarchy immediately legible at a glance?

If any answer is no — it's not done yet.

---

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```
