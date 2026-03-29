# Ground Up — Claude Code Session 0
## Project Bootstrap: GitHub + Vercel + Supabase

Read `CLAUDE.md` fully before writing any code.

---

## Goal
Initialize the Next.js project inside the existing GitHub repo and wire up
Vercel + Supabase so every push to `main` auto-deploys to a live URL.

---

## Repo
https://github.com/carlthomasiv/Ground-Up

This repo already exists. We are initializing the project inside it.

---

## Step 1 — Initialize Next.js inside the repo

Run this inside the cloned repo root:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-git
```

The `--no-git` flag is critical — the repo already exists, don't reinitialize.

---

## Step 2 — Install dependencies

```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  framer-motion \
  dom-to-image-more \
  @types/dom-to-image-more
```

---

## Step 3 — Create `.env.local`

Create `.env.local` in the repo root with these variables.
The user will fill in the values from their Supabase project dashboard:

```env
# Supabase — get these from supabase.com → project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic — get from console.anthropic.com
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Also create `.env.local.example` with the same keys but empty values —
this gets committed to the repo so collaborators know what's needed.

Make sure `.env.local` is in `.gitignore` (Next.js adds this automatically).

---

## Step 4 — Set up Supabase clients

Create `lib/supabase/client.ts` — browser client for use in Client Components:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts` — server client for Server Components and API routes:

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}
```

Create `lib/supabase/middleware.ts` — refreshes auth session on every request:

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}
```

Create `middleware.ts` in the repo root:

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Step 5 — Global styles

Replace `app/globals.css` entirely with:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

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

  --font-display: 'Playfair Display', serif;
  --font-mono:    'DM Mono', monospace;
  --font-sans:    'DM Sans', sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background: var(--roast-deep);
  color: var(--cream);
  font-family: var(--font-sans);
  font-weight: 300;
  line-height: 1.7;
}

/* Scrollbar — minimal, on-brand */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(245,240,232,0.1); border-radius: 2px; }
```

---

## Step 6 — Tailwind config

Replace `tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:        '#F5F0E8',
        ink:          '#1A1612',
        'warm-mid':   '#7A6A58',
        roast:        '#3D2B1F',
        'roast-deep': '#2A1D14',
        accent:       '#C4622D',
        'accent-light':'#E8A87C',
        muted:        '#B5A898',
        sand:         '#EDE8DF',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        mono:    ['DM Mono', 'monospace'],
        sans:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm:      '2px',
        md:      '2px',
        lg:      '2px',
        xl:      '4px',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Step 7 — App layout

Create `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'Ground Up',
  description: 'Your personal coffee archive',
  themeColor:  '#2A1D14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

---

## Step 8 — Confirmation page

Create `app/page.tsx` — a simple page that confirms the stack is wired correctly:

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 72,
        fontWeight: 700,
        color: 'var(--cream)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        Ground <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Up</em>
      </h1>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
      }}>
        {user ? `Signed in as ${user.email}` : 'Stack confirmed · Auth ready'}
      </p>
    </main>
  )
}
```

---

## Step 9 — Copy starter kit files

Copy these files from the starter kit into the project (they already exist in the zip):
- `lib/design-tokens.ts` → already correct path
- `components/spider-chart/SpiderChart.tsx` → already correct path
- `supabase/schema.sql` → already correct path

---

## Step 10 — Commit and push

```bash
git add .
git commit -m "feat: initialize Ground Up — Next.js 14, Supabase, design system"
git push origin main
```

---

## Step 11 — Connect Vercel (user does this in browser)

Tell the user to do the following manually — this can't be done via CLI without auth:

1. Go to **vercel.com/new**
2. Click **"Import Git Repository"**
3. Select **carlthomasiv/Ground-Up**
4. Framework preset will auto-detect as **Next.js** ✓
5. Under **Environment Variables**, add all four keys from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
6. Click **Deploy**

First deploy takes ~2 minutes. After that, every push to `main` auto-deploys in ~30 seconds.

---

## Step 12 — Add Vercel URL to Supabase Auth (user does this in browser)

Once Vercel gives you a URL (e.g. `ground-up-ivory.vercel.app`):

1. Go to **supabase.com** → your project → **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL
3. Add to **Redirect URLs**:
   - `https://your-vercel-url.vercel.app/**`
   - `http://localhost:3000/**` (for local dev)

This is required for auth redirects to work correctly after signup/login.

---

## Confirm everything works when:
- [ ] `npm run dev` starts without errors
- [ ] `localhost:3000` shows "Ground Up" in Playfair Display
- [ ] Fonts render correctly (display/mono/sans all distinct)
- [ ] Color tokens visible in browser dev tools under `:root`
- [ ] Supabase client initializes (no console errors)
- [ ] GitHub push triggers Vercel deploy
- [ ] Live Vercel URL shows the same confirmation page

---

## After this session, the project is ready for Session 1.
Move to `SESSION_1_PROMPT.md` — Coffee Detail screen + Spider Chart.
