import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoffeeDetail } from '@/components/coffee-detail/CoffeeDetail'
import type { Coffee, BrewLog } from '@/lib/supabase/types'

export default async function CoffeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: coffee, error } = await supabase
    .from('coffees')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !coffee) {
    notFound()
  }

  const { data: brewLogs } = await supabase
    .from('brew_logs')
    .select('*')
    .eq('coffee_id', id)
    .order('brew_date', { ascending: false })
    .limit(3)

  return (
    <CoffeeDetail
      coffee={coffee as Coffee}
      brewLogs={(brewLogs ?? []) as BrewLog[]}
    />
  )
}
