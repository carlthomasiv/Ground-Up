'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CoffeeCard, GhostCoffeeCard } from '@/components/coffee-card/CoffeeCard'
import { statusConfig } from '@/lib/design-tokens'
import type { Coffee } from '@/lib/supabase/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'recent' | 'rating' | 'roast_date'

interface FilterState {
  process:    string | null
  origin:     string | null
  roastLevel: string | null
  sort:       SortKey
}

// ─── Status section config ────────────────────────────────────────────────────

const STATUS_SECTIONS: { status: string; heading: string }[] = [
  { status: 'drinking',    heading: 'In the Grinder' },
  { status: 'running_low', heading: 'Running Low'    },
  { status: 'want_to_try', heading: 'Up Next'        },
  { status: 'finished',    heading: 'Finished'       },
]

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  coffees:  Coffee[]
  filters:  FilterState
  onChange: (f: FilterState) => void
}

function FilterBar({ coffees, filters, onChange }: FilterBarProps) {
  const processes    = [...new Set(coffees.map(c => c.process).filter(Boolean))] as string[]
  const origins      = [...new Set(coffees.map(c => c.origin_country).filter(Boolean))] as string[]
  const roastLevels  = [...new Set(coffees.map(c => c.roast_level).filter(Boolean))] as string[]

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'recent',     label: 'Recent'     },
    { key: 'rating',     label: 'Top Rated'  },
    { key: 'roast_date', label: 'Freshest'   },
  ]

  const pill = (
    label: string,
    active: boolean,
    onClick: () => void,
    accentColor = 'var(--accent)'
  ) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        padding: '5px 12px',
        borderRadius: 2,
        border: active ? `1px solid ${accentColor}` : '1px solid rgba(245,240,232,0.12)',
        background: active ? `${accentColor}18` : 'transparent',
        color: active ? accentColor : 'rgba(245,240,232,0.4)',
        cursor: 'pointer',
        transition: 'all 0.18s',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </button>
  )

  const hasFilters = filters.process || filters.origin || filters.roastLevel

  return (
    <div style={{ borderBottom: '1px solid rgba(245,240,232,0.06)', paddingBottom: 0 }}>
      {/* Sort row */}
      <div
        className="flex gap-2 overflow-x-auto px-5 py-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {sortOptions.map(({ key, label }) =>
          pill(label, filters.sort === key, () => onChange({ ...filters, sort: key }))
        )}

        {/* Divider */}
        <div style={{ width: 1, background: 'rgba(245,240,232,0.1)', flexShrink: 0, margin: '2px 4px' }} />

        {/* Process filters */}
        {processes.map(p =>
          pill(
            p,
            filters.process === p,
            () => onChange({ ...filters, process: filters.process === p ? null : p })
          )
        )}

        {/* Origin filters */}
        {origins.map(o =>
          pill(
            o,
            filters.origin === o,
            () => onChange({ ...filters, origin: filters.origin === o ? null : o })
          )
        )}

        {/* Roast level filters */}
        {roastLevels.map(r =>
          pill(
            r.replace(/_/g, ' '),
            filters.roastLevel === r,
            () => onChange({ ...filters, roastLevel: filters.roastLevel === r ? null : r })
          )
        )}

        {/* Clear */}
        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              onClick={() => onChange({ ...filters, process: null, origin: null, roastLevel: null })}
              style={{
                flexShrink: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                padding: '5px 10px',
                borderRadius: 2,
                border: '1px solid rgba(196,98,45,0.4)',
                background: 'transparent',
                color: 'var(--accent)',
                cursor: 'pointer',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              Clear ×
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ heading, count }: { heading: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3 px-5 pt-7 pb-4">
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 600,
        color: 'var(--cream)',
        letterSpacing: '-0.01em',
      }}>
        {heading}
      </h2>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.13em',
        color: 'var(--muted)',
      }}>
        {count}
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ShelfScreenProps {
  coffees: Coffee[]
}

export function ShelfScreen({ coffees }: ShelfScreenProps) {
  const [filters, setFilters] = useState<FilterState>({
    process:    null,
    origin:     null,
    roastLevel: null,
    sort:       'recent',
  })

  const filtered = useMemo(() => {
    let list = [...coffees]

    if (filters.process)    list = list.filter(c => c.process === filters.process)
    if (filters.origin)     list = list.filter(c => c.origin_country === filters.origin)
    if (filters.roastLevel) list = list.filter(c => c.roast_level === filters.roastLevel)

    if (filters.sort === 'rating') {
      list.sort((a, b) => (b.user_rating ?? 0) - (a.user_rating ?? 0))
    } else if (filters.sort === 'roast_date') {
      list.sort((a, b) => {
        if (!a.roast_date) return 1
        if (!b.roast_date) return -1
        return new Date(b.roast_date).getTime() - new Date(a.roast_date).getTime()
      })
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return list
  }, [coffees, filters])

  // Group by status
  const grouped = useMemo(() => {
    const map: Record<string, Coffee[]> = {}
    for (const c of filtered) {
      if (!map[c.status]) map[c.status] = []
      map[c.status].push(c)
    }
    return map
  }, [filtered])

  const isEmpty = coffees.length === 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--roast-deep)' }}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid rgba(245,240,232,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(42,29,20,0.95)',
        backdropFilter: 'blur(8px)',
      }}>
        <div className="flex items-center justify-between px-5 py-4">
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--cream)',
            letterSpacing: '-0.02em',
          }}>
            Ground <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Up</em>
          </h1>
          <button
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Scan
          </button>
        </div>

        {/* Filter bar — only show if there are coffees */}
        {!isEmpty && (
          <FilterBar coffees={coffees} filters={filters} onChange={setFilters} />
        )}
      </header>

      {/* ── EMPTY STATE ─────────────────────────────────────────────── */}
      {isEmpty && (
        <motion.div
          className="px-5 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 16,
          }}>
            Your Archive
          </p>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <GhostCoffeeCard />
            <div style={{ aspectRatio: '3/4' }} /> {/* Offset second column */}
          </div>
        </motion.div>
      )}

      {/* ── NO RESULTS (filtered) ────────────────────────────────────── */}
      {!isEmpty && filtered.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center px-5 py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', color: 'rgba(245,240,232,0.25)', marginBottom: 8 }}>
            Nothing matches those filters
          </p>
          <button
            onClick={() => setFilters({ process: null, origin: null, roastLevel: null, sort: 'recent' })}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear filters
          </button>
        </motion.div>
      )}

      {/* ── STATUS SECTIONS ─────────────────────────────────────────── */}
      {STATUS_SECTIONS.map(({ status, heading }) => {
        const items = grouped[status]
        if (!items?.length) return null

        const statusKey = status as keyof typeof statusConfig
        const _ = statusConfig[statusKey] // just for type validation

        return (
          <motion.section
            key={status}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <SectionHeading heading={heading} count={items.length} />
            <div
              className="px-5"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
              }}
            >
              {items.map((coffee, i) => (
                <CoffeeCard key={coffee.id} coffee={coffee} index={i} />
              ))}
            </div>
          </motion.section>
        )
      })}

      {/* Bottom padding for comfortable scroll */}
      <div style={{ height: 48 }} />
    </div>
  )
}
