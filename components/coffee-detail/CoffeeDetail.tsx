'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { SpiderChart, SpiderModeToggle } from '@/components/spider-chart/SpiderChart'
import type { SpiderMode } from '@/components/spider-chart/SpiderChart'
import { momentThemes, brewMethodLabels } from '@/lib/design-tokens'
import type { FlavorAxes, Moment } from '@/lib/design-tokens'
import type { Coffee, BrewLog } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const SECTION_VARIANTS = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay } },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function initUserAxes(c: Coffee): FlavorAxes {
  return {
    acidity:   c.user_acidity   ?? 5,
    fruit:     c.user_fruit     ?? 5,
    body:      c.user_body      ?? 5,
    roast:     c.user_roast     ?? 5,
    sweetness: c.user_sweetness ?? 5,
    floral:    c.user_floral    ?? 5,
    finish:    c.user_finish    ?? 5,
  }
}

function initRoasterAxes(c: Coffee): Partial<FlavorAxes> {
  const a: Partial<FlavorAxes> = {}
  if (c.roaster_acidity   !== null) a.acidity   = c.roaster_acidity
  if (c.roaster_fruit     !== null) a.fruit     = c.roaster_fruit
  if (c.roaster_body      !== null) a.body      = c.roaster_body
  if (c.roaster_roast     !== null) a.roast     = c.roaster_roast
  if (c.roaster_sweetness !== null) a.sweetness = c.roaster_sweetness
  if (c.roaster_floral    !== null) a.floral    = c.roaster_floral
  if (c.roaster_finish    !== null) a.finish    = c.roaster_finish
  return a
}

function axesEqual(a: FlavorAxes, b: FlavorAxes): boolean {
  return (Object.keys(a) as (keyof FlavorAxes)[]).every(k => a[k] === b[k])
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({
  children,
  accent,
  accentColor,
}: {
  children: React.ReactNode
  accent?: boolean
  accentColor?: string
}) {
  const base: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.13em',
    textTransform: 'uppercase',
    borderRadius: 2,
    padding: '4px 10px',
    display: 'inline-block',
  }
  if (accent && accentColor) {
    return (
      <span style={{
        ...base,
        color: accentColor,
        border: `1px solid ${accentColor}55`,
        background: `${accentColor}12`,
      }}>
        {children}
      </span>
    )
  }
  return (
    <span style={{
      ...base,
      color: 'var(--muted)',
      border: '1px solid rgba(245,240,232,0.13)',
    }}>
      {children}
    </span>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'block',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: 'var(--muted)',
      marginBottom: 12,
    }}>
      {children}
    </span>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(245,240,232,0.06)', margin: '32px 0' }} />
}

function BrewParamsDisplay({ log, mode }: { log: BrewLog; mode: 'simple' | 'advanced' }) {
  type Field = { label: string; value: string }
  const fields: Field[] = [
    { label: 'Method', value: brewMethodLabels[log.brew_method] },
  ]
  if (log.dose_grams)  fields.push({ label: 'Dose',  value: `${log.dose_grams}g` })
  if (log.yield_grams) fields.push({ label: 'Yield', value: `${log.yield_grams}g` })
  if (log.ratio)       fields.push({ label: 'Ratio', value: `1:${log.ratio.toFixed(1)}` })

  if (mode === 'advanced') {
    if (log.brew_time_sec)      fields.push({ label: 'Time',     value: `${log.brew_time_sec}s` })
    if (log.brew_temp_f)        fields.push({ label: 'Temp',     value: `${log.brew_temp_f}°F` })
    if (log.grind_setting)      fields.push({ label: 'Grind',    value: log.grind_setting })
    if (log.machine_model)      fields.push({ label: 'Machine',  value: log.machine_model })
    if (log.line_pressure_bars) fields.push({ label: 'Pressure', value: `${log.line_pressure_bars} bar` })
    if (log.filter_type)        fields.push({ label: 'Filter',   value: log.filter_type })
  }

  return (
    <motion.div
      key={mode}
      className="grid grid-cols-2"
      style={{ gap: 2 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {fields.map(({ label, value }) => (
        <div key={label} style={{ background: 'rgba(245,240,232,0.03)', padding: '10px 12px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
            {label}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cream)' }}>
            {value}
          </p>
        </div>
      ))}
    </motion.div>
  )
}

function BrewLogCard({ log, accentColor }: { log: BrewLog; accentColor: string }) {
  return (
    <div style={{
      flexShrink: 0,
      width: 176,
      background: 'rgba(245,240,232,0.04)',
      border: '1px solid rgba(245,240,232,0.08)',
      borderRadius: 2,
      padding: '14px 16px',
      scrollSnapAlign: 'start',
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', marginBottom: 6 }}>
        {formatDate(log.brew_date)}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor, marginBottom: 8 }}>
        {brewMethodLabels[log.brew_method]}
      </p>
      {log.dose_grams && log.yield_grams && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cream)', marginBottom: 4 }}>
          {log.dose_grams}g → {log.yield_grams}g
        </p>
      )}
      {log.notes && (
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--muted)',
          fontWeight: 300,
          lineHeight: 1.5,
          marginTop: 6,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {log.notes}
        </p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CoffeeDetailProps {
  coffee:   Coffee
  brewLogs: BrewLog[]
}

export function CoffeeDetail({ coffee, brewLogs }: CoffeeDetailProps) {
  const supabase = createClient()

  // Spider chart
  const [spiderMode, setSpiderMode]         = useState<SpiderMode>('both')
  const [userAxes, setUserAxes]             = useState<FlavorAxes>(() => initUserAxes(coffee))
  const [committedAxes, setCommittedAxes]   = useState<FlavorAxes>(() => initUserAxes(coffee))
  const [isSavingAxes, setIsSavingAxes]     = useState(false)
  const hasUnsavedAxes                       = !axesEqual(userAxes, committedAxes)

  // Flavor tags
  const [userTags, setUserTags]             = useState<string[]>(coffee.user_taste_notes ?? [])
  const [newTag, setNewTag]                 = useState('')
  const [showTagInput, setShowTagInput]     = useState(false)

  // Brew params mode
  const [brewMode, setBrewMode]             = useState<'simple' | 'advanced'>('simple')

  // Rating
  const [rating, setRating]                 = useState(coffee.user_rating ?? 0)
  const [isEditingRating, setIsEditingRating] = useState(false)

  // Notes
  const [notes, setNotes]                   = useState(coffee.user_notes ?? '')

  // Sticky header
  const heroRef                             = useRef<HTMLDivElement>(null)
  const [showHeader, setShowHeader]         = useState(false)
  const { scrollY }                         = useScroll()

  useEffect(() => {
    return scrollY.on('change', (y) => {
      const h = heroRef.current?.offsetHeight ?? 300
      setShowHeader(y > h * 0.7)
    })
  }, [scrollY])

  // Derived
  const accentColor = coffee.moment_tag
    ? momentThemes[coffee.moment_tag as Moment].spiderStroke
    : 'var(--accent-light)'

  const roasterAxes   = initRoasterAxes(coffee)
  const hasRoasterData = Object.keys(roasterAxes).length > 0

  const roastDateStr = coffee.roast_date
    ? new Date(coffee.roast_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  // Handlers
  const handleAxesChange = useCallback((axes: FlavorAxes) => setUserAxes(axes), [])

  const handleSaveAxes = async () => {
    setIsSavingAxes(true)
    await supabase.from('coffees').update({
      user_acidity:   userAxes.acidity,
      user_fruit:     userAxes.fruit,
      user_body:      userAxes.body,
      user_roast:     userAxes.roast,
      user_sweetness: userAxes.sweetness,
      user_floral:    userAxes.floral,
      user_finish:    userAxes.finish,
    }).eq('id', coffee.id)
    setCommittedAxes({ ...userAxes })
    setIsSavingAxes(false)
  }

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase()
    if (tag && !userTags.includes(tag)) {
      const updated = [...userTags, tag]
      setUserTags(updated)
      supabase.from('coffees').update({ user_taste_notes: updated }).eq('id', coffee.id)
    }
    setNewTag('')
    setShowTagInput(false)
  }

  const handleSaveRating = async () => {
    await supabase.from('coffees').update({ user_rating: rating }).eq('id', coffee.id)
    setIsEditingRating(false)
  }

  const handleSaveNotes = async () => {
    await supabase.from('coffees').update({ user_notes: notes }).eq('id', coffee.id)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--roast-deep)' }}>

      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHeader && (
          <motion.header
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
            style={{ background: 'rgba(42,29,20,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(245,240,232,0.06)' }}
            initial={{ y: -52 }}
            animate={{ y: 0 }}
            exit={{ y: -52 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <Link href="/">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                ← Back
              </span>
            </Link>
            <span
              className="truncate"
              style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--cream)', maxWidth: 200 }}
            >
              {coffee.coffee_name}
            </span>
            <button style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Share
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <motion.div
        ref={heroRef}
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4/3', maxHeight: '65vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {coffee.bag_photo_url ? (
          <Image
            src={coffee.bag_photo_url}
            alt={coffee.coffee_name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          /* No photo empty state — typeset on gradient */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--roast) 0%, var(--roast-deep) 100%)' }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)', marginBottom: 12 }}>
              {coffee.roaster_name}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'rgba(245,240,232,0.15)', textAlign: 'center', padding: '0 32px' }}>
              {coffee.coffee_name}
            </span>
          </div>
        )}

        {/* Gradient fade to page bg */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(42,29,20,0) 0%, rgba(42,29,20,0) 25%, rgba(42,29,20,0.8) 65%, rgba(42,29,20,1) 100%)' }}
        />

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <motion.p
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: accentColor, marginBottom: 4 }}
            {...SECTION_VARIANTS(0.2)}
          >
            {coffee.roaster_name}
          </motion.p>
          <motion.h1
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 8vw, 52px)', fontWeight: 700, color: 'var(--cream)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
            {...SECTION_VARIANTS(0.3)}
          >
            {coffee.coffee_name}
          </motion.h1>
        </div>
      </motion.div>

      {/* ── CONTENT ───────────────────────────────────────────────────── */}
      <div className="px-6 pb-40">

        {/* Origin tags */}
        <motion.div
          className="flex flex-wrap gap-2 pt-5 pb-6"
          {...SECTION_VARIANTS(0.4)}
        >
          {([
            coffee.origin_country,
            coffee.process,
            coffee.varietal,
            coffee.roast_level?.replace(/_/g, ' '),
            roastDateStr ? `Roasted ${roastDateStr}` : null,
          ] as (string | null)[]).filter(Boolean).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </motion.div>

        <Divider />

        {/* ── SPIDER CHART ───────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col items-center"
          {...SECTION_VARIANTS(0.5)}
        >
          <div className="flex items-center justify-between w-full mb-5">
            <Label>Flavor Profile</Label>
            <SpiderModeToggle mode={spiderMode} onChange={setSpiderMode} accentColor={accentColor} />
          </div>

          {hasRoasterData || true ? (
            <SpiderChart
              roasterAxes={roasterAxes}
              userAxes={userAxes}
              onUserChange={handleAxesChange}
              accentColor={accentColor}
              mode={spiderMode}
              size={280}
              editable
            />
          ) : (
            /* No roaster data empty state */
            <div style={{ width: 280, height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(245,240,232,0.1)', borderRadius: 2 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(245,240,232,0.3)', fontStyle: 'italic', textAlign: 'center' }}>
                Tap an axis to add your interpretation →
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-6 mt-10 mb-2">
            <div className="flex items-center gap-2">
              <svg width={20} height={2}>
                <line x1={0} y1={1} x2={20} y2={1} stroke="rgba(245,240,232,0.35)" strokeWidth={1.5} strokeDasharray="4 3" />
              </svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Roaster
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg width={20} height={2}>
                <line x1={0} y1={1} x2={20} y2={1} stroke={accentColor} strokeWidth={1.5} />
              </svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Mine
              </span>
            </div>
          </div>
        </motion.div>

        <Divider />

        {/* ── FLAVOR TAGS ────────────────────────────────────────────── */}
        <motion.div {...SECTION_VARIANTS(0.6)}>
          <Label>Tasting Notes</Label>
          <div className="flex flex-wrap gap-2">
            {(coffee.roaster_taste_notes ?? []).map((tag) => (
              <Tag key={`r-${tag}`}>{tag}</Tag>
            ))}
            {userTags.map((tag) => (
              <Tag key={`u-${tag}`} accent accentColor={accentColor}>{tag}</Tag>
            ))}

            <AnimatePresence mode="wait">
              {showTagInput ? (
                <motion.input
                  key="tag-input"
                  autoFocus
                  initial={{ opacity: 0, width: 64 }}
                  animate={{ opacity: 1, width: 110 }}
                  exit={{ opacity: 0 }}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag()
                    if (e.key === 'Escape') { setShowTagInput(false); setNewTag('') }
                  }}
                  onBlur={handleAddTag}
                  placeholder="add note…"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', background: 'transparent', border: `1px solid ${accentColor}55`, borderRadius: 2, padding: '4px 10px', color: 'var(--cream)', outline: 'none' }}
                />
              ) : (
                <motion.button
                  key="tag-add"
                  onClick={() => setShowTagInput(true)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', border: '1px dashed rgba(245,240,232,0.18)', borderRadius: 2, padding: '4px 10px', background: 'transparent', cursor: 'pointer' }}
                >
                  + Add
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <Divider />

        {/* ── BREW PARAMS ─────────────────────────────────────────────── */}
        <motion.div {...SECTION_VARIANTS(0.7)}>
          <div className="flex items-center justify-between mb-5">
            <Label>Brew Parameters</Label>
            <div style={{ display: 'flex', gap: 2, background: 'rgba(245,240,232,0.05)', padding: 3 }}>
              {(['simple', 'advanced'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setBrewMode(m)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '5px 12px',
                    border: 'none',
                    background: brewMode === m ? 'rgba(245,240,232,0.1)' : 'transparent',
                    color: brewMode === m ? 'var(--cream)' : 'rgba(245,240,232,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderRadius: 1,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {brewLogs.length > 0 ? (
            <BrewParamsDisplay log={brewLogs[0]} mode={brewMode} />
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontStyle: 'italic', color: 'rgba(245,240,232,0.2)' }}>
                No brews logged yet
              </p>
            </div>
          )}
        </motion.div>

        <Divider />

        {/* ── RATING + NOTES ──────────────────────────────────────────── */}
        <motion.div {...SECTION_VARIANTS(0.8)}>
          {/* Rating */}
          <Label>My Rating</Label>
          <button
            onClick={() => setIsEditingRating(!isEditingRating)}
            className="flex items-baseline gap-1.5 mb-4"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 700, color: 'var(--cream)', lineHeight: 1 }}>
              {rating.toFixed(1)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
              /10
            </span>
          </button>

          <AnimatePresence>
            {isEditingRating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor }}
                  />
                  <button
                    onClick={handleSaveRating}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: accentColor, border: `1px solid ${accentColor}55`, borderRadius: 2, padding: '5px 12px', background: 'transparent', cursor: 'pointer' }}
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes */}
          <Label>Tasting Notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="What are you tasting? What does it remind you of?"
            rows={4}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(245,240,232,0.1)',
              color: 'var(--cream)',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              fontWeight: 300,
              lineHeight: 1.7,
              resize: 'none',
              outline: 'none',
              padding: '0 0 12px 0',
            }}
            className="placeholder:text-cream/20"
          />
        </motion.div>

        <Divider />

        {/* ── BREW LOG STRIP ──────────────────────────────────────────── */}
        <motion.div {...SECTION_VARIANTS(0.9)}>
          <div className="flex items-center justify-between mb-4">
            <Label>Brew Log</Label>
            {brewLogs.length > 0 && (
              <Link
                href={`/coffee/${coffee.id}/brews`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.13em', textTransform: 'uppercase', color: accentColor }}
              >
                View All →
              </Link>
            )}
          </div>

          {brewLogs.length > 0 ? (
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {brewLogs.map((log) => (
                <BrewLogCard key={log.id} log={log} accentColor={accentColor} />
              ))}
            </div>
          ) : (
            /* Empty state — matches brew log card shape */
            <div style={{ border: '1px dashed rgba(245,240,232,0.12)', borderRadius: 2, padding: '24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'rgba(245,240,232,0.25)', marginBottom: 6 }}>
                No brews yet
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.18)' }}>
                Log your first brew →
              </p>
            </div>
          )}
        </motion.div>

      </div>{/* end content */}

      {/* ── SAVE AXES BUTTON (slides up when unsaved changes) ─────────── */}
      <AnimatePresence>
        {hasUnsavedAxes && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-6"
            style={{ background: 'linear-gradient(to top, var(--roast-deep) 55%, transparent)' }}
            initial={{ y: 88 }}
            animate={{ y: 0 }}
            exit={{ y: 88 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <button
              onClick={handleSaveAxes}
              disabled={isSavingAxes}
              style={{
                width: '100%',
                padding: '14px',
                background: accentColor,
                color: 'var(--roast-deep)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontWeight: 500,
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                opacity: isSavingAxes ? 0.65 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {isSavingAxes ? 'Saving…' : 'Save My Interpretation'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
