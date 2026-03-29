// ============================================
// GROUND UP — Design Tokens
// Single source of truth for all design values
// ============================================

export const colors = {
  cream:       '#F5F0E8',
  ink:         '#1A1612',
  warmMid:     '#7A6A58',
  roast:       '#3D2B1F',
  roastDeep:   '#2A1D14',
  accent:      '#C4622D',
  accentLight: '#E8A87C',
  muted:       '#B5A898',
  sand:        '#EDE8DF',
} as const;

export const fonts = {
  display: "'Playfair Display', serif",
  mono:    "'DM Mono', monospace",
  sans:    "'DM Sans', sans-serif",
} as const;

// ============================================
// MOMENT THEMES
// Each moment has its own ambient color palette
// Used by share cards + moment badge
// ============================================
export type Moment = 'morning' | 'afternoon' | 'evening' | 'weekend';

export interface MomentTheme {
  label:      string;
  icon:       string;
  accent:     string;           // Main accent color for this moment
  spiderFill: string;           // My-layer fill (low opacity rgba)
  spiderStroke: string;         // My-layer stroke
  tagBorder:  string;
  tagColor:   string;
  tagBg:      string;
  glowColor:  string;           // Ambient glow rgba
  captions:   string[];
  // CSS gradient string for card background
  cardBg:     string;
}

export const momentThemes: Record<Moment, MomentTheme> = {
  morning: {
    label:        'MY MORNING CUP',
    icon:         '☀️',
    accent:       '#F5C842',
    spiderFill:   'rgba(245,200,66,0.13)',
    spiderStroke: '#F5C842',
    tagBorder:    'rgba(245,200,66,0.38)',
    tagColor:     '#F5C842',
    tagBg:        'rgba(245,200,66,0.06)',
    glowColor:    'rgba(220,160,30,0.2)',
    captions:     [
      'Before the world wakes up.',
      'First light. Best cup.',
      'The cup that starts everything.',
    ],
    cardBg: `
      radial-gradient(ellipse 80% 60% at 15% -10%, rgba(255,195,60,0.38) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 85% 20%, rgba(240,130,50,0.18) 0%, transparent 50%),
      radial-gradient(ellipse 100% 40% at 50% 110%, rgba(160,80,20,0.12) 0%, transparent 55%),
      linear-gradient(160deg, #3A1E08 0%, #241408 45%, #180E06 100%)
    `,
  },

  afternoon: {
    label:        'MY AFTERNOON PULL',
    icon:         '🌤',
    accent:       '#A8C4A0',
    spiderFill:   'rgba(168,196,160,0.12)',
    spiderStroke: '#A8C4A0',
    tagBorder:    'rgba(168,196,160,0.38)',
    tagColor:     '#A8C4A0',
    tagBg:        'rgba(168,196,160,0.06)',
    glowColor:    'rgba(140,180,120,0.12)',
    captions:     [
      'Midday clarity.',
      'The reset.',
      'Open window. Open mind.',
    ],
    cardBg: `
      radial-gradient(ellipse 60% 40% at 80% 5%, rgba(200,215,240,0.1) 0%, transparent 55%),
      radial-gradient(ellipse 50% 50% at 15% 50%, rgba(170,190,140,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 80% 40% at 50% 105%, rgba(100,70,40,0.15) 0%, transparent 55%),
      linear-gradient(175deg, #252018 0%, #1C1610 45%, #161210 100%)
    `,
  },

  evening: {
    label:        'MY EVENING DECAF',
    icon:         '🌙',
    accent:       '#C4A0E8',
    spiderFill:   'rgba(196,160,232,0.12)',
    spiderStroke: '#C4A0E8',
    tagBorder:    'rgba(196,160,232,0.38)',
    tagColor:     '#C4A0E8',
    tagBg:        'rgba(196,160,232,0.07)',
    glowColor:    'rgba(120,70,180,0.22)',
    captions:     [
      'Wind down, don\'t check out.',
      'The quiet cup.',
      'Slow everything down.',
    ],
    cardBg: `
      radial-gradient(ellipse 70% 50% at 85% 95%, rgba(196,90,45,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 60% 60% at 10% 80%, rgba(100,50,140,0.18) 0%, transparent 55%),
      radial-gradient(ellipse 80% 40% at 40% 0%, rgba(30,20,50,0.5) 0%, transparent 60%),
      linear-gradient(200deg, #08060E 0%, #100808 50%, #160C06 100%)
    `,
  },

  weekend: {
    label:        'WEEKEND RITUAL',
    icon:         '✦',
    accent:       '#E8A87C',
    spiderFill:   'rgba(232,168,124,0.13)',
    spiderStroke: '#E8A87C',
    tagBorder:    'rgba(232,168,124,0.42)',
    tagColor:     '#E8A87C',
    tagBg:        'rgba(232,168,124,0.07)',
    glowColor:    'rgba(196,98,45,0.28)',
    captions:     [
      'Nowhere to be. Perfect.',
      'No alarm. Just this.',
      'The long, slow cup.',
    ],
    cardBg: `
      radial-gradient(ellipse 70% 55% at 25% 15%, rgba(210,130,40,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 80% 75%, rgba(196,98,45,0.2) 0%, transparent 55%),
      radial-gradient(ellipse 80% 40% at 50% 110%, rgba(130,70,20,0.15) 0%, transparent 60%),
      linear-gradient(145deg, #2A1808 0%, #1E1006 50%, #160C04 100%)
    `,
  },
};

// ============================================
// FLAVOR AXES
// The 7 axes of the spider chart
// ============================================
export const FLAVOR_AXES = [
  'acidity',
  'fruit',
  'body',
  'roast',
  'sweetness',
  'floral',
  'finish',
] as const;

export type FlavorAxis = typeof FLAVOR_AXES[number];

export const flavorAxisLabels: Record<FlavorAxis, string> = {
  acidity:   'ACIDITY',
  fruit:     'FRUIT',
  body:      'BODY',
  roast:     'ROAST',
  sweetness: 'SWEET',
  floral:    'FLORAL',
  finish:    'FINISH',
};

export type FlavorAxes = Record<FlavorAxis, number>;

export const defaultFlavorAxes: FlavorAxes = {
  acidity:   5,
  fruit:     5,
  body:      5,
  roast:     5,
  sweetness: 5,
  floral:    5,
  finish:    5,
};

// ============================================
// COFFEE STATUS
// ============================================
export type CoffeeStatus = 'drinking' | 'running_low' | 'finished' | 'want_to_try';

export const statusConfig: Record<CoffeeStatus, { label: string; color: string; symbol: string }> = {
  drinking:    { label: 'Currently Drinking', color: '#C4622D', symbol: '●' },
  running_low: { label: 'Running Low',        color: '#E8C87C', symbol: '◐' },
  finished:    { label: 'Finished',           color: '#7A6A58', symbol: '○' },
  want_to_try: { label: 'Want to Try',        color: '#B5A898', symbol: '◌' },
};

// ============================================
// BREW METHODS
// ============================================
export type BrewMethod = 'espresso' | 'pour_over' | 'aeropress' | 'french_press' | 'moka_pot' | 'cold_brew' | 'drip' | 'other';

export const brewMethodLabels: Record<BrewMethod, string> = {
  espresso:     'Espresso',
  pour_over:    'Pour Over',
  aeropress:    'AeroPress',
  french_press: 'French Press',
  moka_pot:     'Moka Pot',
  cold_brew:    'Cold Brew',
  drip:         'Drip',
  other:        'Other',
};
