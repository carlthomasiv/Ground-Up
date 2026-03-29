import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 72,
        fontWeight: 700,
        color: 'var(--cream)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        Ground <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Up</em>
      </h1>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
      }}>
        {user ? `Signed in as ${user.email}` : 'Stack confirmed · Auth ready'}
      </p>
    </main>
  )
}
