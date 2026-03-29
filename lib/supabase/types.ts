// ============================================
// GROUND UP — Supabase Database Types
// Mirrors supabase/schema.sql exactly
// ============================================

export interface Coffee {
  id:                 string
  user_id:            string

  // Identity
  roaster_name:       string
  roaster_url:        string | null
  coffee_name:        string
  bag_photo_url:      string | null

  // Origin
  origin_country:     string | null
  region:             string | null
  farm:               string | null
  varietal:           string | null
  process:            'washed' | 'natural' | 'honey' | 'anaerobic' | 'wet_hulled' | 'other' | null

  // Roast
  roast_date:         string | null
  roast_level:        'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark' | null

  // Status
  status:             'drinking' | 'running_low' | 'finished' | 'want_to_try'
  moment_tag:         'morning' | 'afternoon' | 'evening' | 'weekend' | null

  // Roaster flavor axes
  roaster_acidity:    number | null
  roaster_fruit:      number | null
  roaster_body:       number | null
  roaster_roast:      number | null
  roaster_sweetness:  number | null
  roaster_floral:     number | null
  roaster_finish:     number | null

  // User flavor axes
  user_acidity:       number | null
  user_fruit:         number | null
  user_body:          number | null
  user_roast:         number | null
  user_sweetness:     number | null
  user_floral:        number | null
  user_finish:        number | null

  // Tasting
  roaster_taste_notes: string[] | null
  user_taste_notes:    string[] | null
  user_rating:         number | null
  user_notes:          string | null
  is_favorite:         boolean

  created_at:          string
  updated_at:          string
}

export interface BrewLog {
  id:                  string
  coffee_id:           string
  user_id:             string

  brew_method:         'espresso' | 'pour_over' | 'aeropress' | 'french_press' | 'moka_pot' | 'cold_brew' | 'drip' | 'other'
  brew_date:           string

  // Simple
  dose_grams:          number | null
  yield_grams:         number | null
  ratio:               number | null

  // Advanced — espresso
  brew_time_sec:       number | null
  brew_temp_f:         number | null
  grind_setting:       string | null
  machine_model:       string | null
  line_pressure_bars:  number | null
  max_pressure_bars:   number | null

  // Advanced — filter
  water_grams:         number | null
  filter_type:         string | null
  bloom_time_sec:      number | null

  notes:               string | null
  rating:              number | null
  created_at:          string
}

export interface Profile {
  id:           string
  username:     string | null
  display_name: string | null
  avatar_url:   string | null
  created_at:   string
  updated_at:   string
}
