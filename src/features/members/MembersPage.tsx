import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import type { UserRole } from '../../data/roles'
import type { Member } from '../../types/gym'
import { isSupabaseConfigured } from '../../lib/supabase'
import { createMember, listActivePlans, listMembers, updateMember } from './memberService'

export function MembersPage({ initialQuery = '', role }: { initialQuery?: string; role: UserRole }) {
  const [members, setMembers] = useState<Member[]>([])
  const [plans, setPlans] = useState<Array<{ name: string }>>([])
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState('Todos')
  const [editing, setEditing] = useState<Member | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const canManage = role === 'owner' || role === 'reception'

  useEffect(() => {
    let active = true
    Promise.all([listMembers(), listActivePlans()])
      .then(([items, activePlans]) => { if (active) { setMembers(items); setPlans(activePlans) } })
      .catch(() => { if (active) setMessage('No pudimos cargar los socios. Revisa tu conexión o permisos.') })
    return () => { active = false }
  }, [])
  useEffect(() => setQuery(initialQuery), [initialQuery])

  const filteredMembers = useMemo(() => members.filter((member) => {
    const matchesQuery = `${member.name} ${member.id} ${member.email}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (filter === 'Todos' || member.status === filter)
  }), [members, query, filter])

  function openNew() { setEditing(null); setModalOpen(true); setMessage('') }
  function openEdit(member: Member) { setEditing(member); setModalOpen(true); setMessage('') }

  async function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManage) return
    const form = new FormData(event.currentTarget)
    const input = { name: String(form.get('name')), email: String(form.get('email')), plan: String(form.get('plan')) }
    setBusy(true)
    try {
      if (editing && isSupabaseConfigured) {
        const updated = await updateMember(editing.id, { ...input, status: String(form.get('status')) as Member['status'] })
        setMembers((current) => current.map((member) => member.id === editing.id ? updated : member))
      } else if (editing) {
        setMembers((current) => current.map((member) => member.id === editing.id ? { ...member, name: input.name, email: input.email, plan: input.plan, status: String(form.get('status')) as Member['status'] } : member))
      } else {
        const created = await createMember(input)
        setMembers((current) => [created, ...current])
      }
      setModalOpen(false)
      setMessage(editing ? 'Socio actualizado.' : 'Socio registrado correctamente.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos guardar el socio.')
    } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <section className="page-heading">
        <div><p className="eyebrow">BASE DE SOCIOS</p><h1>Socios</h1><p>Busca y administra perfiles y membresías.</p></div>
        {canManage && <button className="primary-button" onClick={openNew}><Icon name="plus" size={18} /> Nuevo socio</button>}
      </section>
      <section className="member-summary">
        <div><span className="summary-icon"><Icon name="users" /></span><p><strong>{members.length}</strong><small>Socios totales</small></p></div>
        <div><span className="summary-icon success"><Icon name="check" /></span><p><strong>{members.filter((member) => member.status === 'Vigente').length}</strong><small>Membresías vigentes</small></p></div>
        <div><span className="summary-icon warning"><Icon name="clock" /></span><p><strong>{members.filter((member) => member.status === 'Por vencer').length}</strong><small>Próximas a vencer</small></p></div>
      </section>
      {message && <p className="form-message" role="status">{message}</p>}
      <section className="panel members-panel">
        <div className="member-toolbar">
          <div className="local-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, ID o correo" /></div>
          <div className="filter-group">{['Todos', 'Vigente', 'Por vencer', 'Vencida'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Socio</th><th>Plan actual</th><th>Vencimiento</th><th>Última visita</th><th>Estado</th>{canManage && <th>Acciones</th>}</tr></thead>
            <tbody>{filteredMembers.map((member) => (
              <tr key={member.id}>
                <td><span className="member-cell"><Avatar initials={member.initials} color={member.color} /><span><strong>{member.name}</strong><small>{member.id} · {member.email}</small></span></span></td>
                <td>{member.plan}</td><td>{member.expires}</td><td>{member.lastVisit}</td>
                <td><Badge tone={member.status === 'Vigente' ? 'success' : member.status === 'Vencida' ? 'danger' : 'warning'}>{member.status}</Badge></td>
                {canManage && <td><button className="row-action" aria-label={`Editar ${member.name}`} onClick={() => openEdit(member)}><Icon name="chevron" size={17} /></button></td>}
              </tr>
            ))}</tbody>
          </table>
          {filteredMembers.length === 0 && <div className="empty-state"><Icon name="search" /><strong>No encontramos socios</strong><p>Prueba con otro nombre o filtro.</p></div>}
        </div>
      </section>
      {modalOpen && <div className="modal-overlay" role="presentation" onMouseDown={() => setModalOpen(false)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="member-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="modal-header"><div><p className="eyebrow">{editing ? 'ACTUALIZAR DATOS' : 'REGISTRO RÁPIDO'}</p><h2 id="member-title">{editing ? 'Editar socio' : 'Nuevo socio'}</h2></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Cerrar"><Icon name="close" /></button></div>
          <form className="data-form" onSubmit={saveMember}>
            <label>Nombre completo<input name="name" required defaultValue={editing?.name} placeholder="Ej. Laura González" /></label>
            <label>Correo electrónico<input name="email" type="email" required defaultValue={editing?.email} placeholder="laura@correo.cl" /></label>
            <label>Plan de membresía<select name="plan" defaultValue={editing?.plan ?? plans[0]?.name} required>{plans.map((plan) => <option key={plan.name} value={plan.name}>{plan.name}</option>)}</select></label>
            {editing && <label>Estado<select name="status" defaultValue={editing.status}><option>Vigente</option><option>Por vencer</option><option>Vencida</option></select></label>}
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={busy || plans.length === 0}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar socio'}</button></div>
          </form>
        </div>
      </div>}
    </div>
  )
}
