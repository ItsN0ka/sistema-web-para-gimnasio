import { useState } from 'react'
import { Icon } from '../ui/Icon'
import type { IconName } from '../../types/gym'
import { roleLabels, roleNavigation, type UserRole } from '../../data/roles'

const navigation: Array<{ id: string; label: string; icon: IconName }> = [
  { id: 'dashboard', label: 'Resumen', icon: 'grid' },
  { id: 'members', label: 'Socios', icon: 'users' },
  { id: 'memberships', label: 'Membresías', icon: 'card' },
  { id: 'payments', label: 'Pagos', icon: 'wallet' },
  { id: 'classes', label: 'Clases y reservas', icon: 'calendar' },
  { id: 'trainers', label: 'Entrenadores', icon: 'trainer' },
  { id: 'maintenance', label: 'Mantenimiento', icon: 'tool' },
  { id: 'finances', label: 'Finanzas', icon: 'chart' },
  { id: 'reports', label: 'Reportes', icon: 'report' },
  { id: 'staff', label: 'Personal', icon: 'users' },
]

interface Props {
  activeModule: string
  onNavigate: (module: string) => void
  role: UserRole
  profileName: string
  onProfile: () => void
  query: string
  onQueryChange: (query: string) => void
  onSearch: () => void
  onLogout: () => void
  children: React.ReactNode
}

export function AppShell({ activeModule, onNavigate, role, profileName, onProfile, query, onQueryChange, onSearch, onLogout, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = profileName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
  const visibleNavigation = navigation.filter((item) => roleNavigation[role].includes(item.id))

  const navigate = (id: string) => {
    onNavigate(id)
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span /></div>
          <div><strong>FORMA</strong><small>GYM MANAGEMENT</small></div>
        </div>
        <nav className="nav-list" aria-label="Navegación principal">
          <p className="nav-label">GESTIÓN</p>
          {visibleNavigation.map((item) => (
            <button key={item.id} className={`nav-item ${activeModule === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="profile profile-button" onClick={onProfile} aria-label="Editar mi perfil">
            <span className="profile-avatar">{initials}</span>
            <span><strong>{profileName}</strong><small>{roleLabels[role]}</small></span>
            <Icon name="chevron" size={16} />
          </button>
          <button className="logout-button" onClick={onLogout}><Icon name="logout" size={18} /> Cerrar sesión</button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menú" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
          <form className="global-search" onSubmit={(event) => { event.preventDefault(); onSearch() }}>
            <Icon name="search" size={19} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar socio, pago o reserva..." aria-label="Buscar" />
            <kbd>⌘ K</kbd>
          </form>
          <div className="top-actions">
            <span className="today"><small>{new Intl.DateTimeFormat('es-CL', { weekday: 'long', timeZone: 'America/Santiago' }).format(new Date())}</small><strong>{new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'America/Santiago' }).format(new Date())}</strong></span>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}
