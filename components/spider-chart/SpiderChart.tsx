'use client';

/**
 * SpiderChart — Ground Up
 *
 * Two-layer SVG radar chart.
 * Layer 1 (roaster): dashed white outline, no fill
 * Layer 2 (mine): solid colored fill + stroke, color from accent/moment theme
 *
 * Toggle modes: 'both' | 'mine' | 'roaster'
 * Edit mode: tap an axis point to adjust value inline
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLAVOR_AXES, FlavorAxes, FlavorAxis, flavorAxisLabels, defaultFlavorAxes } from '@/lib/design-tokens';

// ============================================
// TYPES
// ============================================

export type SpiderMode = 'both' | 'mine' | 'roaster';

interface SpiderChartProps {
  roasterAxes:  Partial<FlavorAxes>;
  userAxes:     Partial<FlavorAxes>;
  onUserChange?: (axes: FlavorAxes) => void;
  accentColor?:  string;        // defaults to --accent
  mode?:         SpiderMode;
  size?:         number;        // SVG size in px, default 280
  editable?:     boolean;       // show edit controls
  className?:    string;
}

// ============================================
// GEOMETRY HELPERS
// ============================================

const NUM_AXES = FLAVOR_AXES.length; // 7
const ANGLE_STEP = (2 * Math.PI) / NUM_AXES;
// Start at top (-90deg / -π/2) so Acidity is at 12 o'clock
const START_ANGLE = -Math.PI / 2;

function axisAngle(index: number): number {
  return START_ANGLE + index * ANGLE_STEP;
}

function valueToPoint(value: number, index: number, center: number, maxRadius: number): { x: number; y: number } {
  const angle = axisAngle(index);
  const r = (value / 10) * maxRadius;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
}

function axisEndPoint(index: number, center: number, maxRadius: number): { x: number; y: number } {
  const angle = axisAngle(index);
  return {
    x: center + maxRadius * Math.cos(angle),
    y: center + maxRadius * Math.sin(angle),
  };
}

function labelPoint(index: number, center: number, maxRadius: number, offset = 18): { x: number; y: number } {
  const angle = axisAngle(index);
  return {
    x: center + (maxRadius + offset) * Math.cos(angle),
    y: center + (maxRadius + offset) * Math.sin(angle),
  };
}

function axesToPolygon(axes: Partial<FlavorAxes>, center: number, maxRadius: number): string {
  return FLAVOR_AXES.map((axis, i) => {
    const value = axes[axis] ?? 5;
    const pt = valueToPoint(value, i, center, maxRadius);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

function gridPolygon(fraction: number, center: number, maxRadius: number): string {
  return FLAVOR_AXES.map((_, i) => {
    const angle = axisAngle(i);
    const r = fraction * maxRadius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');
}

// ============================================
// COMPONENT
// ============================================

export function SpiderChart({
  roasterAxes,
  userAxes,
  onUserChange,
  accentColor = 'var(--accent-light)',
  mode = 'both',
  size = 280,
  editable = false,
  className = '',
}: SpiderChartProps) {
  const [activeAxis, setActiveAxis] = useState<FlavorAxis | null>(null);
  const [localUserAxes, setLocalUserAxes] = useState<FlavorAxes>({
    ...defaultFlavorAxes,
    ...userAxes,
  });

  const center = size / 2;
  const maxRadius = size / 2 - 32; // leave room for labels

  const mergedUser = useMemo(() => ({ ...defaultFlavorAxes, ...localUserAxes }), [localUserAxes]);
  const mergedRoaster = useMemo(() => ({ ...defaultFlavorAxes, ...roasterAxes }), [roasterAxes]);

  const handleAxisEdit = useCallback((axis: FlavorAxis, value: number) => {
    const updated = { ...localUserAxes, [axis]: value };
    setLocalUserAxes(updated);
    onUserChange?.(updated);
  }, [localUserAxes, onUserChange]);

  const showRoaster = mode === 'both' || mode === 'roaster';
  const showUser    = mode === 'both' || mode === 'mine';

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        {/* ── GRID ── */}
        <g opacity={0.08}>
          {[0.33, 0.66, 1.0].map((fraction) => (
            <polygon
              key={fraction}
              points={gridPolygon(fraction, center, maxRadius)}
              fill="none"
              stroke="var(--cream)"
              strokeWidth={0.5}
            />
          ))}
          {/* Spokes */}
          {FLAVOR_AXES.map((_, i) => {
            const end = axisEndPoint(i, center, maxRadius);
            return (
              <line
                key={i}
                x1={center} y1={center}
                x2={end.x}  y2={end.y}
                stroke="var(--cream)"
                strokeWidth={0.5}
              />
            );
          })}
        </g>

        {/* ── AXIS LABELS ── */}
        {FLAVOR_AXES.map((axis, i) => {
          const pt = labelPoint(i, center, maxRadius);
          const isActive = activeAxis === axis;
          return (
            <text
              key={axis}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: 'var(--font-mono, DM Mono, monospace)',
                fontSize: '7px',
                letterSpacing: '0.08em',
                fill: isActive ? accentColor : 'rgba(245,240,232,0.35)',
                transition: 'fill 0.2s',
                cursor: editable ? 'pointer' : 'default',
                userSelect: 'none',
              }}
              onClick={() => editable && setActiveAxis(isActive ? null : axis)}
            >
              {flavorAxisLabels[axis]}
            </text>
          );
        })}

        {/* ── ROASTER SHAPE — dashed outline, no fill ── */}
        <AnimatePresence>
          {showRoaster && (
            <motion.polygon
              key="roaster"
              points={axesToPolygon(mergedRoaster, center, maxRadius)}
              fill="none"
              stroke="rgba(245,240,232,0.28)"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>

        {/* ── MY SHAPE — solid fill + stroke ── */}
        <AnimatePresence>
          {showUser && (
            <motion.polygon
              key="user"
              points={axesToPolygon(mergedUser, center, maxRadius)}
              fill={accentColor}
              fillOpacity={0.13}
              stroke={accentColor}
              strokeWidth={1.6}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              style={{ transformOrigin: `${center}px ${center}px` }}
            />
          )}
        </AnimatePresence>

        {/* ── EDITABLE AXIS POINTS ── */}
        {editable && FLAVOR_AXES.map((axis, i) => {
          const value = mergedUser[axis];
          const pt = valueToPoint(value, i, center, maxRadius);
          const isActive = activeAxis === axis;
          return (
            <circle
              key={axis}
              cx={pt.x}
              cy={pt.y}
              r={isActive ? 5 : 3}
              fill={isActive ? accentColor : 'rgba(245,240,232,0.4)'}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setActiveAxis(isActive ? null : axis)}
            />
          );
        })}

        {/* Center dot */}
        <circle cx={center} cy={center} r={2} fill="rgba(245,240,232,0.15)" />
      </svg>

      {/* ── EDIT SLIDER (appears below active axis label) ── */}
      <AnimatePresence>
        {editable && activeAxis && (
          <motion.div
            key="slider"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: -56,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              background: 'rgba(42,29,20,0.95)',
              border: '1px solid rgba(245,240,232,0.1)',
              borderRadius: 2,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accentColor,
              whiteSpace: 'nowrap',
            }}>
              {flavorAxisLabels[activeAxis]}
            </span>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={localUserAxes[activeAxis] ?? 5}
              onChange={(e) => handleAxisEdit(activeAxis, parseFloat(e.target.value))}
              style={{ flex: 1, accentColor }}
            />
            <span style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 11,
              color: 'rgba(245,240,232,0.7)',
              minWidth: 24,
            }}>
              {(localUserAxes[activeAxis] ?? 5).toFixed(1)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MODE TOGGLE COMPONENT
// ============================================

interface SpiderModeToggleProps {
  mode: SpiderMode;
  onChange: (mode: SpiderMode) => void;
  accentColor?: string;
}

export function SpiderModeToggle({ mode, onChange, accentColor = 'var(--accent)' }: SpiderModeToggleProps) {
  const modes: { key: SpiderMode; label: string }[] = [
    { key: 'both',    label: 'Both'   },
    { key: 'mine',    label: 'Mine'   },
    { key: 'roaster', label: 'Theirs' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 2,
      background: 'rgba(245,240,232,0.05)',
      padding: 3,
    }}>
      {modes.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '6px 14px',
            border: 'none',
            background: mode === key ? accentColor : 'transparent',
            color: mode === key ? '#1A1612' : 'rgba(245,240,232,0.45)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            borderRadius: 1,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
