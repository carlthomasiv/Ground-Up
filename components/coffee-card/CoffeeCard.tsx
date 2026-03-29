'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { momentThemes, statusConfig } from '@/lib/design-tokens'
import type { Moment, CoffeeStatus } from '@/lib/design-tokens'
import type { Coffee } from '@/lib/supabase/types'

// ─── Ghost / Empty State Card ─────────────────────────────────────────────────

export function GhostCoffeeCard() {
  return (
    <div
      style={{
        aspectRatio: '3/4',
        border: '1px dashed rgba(245,240,232,0.15)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        textAlign: 'center',
        background: 'rgba(245,240,232,0.02)',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        fontStyle: 'italic',
        color: 'rgba(245,240,232,0.2)',
        lineHeight: 1.5,
        marginBottom: 12,
      }}>
        Your first coffee is waiting to be archived
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 8,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'rgba(245,240,232,0.15)',
      }}>
        Scan a bag →
      </span>
    </div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

export function CoffeeCardSkeleton() {
  return (
    <div
      style={{
        aspectRatio: '3/4',
        borderRadius: 2,
        background: 'rgba(245,240,232,0.04)',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: '65%', background: 'rgba(245,240,232,0.06)' }} />
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 8, width: '60%', background: 'rgba(245,240,232,0.06)', borderRadius: 1 }} />
        <div style={{ height: 12, width: '85%', background: 'rgba(245,240,232,0.08)', borderRadius: 1 }} />
      </div>
    </div>
  )
}

// ─── Coffee Card ──────────────────────────────────────────────────────────────

interface CoffeeCardProps {
  coffee: Coffee
  index?: number
}

export function CoffeeCard({ coffee, index = 0 }: CoffeeCardProps) {
  const accentColor = coffee.moment_tag
    ? momentThemes[coffee.moment_tag as Moment].accent
    : 'var(--accent)'

  const status = statusConfig[coffee.status as CoffeeStatus]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/coffee/${coffee.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div
          style={{
            aspectRatio: '3/4',
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            background: 'var(--roast)',
            cursor: 'pointer',
          }}
        >
          {/* Bag photo */}
          {coffee.bag_photo_url ? (
            <Image
              src={coffee.bag_photo_url}
              alt={coffee.coffee_name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(160deg, rgba(61,43,31,0.8) 0%, rgba(42,29,20,1) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontStyle: 'italic',
                color: 'rgba(245,240,232,0.2)',
                textAlign: 'center',
                lineHeight: 1.4,
              }}>
                {coffee.coffee_name}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(42,29,20,0) 40%, rgba(42,29,20,0.95) 100%)',
          }} />

          {/* Top row — status dot + moment tag */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Status indicator */}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              color: status.color,
              lineHeight: 1,
            }}>
              {status.symbol}
            </span>

            {/* Moment tag */}
            {coffee.moment_tag && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 7,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: accentColor,
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                borderRadius: 2,
                padding: '3px 6px',
              }}>
                {coffee.moment_tag}
              </span>
            )}
          </div>

          {/* Bottom — roaster + name + rating */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0 12px 12px',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(245,240,232,0.45)',
              marginBottom: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {coffee.roaster_name}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--cream)',
                lineHeight: 1.2,
                flex: 1,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {coffee.coffee_name}
              </p>
              {coffee.user_rating !== null && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: accentColor,
                  flexShrink: 0,
                  lineHeight: 1,
                  paddingBottom: 1,
                }}>
                  {coffee.user_rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
