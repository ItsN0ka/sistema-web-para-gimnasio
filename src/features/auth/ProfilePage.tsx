import { useState, type FormEvent } from 'react'
import { roleLabels, type UserRole } from '../../data/roles'
import { updatePassword, updateProfile, type AppProfile } from './accountService'

export function ProfilePage({ profile, role, onUpdated }: { profile: AppProfile | null; role: UserRole; onUpdated: () => void }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true); setMessage(''); setError('')
    try {
      await updateProfile({ fullName: String(form.get('full_name')), phone: String(form.get('phone')) })
      setMessage('Perfil actualizado.')
      onUpdated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos actualizar el perfil.')
    } finally { setBusy(false) }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const password = String(form.get('password'))
    const confirmation = String(form.get('confirmation'))
    setMessage(''); setError('')
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return }
    setBusy(true)
    try {
      await updatePassword(password)
      formElement.reset()
      setMessage('Contraseña actualizada.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos actualizar la contraseña.')
    } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <section className="page-heading"><div><p className="eyebrow">CUENTA</p><h1>Mi perfil</h1><p>Actualiza tu información personal y la contraseña de acceso.</p></div></section>
      {!profile ? <section className="panel profile-panel"><p>Configura Supabase e inicia sesión para editar tu perfil.</p></section> : <div className="profile-grid">
        <section className="panel profile-panel">
          <div className="panel-header"><div><h2>Información personal</h2><p>{roleLabels[role]}</p></div></div>
          <form onSubmit={saveProfile} className="profile-form">
            <label>Nombre completo<input name="full_name" required defaultValue={profile.full_name} autoComplete="name" /></label>
            <label>Correo electrónico<input value={profile.email} disabled readOnly /></label>
            <label>Teléfono<input name="phone" defaultValue={profile.phone ?? ''} autoComplete="tel" /></label>
            <button className="primary-button" type="submit" disabled={busy}>Guardar perfil</button>
          </form>
        </section>
        <section className="panel profile-panel">
          <div className="panel-header"><div><h2>Contraseña</h2><p>Usa al menos 8 caracteres.</p></div></div>
          <form onSubmit={savePassword} className="profile-form">
            <label>Nueva contraseña<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label>Confirmar contraseña<input name="confirmation" type="password" minLength={8} required autoComplete="new-password" /></label>
            <button className="secondary-button" type="submit" disabled={busy}>Actualizar contraseña</button>
          </form>
        </section>
      </div>}
      {message && <p className="form-message success-message" role="status">{message}</p>}
      {error && <p className="form-message error-message" role="alert">{error}</p>}
    </div>
  )
}
