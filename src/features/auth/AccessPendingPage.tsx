import { useState } from 'react'

export function AccessPendingPage({ email, onLogout, onRetry }: { email: string; onLogout: () => void; onRetry: () => Promise<void> }) {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  async function retry() {
    setChecking(true); setError('')
    try { await onRetry() } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo revisar tu acceso.') }
    finally { setChecking(false) }
  }
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand"><div className="brand-mark"><span /></div><div><strong>FORMA</strong><small>GYM MANAGEMENT</small></div></div>
        <p className="eyebrow">CUENTA CREADA</p>
        <h1>Falta asignar tu rol</h1>
        <p className="auth-description">La cuenta <strong>{email}</strong> inició sesión, pero aún no tiene un perfil de socio ni un rol de personal asociado. Pídele al administrador que te agregue en el módulo Personal.</p>
        {error && <p className="form-message error-message" role="alert">{error}</p>}
        <button className="primary-button auth-submit" disabled={checking} onClick={() => void retry()}>{checking ? 'Revisando…' : 'Revisar mi acceso'}</button>
        <button className="secondary-button auth-submit" onClick={onLogout}>Cerrar sesión</button>
      </section>
    </main>
  )
}
