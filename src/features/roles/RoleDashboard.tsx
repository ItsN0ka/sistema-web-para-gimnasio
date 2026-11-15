import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import { roleHome, type UserRole } from '../../data/roles'
import { MetricCard } from '../dashboard/MetricCard'
import { loadDashboard, type DashboardSnapshot } from './dashboardService'

export function RoleDashboard({ role, userId, memberId, profileName, onNavigate }: {
  role: UserRole
  userId: string | null
  memberId: string | null
  profileName: string
  onNavigate: (module: string) => void
}) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    loadDashboard(role, userId, memberId)
      .then((data) => { if (active) { setSnapshot(data); setError('') } })
      .catch(() => { if (active) setError('No pudimos cargar el resumen. Revisa tu conexión o permisos.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [role, userId, memberId])

  const date = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago' }).format(new Date())
  const home = roleHome[role]

  return (
    <div className="page">
      <section className="page-heading">
        <div><p className="eyebrow">{date.toLocaleUpperCase('es-CL')}</p><h1>Hola, {profileName.split(' ')[0]}</h1><p>{snapshot?.description ?? 'Cargando el resumen de tu gimnasio…'}</p></div>
        <button className="primary-button" onClick={() => onNavigate(home.module)}><Icon name="plus" size={18} /> {home.action}</button>
      </section>

      {error && <p className="form-message error-message" role="alert">{error}</p>}
      <section className="metrics-grid">
        {(snapshot?.metrics ?? []).map((metric) => <MetricCard key={metric.label} {...metric} action={() => onNavigate(metric.module)} />)}
        {loading && <div className="panel loading-panel">Actualizando indicadores…</div>}
      </section>

      <section className="role-dashboard-grid">
        <article className="role-focus-card">
          <div className="role-focus-top"><span className="role-focus-icon"><Icon name={role === 'maintenance' ? 'tool' : role === 'trainer' || role === 'member' ? 'calendar' : 'chart'} /></span><p>ACCESO RÁPIDO</p></div>
          <h2>{snapshot?.focus.title ?? 'Cargando actividad'}</h2>
          <p>{snapshot?.focus.detail ?? ''}</p>
          <button onClick={() => onNavigate(snapshot?.focus.module ?? home.module)}>Abrir módulo <Icon name="arrow" size={16} /></button>
        </article>

        <article className="panel role-schedule">
          <div className="panel-header"><div><h2>{role === 'member' ? 'Mis reservas' : role === 'maintenance' ? 'Incidencias abiertas' : 'Actividad de hoy'}</h2><p>Información actual desde el sistema</p></div></div>
          {snapshot?.items.length ? snapshot.items.slice(0, 6).map((item, index) => (
            <button className="schedule-row schedule-action" key={`${item.title}-${index}`} onClick={() => onNavigate(item.module)}>
              <span className="schedule-time"><Icon name={item.module === 'maintenance' ? 'tool' : item.module === 'classes' ? 'calendar' : 'clock'} size={16} /></span>
              <span><strong>{item.title}</strong><small>{item.detail}</small></span>
              <Badge tone={item.tone}>{item.status}</Badge>
            </button>
          )) : <div className="empty-state"><strong>{loading ? 'Cargando…' : 'Sin actividad registrada'}</strong><p>Las novedades aparecerán cuando se registren en sus módulos.</p></div>}
        </article>
      </section>
    </div>
  )
}
