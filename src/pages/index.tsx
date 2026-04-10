import { useState } from 'react'
import { useRouter } from 'next/router'
import { validateUser, registerUser } from '../lib/store'
import Head from 'next/head'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Completá todos los campos')
      return
    }
    if (mode === 'login') {
      if (validateUser(username, password)) {
        sessionStorage.setItem('pt_user', username.toLowerCase())
        router.push('/dashboard')
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } else {
      const ok = registerUser(username, password)
      if (ok) {
        sessionStorage.setItem('pt_user', username.toLowerCase())
        router.push('/dashboard')
      } else {
        setError('El usuario ya existe')
      }
    }
  }

  return (
    <>
      <Head>
        <title>Portfolio Tracker — DS</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.4
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(0,229,160,0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="fadeIn" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--accent)', color: '#080C10',
              fontSize: '24px', fontWeight: 800, marginBottom: '16px'
            }}>
              DS
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Portfolio Tracker
            </h1>
            <p className="neutral" style={{ marginTop: '6px', fontSize: '14px' }}>
              Tu historial de inversiones, siempre a mano
            </p>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            {/* Mode switcher */}
            <div style={{
              display: 'flex', background: 'var(--surface2)', borderRadius: '8px',
              padding: '4px', marginBottom: '28px'
            }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError('') }}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', fontSize: '13px',
                    fontWeight: 600, letterSpacing: '0.04em',
                    background: mode === m ? 'var(--surface)' : 'transparent',
                    color: mode === m ? 'var(--text)' : 'var(--muted)',
                    border: mode === m ? '1px solid var(--border)' : '1px solid transparent',
                    transition: 'all 0.2s'
                  }}>
                  {m === 'login' ? 'Ingresar' : 'Registrarse'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Usuario
                </label>
                <input
                  value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="ej: dante"
                  autoCapitalize="none"
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Contraseña
                </label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255,69,96,0.1)', border: '1px solid rgba(255,69,96,0.3)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: 'var(--red)', fontSize: '13px'
                }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
            </form>
          </div>

          <p className="neutral" style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
            Demo: usuario <span className="mono" style={{ color: 'var(--accent)' }}>dante</span> / pass <span className="mono" style={{ color: 'var(--accent)' }}>drop2024</span>
          </p>
        </div>
      </div>
    </>
  )
}
