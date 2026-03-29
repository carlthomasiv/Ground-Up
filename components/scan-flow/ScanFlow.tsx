'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { SpiderChart } from '@/components/spider-chart/SpiderChart'
import { defaultFlavorAxes } from '@/lib/design-tokens'
import type { FlavorAxes } from '@/lib/design-tokens'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'loading' | 'review' | 'saving'

interface EnrichedData {
  roaster_name:        string
  coffee_name:         string
  origin_country:      string | null
  region:              string | null
  farm:                string | null
  varietal:            string | null
  process:             string | null
  roast_date:          string | null
  roast_level:         string | null
  roaster_taste_notes: string[]
  roaster_acidity:     number
  roaster_fruit:       number
  roaster_body:        number
  roaster_roast:       number
  roaster_sweetness:   number
  roaster_floral:      number
  roaster_finish:      number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const LOADING_PHRASES = [
  'Reading the bag…',
  'Identifying origin…',
  'Parsing roast notes…',
  'Mapping flavor profile…',
  'Calibrating your palate…',
  'Almost there…',
]

// ─── Loading Step ─────────────────────────────────────────────────────────────

function LoadingStep({ imageUrl }: { imageUrl: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  // Cycle phrases
  useState(() => {
    const interval = setInterval(() => {
      setPhraseIndex(i => Math.min(i + 1, LOADING_PHRASES.length - 1))
    }, 1800)
    return () => clearInterval(interval)
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8" style={{ background: 'var(--roast-deep)' }}>
      {/* Bag photo — blurred, faded */}
      <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 48 }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 2,
          overflow: 'hidden',
          opacity: 0.35,
          filter: 'blur(2px)',
        }}>
          <Image src={imageUrl} alt="Bag" fill className="object-cover" />
        </div>

        {/* Scanning line animation */}
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(to right, transparent, var(--accent), transparent)`,
            boxShadow: '0 0 8px var(--accent)',
          }}
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Corner brackets */}
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos}`}
            style={{
              width: 14,
              height: 14,
              borderColor: 'var(--accent)',
              borderStyle: 'solid',
              borderWidth: 0,
              ...(i === 0 && { borderTopWidth: 1.5, borderLeftWidth: 1.5 }),
              ...(i === 1 && { borderTopWidth: 1.5, borderRightWidth: 1.5 }),
              ...(i === 2 && { borderBottomWidth: 1.5, borderLeftWidth: 1.5 }),
              ...(i === 3 && { borderBottomWidth: 1.5, borderRightWidth: 1.5 }),
            }}
          />
        ))}
      </div>

      {/* Cycling phrase */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phraseIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: EASE }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          {LOADING_PHRASES[phraseIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Dot pulse */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--accent)' }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Upload Step ──────────────────────────────────────────────────────────────

interface UploadStepProps {
  onImage: (file: File, url: string) => void
}

function UploadStep({ onImage }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    onImage(file, url)
  }, [onImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--roast-deep)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(245,240,232,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => window.history.back()}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Back
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>
          Scan a Bag
        </span>
      </div>

      {/* Drop zone */}
      <div className="flex flex-col items-center justify-center flex-1 px-6">
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          animate={{ borderColor: isDragging ? 'var(--accent)' : 'rgba(245,240,232,0.15)' }}
          style={{
            width: '100%',
            maxWidth: 320,
            aspectRatio: '3/4',
            border: '1px dashed rgba(245,240,232,0.15)',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: isDragging ? 'rgba(196,98,45,0.04)' : 'rgba(245,240,232,0.02)',
            transition: 'background 0.2s',
            gap: 16,
            padding: 32,
          }}
        >
          {/* Coffee bag icon — simple SVG */}
          <svg width={48} height={48} viewBox="0 0 48 48" fill="none">
            <rect x={12} y={8} width={24} height={32} rx={2} stroke="rgba(245,240,232,0.2)" strokeWidth={1.5} />
            <rect x={17} y={4} width={14} height={6} rx={1} stroke="rgba(245,240,232,0.15)" strokeWidth={1.5} />
            <line x1={12} y1={20} x2={36} y2={20} stroke="rgba(245,240,232,0.1)" strokeWidth={1} />
            <circle cx={24} cy={30} r={4} stroke="rgba(196,98,45,0.4)" strokeWidth={1.2} />
            <circle cx={24} cy={30} r={1.5} fill="rgba(196,98,45,0.4)" />
          </svg>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontStyle: 'italic', color: 'rgba(245,240,232,0.35)', marginBottom: 8 }}>
              Point at a bag
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)', lineHeight: 1.6 }}>
              Take a photo or upload an image
            </p>
          </div>
        </motion.div>

        {/* Camera + upload buttons */}
        <div className="flex gap-3 mt-6 w-full" style={{ maxWidth: 320 }}>
          <button
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.accept = 'image/*'
                inputRef.current.capture = 'environment'
                inputRef.current.click()
              }
            }}
            style={{
              flex: 1,
              padding: '13px',
              background: 'var(--accent)',
              color: 'var(--roast-deep)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 500,
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            Camera
          </button>
          <button
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute('capture')
                inputRef.current.click()
              }
            }}
            style={{
              flex: 1,
              padding: '13px',
              background: 'transparent',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              border: '1px solid rgba(245,240,232,0.15)',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            Upload
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
    </div>
  )
}

// ─── Review Step ──────────────────────────────────────────────────────────────

interface ReviewStepProps {
  data:     EnrichedData
  imageUrl: string
  onSave:   (data: EnrichedData, axes: FlavorAxes) => void
  onRetry:  () => void
}

function ReviewField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label:       string
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
}) {
  return (
    <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(245,240,232,0.06)', marginBottom: 16 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
        {label}
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '—'}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: 'var(--cream)',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          fontWeight: 300,
          outline: 'none',
          padding: 0,
        }}
        className="placeholder:text-cream/20"
      />
    </div>
  )
}

function ReviewStep({ data, imageUrl, onSave, onRetry }: ReviewStepProps) {
  const [form, setForm] = useState<EnrichedData>(data)
  const [axes, setAxes] = useState<FlavorAxes>({
    acidity:   data.roaster_acidity   ?? 5,
    fruit:     data.roaster_fruit     ?? 5,
    body:      data.roaster_body      ?? 5,
    roast:     data.roaster_roast     ?? 5,
    sweetness: data.roaster_sweetness ?? 5,
    floral:    data.roaster_floral    ?? 5,
    finish:    data.roaster_finish    ?? 5,
  })

  const set = (key: keyof EnrichedData) => (v: string) =>
    setForm(f => ({ ...f, [key]: v || null }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--roast-deep)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(245,240,232,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(42,29,20,0.95)', backdropFilter: 'blur(8px)', zIndex: 40 }}>
        <button
          onClick={onRetry}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Retry
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)' }}>
          Confirm Details
        </span>
        <div style={{ width: 48 }} />
      </div>

      <div className="px-5 pb-32">
        {/* Bag photo thumbnail */}
        <motion.div
          className="relative overflow-hidden rounded-sm mt-5 mb-6"
          style={{ height: 180 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <Image src={imageUrl} alt="Bag" fill className="object-cover" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(42,29,20,0.9) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 3 }}>
              Extracted from bag
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.01em' }}>
              {form.coffee_name || 'Unknown Coffee'}
            </p>
          </div>
        </motion.div>

        {/* Editable fields */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
        >
          <ReviewField label="Roaster"      value={form.roaster_name ?? ''}    onChange={set('roaster_name')} />
          <ReviewField label="Coffee Name"  value={form.coffee_name ?? ''}     onChange={set('coffee_name')} />
          <ReviewField label="Origin"       value={form.origin_country ?? ''}  onChange={set('origin_country')} />
          <ReviewField label="Process"      value={form.process ?? ''}         onChange={set('process')} placeholder="washed / natural / honey…" />
          <ReviewField label="Varietal"     value={form.varietal ?? ''}        onChange={set('varietal')} />
          <ReviewField label="Roast Level"  value={form.roast_level ?? ''}     onChange={set('roast_level')} placeholder="light / medium / dark…" />
          <ReviewField label="Roast Date"   value={form.roast_date ?? ''}      onChange={set('roast_date')} placeholder="YYYY-MM-DD" />

          {/* Tasting notes */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(245,240,232,0.06)', marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
              Tasting Notes
            </p>
            <div className="flex flex-wrap gap-2">
              {(form.roaster_taste_notes ?? []).map((note) => (
                <span key={note} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', border: '1px solid rgba(245,240,232,0.13)', borderRadius: 2, padding: '4px 10px' }}>
                  {note}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Spider chart preview */}
        <motion.div
          className="flex flex-col items-center mt-4 mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16, alignSelf: 'flex-start' }}>
            Flavor Profile Seed
          </p>
          <SpiderChart
            roasterAxes={axes}
            userAxes={defaultFlavorAxes}
            onUserChange={setAxes}
            accentColor="var(--accent-light)"
            mode="roaster"
            size={240}
            editable
          />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)', marginTop: 12, textAlign: 'center' }}>
            Tap axes to adjust
          </p>
        </motion.div>
      </div>

      {/* Save button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 32px', background: 'linear-gradient(to top, var(--roast-deep) 60%, transparent)' }}>
        <button
          onClick={() => onSave(form, axes)}
          style={{
            width: '100%',
            padding: '14px',
            background: 'var(--accent)',
            color: 'var(--roast-deep)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 500,
            border: 'none',
            borderRadius: 2,
            cursor: 'pointer',
          }}
        >
          Save to Archive
        </button>
      </div>
    </div>
  )
}

// ─── Main ScanFlow ────────────────────────────────────────────────────────────

export function ScanFlow({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep]           = useState<Step>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl]   = useState<string>('')
  const [enriched, setEnriched]   = useState<EnrichedData | null>(null)
  const [error, setError]         = useState<string | null>(null)

  const handleImage = useCallback(async (file: File, url: string) => {
    setImageFile(file)
    setImageUrl(url)
    setStep('loading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/enrich-bag', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok || json.error) throw new Error(json.error ?? 'Enrichment failed')

      setEnriched(json.data)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('upload')
    }
  }, [])

  const handleSave = useCallback(async (data: EnrichedData, axes: FlavorAxes) => {
    setStep('saving')
    const supabase = createAdminClient()

    const { data: coffee, error: insertError } = await supabase
      .from('coffees')
      .insert({
        user_id:             userId,
        roaster_name:        data.roaster_name,
        coffee_name:         data.coffee_name,
        origin_country:      data.origin_country,
        region:              data.region,
        farm:                data.farm,
        varietal:            data.varietal,
        process:             data.process,
        roast_date:          data.roast_date,
        roast_level:         data.roast_level,
        roaster_taste_notes: data.roaster_taste_notes,
        roaster_acidity:     axes.acidity,
        roaster_fruit:       axes.fruit,
        roaster_body:        axes.body,
        roaster_roast:       axes.roast,
        roaster_sweetness:   axes.sweetness,
        roaster_floral:      axes.floral,
        roaster_finish:      axes.finish,
        status:              'drinking',
      })
      .select('id')
      .single()

    if (insertError || !coffee) {
      setError('Failed to save coffee')
      setStep('review')
      return
    }

    router.push(`/coffee/${coffee.id}`)
  }, [userId, router])

  return (
    <AnimatePresence mode="wait">
      {step === 'upload' && (
        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {error && (
            <div style={{ position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100, background: 'rgba(196,98,45,0.15)', border: '1px solid rgba(196,98,45,0.4)', borderRadius: 2, padding: '10px 14px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--accent)' }}>{error}</p>
            </div>
          )}
          <UploadStep onImage={handleImage} />
        </motion.div>
      )}

      {step === 'loading' && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoadingStep imageUrl={imageUrl} />
        </motion.div>
      )}

      {(step === 'review' || step === 'saving') && enriched && (
        <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ opacity: step === 'saving' ? 0.6 : 1, pointerEvents: step === 'saving' ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
          <ReviewStep
            data={enriched}
            imageUrl={imageUrl}
            onSave={handleSave}
            onRetry={() => { setStep('upload'); setEnriched(null) }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
