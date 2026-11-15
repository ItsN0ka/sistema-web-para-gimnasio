import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../../components/ui/Badge'
import { roleLabels } from '../../data/roles'
import { supabase } from '../../lib/supabase'

type Staff = { user_id: string; full_name: string; role: string; email?: string }
type PendingAccount = { id: string; full_name: string; email: string; phone: string | null; matchingMember: { id: string; full_name: string; member_number: string } | null }
const roles: Array<{ value: string; label: string }> = [
  { value: 'owner', label: roleLabels.owner }, { value: 'receptionist', label: roleLabels.reception },
  { value: 'trainer', label: roleLabels.trainer }, { value: 'maintenance', label: roleLabels.maintenance },
]

export function StaffPage() {
  const [rows, setRows] = useState<Staff[]>([])
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([])
  const [plans, setPlans] = useState<Array<{ name: string }>>([])
  const [newMemberAccount, setNewMemberAccount] = useState<PendingAccount | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('receptionist')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const refresh = useCallback(async () => {
    if (!supabase) return
    const [staffResult, profileResult, membersResult, plansResult] = await Promise.all([
      supabase.from('gym_staff').select('user_id,full_name,role').order('full_name'),
      supabase.from('profiles').select('id,full_name,email,phone').order('created_at', { ascending: false }),
      supabase.from('members').select('id,user_id,full_name,email,member_number'),
      supabase.from('membership_plans').select('name').eq('is_active', true).order('name'),
    ])
    if (staffResult.error) throw staffResult.error
    if (profileResult.error) throw profileResult.error
    if (membersResult.error) throw membersResult.error
    if (plansResult.error) throw plansResult.error
    const staff = (staffResult.data ?? []) as Staff[]
    const profiles = await Promise.all(staff.map(async (person) => {
      const result = await supabase!.from('profiles').select('email').eq('id', person.user_id).maybeSingle()
      if (result.error) throw result.error
      return { ...person, email: result.data?.email ?? '' }
    }))
    setRows(profiles)
    const staffIds = new Set(staff.map((person) => person.user_id))
    const linkedIds = new Set((membersResult.data ?? []).map((member) => member.user_id).filter(Boolean))
    const pending = (profileResult.data ?? []).filter((profile) => !staffIds.has(profile.id) && !linkedIds.has(profile.id)).map((profile) => {
      const matchingMember = (membersResult.data ?? []).find((member) => !member.user_id && member.email.toLowerCase() === profile.email.toLowerCase())
      return { id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone, matchingMember: matchingMember ? { id: matchingMember.id, full_name: matchingMember.full_name, member_number: matchingMember.member_number } : null }
    })
    setPendingAccounts(pending)
    setPlans(plansResult.data ?? [])
  }, [])
  useEffect(() => { void refresh().catch((caught) => setError(caught.message ?? 'No pudimos cargar el equipo.')) }, [refresh])

  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setError(''); setNotice('')
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { data: profile, error: profileError } = await supabase.from('profiles').select('id,full_name').eq('email', normalizedEmail).maybeSingle()
      if (profileError) throw profileError
      if (!profile) throw new Error('Ese correo aún no tiene una cuenta. Pídele a la persona que se registre primero.')
      const { error: insertError } = await supabase.from('gym_staff').upsert({ user_id: profile.id, full_name: profile.full_name, role }, { onConflict: 'user_id' })
      if (insertError) throw insertError
      if (role === 'trainer') {
        const { error: trainerError } = await supabase.from('trainer_profiles').upsert({ user_id: profile.id, display_name: profile.full_name }, { onConflict: 'user_id' })
        if (trainerError) throw trainerError
      }
      setNotice('Rol asignado correctamente.'); setEmail(''); await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo asignar el rol.') }
    finally { setBusy(false) }
  }

  async function linkExistingMember(account: PendingAccount) {
    if (!supabase || !account.matchingMember) return
    setBusy(true); setError(''); setNotice('')
    try {
      const { error: linkError } = await supabase.from('members').update({ user_id: account.id, full_name: account.full_name, phone: account.phone }).eq('id', account.matchingMember.id).is('user_id', null)
      if (linkError) throw linkError
      setNotice(`${account.full_name} quedó vinculado al socio ${account.matchingMember.member_number}.`)
      await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo vincular la cuenta al socio.') }
    finally { setBusy(false) }
  }

  async function createMemberForAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !newMemberAccount) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setError(''); setNotice('')
    try {
      const fullName = String(form.get('full_name')).trim()
      const planName = String(form.get('plan_name'))
      const { data: plan, error: planError } = await supabase.from('membership_plans').select('duration_days').eq('name', planName).single()
      if (planError) throw planError
      const startsAt = new Date()
      const expiresAt = new Date(startsAt.getTime() + Number(plan.duration_days) * 24 * 60 * 60 * 1000)
      const { error: insertError } = await supabase.from('members').insert({
        user_id: newMemberAccount.id,
        member_number: `S-${Date.now().toString().slice(-8)}`,
        full_name: fullName,
        email: newMemberAccount.email,
        phone: newMemberAccount.phone,
        plan_name: planName,
        membership_status: 'Vigente',
        starts_at: startsAt.toISOString().slice(0, 10),
        expires_at: expiresAt.toISOString().slice(0, 10),
      })
      if (insertError) throw insertError
      setNotice(`La cuenta de ${fullName} ya tiene acceso como socio.`)
      setNewMemberAccount(null)
      await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo registrar la cuenta como socio.') }
    finally { setBusy(false) }
  }

  async function changeRole(person: Staff, nextRole: string) {
    if (!supabase) return
    setBusy(true); setError(''); setNotice('')
    try {
      const { error: updateError } = await supabase.from('gym_staff').update({ role: nextRole }).eq('user_id', person.user_id)
      if (updateError) throw updateError
      if (nextRole === 'trainer') {
        const { error: trainerError } = await supabase.from('trainer_profiles').upsert({ user_id: person.user_id, display_name: person.full_name }, { onConflict: 'user_id' })
        if (trainerError) throw trainerError
      }
      setNotice('Rol actualizado.'); await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo actualizar el rol.') }
    finally { setBusy(false) }
  }

  async function remove(person: Staff) {
    if (!supabase || !window.confirm(`¿Quitar el acceso de personal a ${person.full_name}?`)) return
    setBusy(true); setError('')
    try {
      const { error: deleteError } = await supabase.from('gym_staff').delete().eq('user_id', person.user_id)
      if (deleteError) throw deleteError
      setNotice('Acceso de personal quitado.'); await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo quitar el acceso.') }
    finally { setBusy(false) }
  }

  return <div className="page"><section className="page-heading"><div><p className="eyebrow">ADMINISTRACIÓN</p><h1>Equipo y roles</h1><p>Asigna accesos a personas que ya crearon su cuenta.</p></div></section>
    {notice && <p className="form-message success-message" role="status">{notice}</p>}{error && <p className="form-message error-message" role="alert">{error}</p>}
    <section className="panel profile-panel"><div className="panel-header"><div><h2>Asignar rol</h2><p>El correo debe coincidir con una cuenta registrada.</p></div></div>
      <form onSubmit={addStaff} className="staff-form"><label>Correo<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="persona@correo.cl"/></label><label>Rol<select value={role} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><button className="primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Asignar acceso'}</button></form>
    </section>
    <section className="panel operation-panel"><div className="panel-header"><div><h2>Cuentas sin acceso</h2><p>Vincula un socio existente o crea su ficha para habilitar la cuenta.</p></div></div><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Vinculación</th><th>Acción</th></tr></thead><tbody>{pendingAccounts.map((account) => <tr key={account.id}><td>{account.full_name || 'Sin nombre'}</td><td>{account.email}</td><td>{account.matchingMember ? `Socio existente · ${account.matchingMember.member_number}` : 'Aún no tiene ficha de socio'}</td><td>{account.matchingMember ? <button className="secondary-button" disabled={busy} onClick={() => void linkExistingMember(account)}>Vincular socio</button> : <button className="secondary-button" disabled={busy || plans.length === 0} onClick={() => setNewMemberAccount(account)}>Crear ficha de socio</button>}</td></tr>)}</tbody></table>{pendingAccounts.length === 0 && <p className="empty-state">No hay cuentas pendientes de vinculación.</p>}</div></section>
    <section className="panel operation-panel"><div className="panel-header"><div><h2>Personal activo</h2><p>{rows.length} cuenta(s) con rol de personal</p></div></div><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>{rows.map((person) => <tr key={person.user_id}><td>{person.full_name}</td><td>{person.email}</td><td><Badge tone="info">{roles.find((item) => item.value === person.role)?.label ?? person.role}</Badge></td><td><div className="staff-actions"><select aria-label={`Cambiar rol de ${person.full_name}`} value={person.role} disabled={busy} onChange={(event) => void changeRole(person, event.target.value)}>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button className="secondary-button" disabled={busy} onClick={() => void remove(person)}>Quitar</button></div></td></tr>)}</tbody></table>{rows.length === 0 && <p className="empty-state">Todavía no hay personal asignado.</p>}</div></section>
    {newMemberAccount && <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewMemberAccount(null) }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="new-member-title"><header className="modal-header"><div><p className="eyebrow">VINCULACIÓN DE CUENTA</p><h2 id="new-member-title">Crear ficha de socio</h2></div><button className="row-action" aria-label="Cerrar" onClick={() => setNewMemberAccount(null)}>×</button></header><form onSubmit={createMemberForAccount}><label>Nombre<input name="full_name" defaultValue={newMemberAccount.full_name} required/></label><label>Plan<select name="plan_name" required defaultValue={plans[0]?.name}>{plans.map((plan) => <option key={plan.name} value={plan.name}>{plan.name}</option>)}</select></label><p>Correo: {newMemberAccount.email}</p><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setNewMemberAccount(null)}>Cancelar</button><button className="primary-button" disabled={busy || plans.length === 0}>{busy ? 'Guardando…' : 'Crear socio y habilitar'}</button></div></form></section></div>}
  </div>
}
