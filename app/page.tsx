import { createAdminClient } from '@/lib/supabase/admin'
import { ShelfScreen } from '@/components/shelf/ShelfScreen'
import type { Coffee } from '@/lib/supabase/types'

export default async function HomePage() {
  const supabase = createAdminClient()

  const { data: coffees } = await supabase
    .from('coffees')
    .select('*')
    .order('created_at', { ascending: false })

  return <ShelfScreen coffees={(coffees ?? []) as Coffee[]} />
}
