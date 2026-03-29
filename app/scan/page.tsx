import { createAdminClient } from '@/lib/supabase/admin'
import { ScanFlow } from '@/components/scan-flow/ScanFlow'

export default async function ScanPage() {
  // Get the first user for now — will be replaced with real auth session
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('id').limit(1).single()
  const userId = data?.id ?? ''

  return <ScanFlow userId={userId} />
}
