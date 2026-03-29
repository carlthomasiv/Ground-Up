# Ground Up — Claude Code Session 1
## First Prompt to Paste

---

Read `CLAUDE.md` fully before writing any code.

Bootstrap a Next.js 14 project for Ground Up using the App Router. Use TypeScript strict mode throughout.

## Setup tasks

1. Initialize with `create-next-app` config:
   - TypeScript: yes
   - Tailwind: yes
   - App Router: yes
   - src/ directory: no
   - import alias: @/*

2. Install dependencies:
   ```
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs framer-motion dom-to-image-more
   ```

3. Set up the global CSS in `app/globals.css`:
   - Import the Google Fonts specified in CLAUDE.md
   - Define all CSS custom properties from the color tokens
   - Set body background to `var(--roast-deep)`, color to `var(--cream)`
   - Define font-family utilities for display/mono/sans

4. Set up Tailwind config to extend with the design token colors so we can use `text-accent`, `bg-roast` etc.

5. Copy `lib/design-tokens.ts` from the starter kit into the project.

6. Copy `components/spider-chart/SpiderChart.tsx` from the starter kit.

7. Set up Supabase client:
   - `lib/supabase/client.ts` — browser client
   - `lib/supabase/server.ts` — server component client  
   - `lib/supabase/types.ts` — generated types stub (we'll regenerate after schema is applied)

8. Create `app/layout.tsx` with:
   - Font imports
   - Supabase session provider
   - Dark background, cream text

9. Create a placeholder `app/page.tsx` that just renders "Ground Up" in Playfair Display to confirm fonts and tokens are working.

## Do not build any feature screens yet — just get the foundation right.

After setup, confirm:
- Fonts render correctly
- Color tokens are accessible via CSS variables
- Supabase client initializes without errors (will need .env.local)
- SpiderChart component compiles without TypeScript errors
