import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AppShell } from './components/layout/AppShell'
import { MembersPage } from './features/members/MembersPage'
import { OperationsPage } from './features/operations/OperationsPage'
import { RoleDashboard } from './features/roles/RoleDashboard'
import { LoginPage } from './features/auth/LoginPage'
import { ProfilePage } from './features/auth/ProfilePage'
import { AccessPendingPage } from './features/auth/AccessPendingPage'
import { StaffPage } from './features/staff/StaffPage'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { loadAccount, type AppAccount } from './features/auth/accountService'
import { roleNavigation, type UserRole } from './data/roles'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [account, setAccount] = useState<AppAccount | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [activeModule, setActiveModule] = useState('dashboard')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAccountError(error.message)
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAccount(null)
      setAccountError('')
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let active = true
    if (!session?.user) {
      setAccount(null)
      setAccountLoading(false)
      return () => { active = false }
    }

    setAccountLoading(true)
    loadAccount(session.user)
      .then((result) => { if (active) setAccount(result) })
      .catch((error: unknown) => {
        if (active) setAccountError(error instanceof Error ? error.message : 'No pudimos cargar tu perfil.')
      })
      .finally(() => { if (active) setAccountLoading(false) })

    return () => { active = false }
  }, [session])

  const role: UserRole = account?.role ?? 'owner'
  const profileName = account?.profile.full_name || session?.user.email || 'Carolina Araya'
  const allowedModules = roleNavigation[role]

  useEffect(() => {
    if (activeModule !== 'profile' && activeModule !== 'dashboard' && !allowedModules.includes(activeModule)) {
      setActiveModule('dashboard')
    }
  }, [activeModule, allowedModules])

  const content = useMemo(() => {
    if (activeModule === 'dashboard') {
      return <RoleDashboard role={role} userId={session?.user.id ?? null} memberId={account?.memberId ?? null} profileName={profileName} onNavigate={setActiveModule} />
    }
    if (activeModule === 'members') return <MembersPage initialQuery={query} role={role} />
    if (activeModule === 'profile') return <ProfilePage profile={account?.profile ?? null} role={role} onUpdated={() => {
      if (session?.user) loadAccount(session.user).then(setAccount).catch(() => undefined)
    }} />
    if (activeModule === 'staff') return <StaffPage />
    return <OperationsPage moduleId={activeModule} role={role} userId={session?.user.id ?? null} memberId={account?.memberId ?? null} />
  }, [activeModule, account, profileName, query, role, session])

  if (authLoading || accountLoading) {
    return <main className="auth-loading" aria-live="polite">Cargando tu cuenta…</main>
  }

  if (accountError && isSupabaseConfigured) {
    return <main className="auth-loading" role="alert">{accountError}</main>
  }

  if (isSupabaseConfigured && !session) return <LoginPage />

  if (isSupabaseConfigured && session && !account) {
    return <AccessPendingPage email={session.user.email ?? ''} onRetry={async () => {
      const updatedAccount = await loadAccount(session.user)
      setAccount(updatedAccount)
    }} onLogout={async () => { await supabase?.auth.signOut() }} />
  }

  return (
    <AppShell
      activeModule={activeModule}
      onNavigate={setActiveModule}
      role={role}
      profileName={profileName}
      onProfile={() => setActiveModule('profile')}
      query={query}
      onQueryChange={setQuery}
      onSearch={() => setActiveModule('members')}
      onLogout={async () => { await supabase?.auth.signOut() }}
    >
      {content}
    </AppShell>
  )
}
