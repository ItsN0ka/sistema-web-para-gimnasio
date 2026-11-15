import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

type AuthMode = 'login' | 'signup' | 'recovery'

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage('')
    setErrorMessage('')

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password') ?? '')

    try {
      if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setMessage('Te enviamos un enlace para restablecer la contraseña.')
        return
      }

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return
      }

      const fullName = String(form.get('full_name')).trim()
      const phone = String(form.get('phone')).trim()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      })
      if (error) throw error
      if (!data.session) setMessage('Revisa tu correo para confirmar la cuenta. Si ya perteneces al gimnasio, tu perfil de socio quedará vinculado a tu membresía.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos completar la solicitud.')
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'login' ? 'Bienvenido de vuelta' : mode === 'signup' ? 'Crea tu cuenta' : 'Restablece tu contraseña'

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark"><span /></div>
          <div><strong>FORMA</strong><small>GYM MANAGEMENT</small></div>
        </div>
        <p className="eyebrow">GESTIÓN DE GIMNASIO</p>
        <h1>{title}</h1>
        <p className="auth-description">{mode === 'recovery' ? 'Te enviaremos un enlace seguro a tu correo.' : 'Accede a tus funciones según el rol que te asignó el gimnasio.'}</p>
        <form onSubmit={submit}>
          {mode === 'signup' && <>
            <label>Nombre completo<input name="full_name" required autoComplete="name" placeholder="Tu nombre" /></label>
            <label>Teléfono<input name="phone" autoComplete="tel" placeholder="+56 9 1234 5678" /></label>
          </>}
          <label>Correo electrónico<input name="email" type="email" required autoComplete="email" placeholder="tu@correo.cl" /></label>
          {mode !== 'recovery' && <label>Contraseña<input name="password" type="password" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Mínimo 8 caracteres" /></label>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            {busy ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
          </button>
        </form>
        {message && <p className="auth-message success-message" role="status">{message}</p>}
        {errorMessage && <p className="auth-message" role="alert">{errorMessage}</p>}
        <div className="auth-links">
          {mode === 'login' && <button type="button" onClick={() => { setMode('recovery'); setMessage(''); setErrorMessage('') }}>Olvidé mi contraseña</button>}
          {mode !== 'signup' && <button type="button" onClick={() => { setMode('signup'); setMessage(''); setErrorMessage('') }}>Crear cuenta</button>}
          {mode !== 'login' && <button type="button" onClick={() => { setMode('login'); setMessage(''); setErrorMessage('') }}>Volver a iniciar sesión</button>}
        </div>
      </section>
    </main>
  )
}
