import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import {
  Position, ClosedTrade, MonthlySnapshot,
  getPositions, savePositions, getClosedTrades, saveClosedTrades,
  getSnapshots, saveSnapshots, generateId
} from '../lib/store'

type Tab = 'positions' | 'history' | 'monthly'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [tab, setTab] = useState<Tab>('positions')
  const [positions, setPositions] = useState<Position[]>([])
  const [closed, setClosed] = useState<ClosedTrade[]>([])
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([])
  const [showAddPos, setShowAddPos] = useState(false)
  const [showClose, setShowClose] = useState<Position | null>(null)
  const [showAddSnap, setShowAddSnap] = useState(false)
  const [showAddClosed, setShowAddClosed] = useState(false)

  useEffect(() => {
    const u = sessionStorage.getItem('pt_user')
    if (!u) { router.push('/'); return }
    setUser(u)
    setPositions(getPositions(u))
    setClosed(getClosedTrades(u))
    setSnapshots(getSnapshots(u))
  }, [])

  function logout() {
    sessionStorage.removeItem('pt_user')
    router.push('/')
  }

  // ─── Computed totals ───────────────────────────────────────────────
  const totalValue = positions.reduce((s, p) => s + p.shares * p.currentPrice, 0)
  const totalCost = positions.reduce((s, p) => s + p.shares * p.entryPrice, 0)
  const totalPnL = totalValue - totalCost
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0
  const totalRealizedPnL = closed.reduce((s, t) => s + t.pnl, 0)

  // ─── Add position ──────────────────────────────────────────────────
  function handleAddPosition(data: Omit<Position, 'id'>) {
    const updated = [...positions, { ...data, id: generateId() }]
    setPositions(updated)
    savePositions(user, updated)
    setShowAddPos(false)
  }

  function handleDeletePosition(id: string) {
    const updated = positions.filter(p => p.id !== id)
    setPositions(updated)
    savePositions(user, updated)
  }

  function handleUpdatePrice(id: string, price: number) {
    const updated = positions.map(p => p.id === id ? { ...p, currentPrice: price } : p)
    setPositions(updated)
    savePositions(user, updated)
  }

  // ─── Close position ────────────────────────────────────────────────
  function handleClosePosition(pos: Position, exitPrice: number, note: string) {
    const pnl = (exitPrice - pos.entryPrice) * pos.shares
    const pnlPct = ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100
    const trade: ClosedTrade = {
      id: generateId(), ticker: pos.ticker, name: pos.name,
      shares: pos.shares, entryPrice: pos.entryPrice, exitPrice,
      pnl, pnlPct, currency: pos.currency,
      openDate: pos.date, closeDate: new Date().toISOString().split('T')[0],
      note
    }
    const newClosed = [trade, ...closed]
    setClosed(newClosed)
    saveClosedTrades(user, newClosed)
    const updated = positions.filter(p => p.id !== pos.id)
    setPositions(updated)
    savePositions(user, updated)
    setShowClose(null)
  }

  // ─── Add manual closed trade ───────────────────────────────────────
  function handleAddClosed(data: Omit<ClosedTrade, 'id'>) {
    const updated = [{ ...data, id: generateId() }, ...closed]
    setClosed(updated)
    saveClosedTrades(user, updated)
    setShowAddClosed(false)
  }

  function handleDeleteClosed(id: string) {
    const updated = closed.filter(t => t.id !== id)
    setClosed(updated)
    saveClosedTrades(user, updated)
  }

  // ─── Snapshots ─────────────────────────────────────────────────────
  function handleAddSnapshot(data: Omit<MonthlySnapshot, 'id'>) {
    const updated = [...snapshots, { ...data, id: generateId() }]
      .sort((a, b) => a.month.localeCompare(b.month))
    setSnapshots(updated)
    saveSnapshots(user, updated)
    setShowAddSnap(false)
  }

  function handleDeleteSnapshot(id: string) {
    const updated = snapshots.filter(s => s.id !== id)
    setSnapshots(updated)
    saveSnapshots(user, updated)
  }

  const fmt = (n: number, digits = 2) =>
    n.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  return (
    <>
      <Head>
        <title>Portfolio — {user}</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Header */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--accent)', color: '#080C10',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '14px'
            }}>
              {user.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Portfolio Tracker</div>
              <div className="neutral mono" style={{ fontSize: '11px' }}>{user}</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={logout} style={{ fontSize: '12px' }}>Salir</button>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            <SummaryCard label="Valor Portfolio" value={`US$ ${fmt(totalValue)}`} />
            <SummaryCard
              label="P&L No Realizado"
              value={`${totalPnL >= 0 ? '+' : ''}US$ ${fmt(totalPnL)}`}
              sub={`${totalPnLPct >= 0 ? '+' : ''}${fmt(totalPnLPct)}%`}
              positive={totalPnL >= 0}
            />
            <SummaryCard
              label="P&L Realizado"
              value={`${totalRealizedPnL >= 0 ? '+' : ''}US$ ${fmt(totalRealizedPnL)}`}
              positive={totalRealizedPnL >= 0}
            />
            <SummaryCard label="Posiciones Abiertas" value={String(positions.length)} />
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '4px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '24px'
          }}>
            {(['positions', 'history', 'monthly'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 18px', fontSize: '13px', fontWeight: 600,
                background: 'transparent', color: tab === t ? 'var(--accent)' : 'var(--muted)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                borderRadius: 0, letterSpacing: '0.04em',
                transition: 'all 0.2s'
              }}>
                {t === 'positions' ? '📊 Posiciones' : t === 'history' ? '📋 Historial' : '📅 Mensual'}
              </button>
            ))}
          </div>

          {/* ── POSITIONS TAB ── */}
          {tab === 'positions' && (
            <div className="fadeIn">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
                <button className="btn-primary" onClick={() => setShowAddPos(true)}>+ Agregar posición</button>
              </div>
              {positions.length === 0 ? (
                <EmptyState icon="📈" text="No tenés posiciones abiertas" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {positions.map(p => {
                    const value = p.shares * p.currentPrice
                    const cost = p.shares * p.entryPrice
                    const pnl = value - cost
                    const pct = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100
                    return (
                      <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '10px',
                          background: 'var(--surface2)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 800, fontSize: '12px',
                          color: 'var(--accent)', flexShrink: 0, border: '1px solid var(--border)'
                        }}>
                          {p.ticker.slice(0, 4)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{p.ticker}</div>
                          <div className="neutral" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div className="mono" style={{ fontWeight: 700 }}>{p.currency} {fmt(value)}</div>
                          <div style={{ fontSize: '12px' }} className={pnl >= 0 ? 'positive' : 'negative'}>
                            {pnl >= 0 ? '+' : ''}{fmt(pnl)} ({pct >= 0 ? '+' : ''}{fmt(pct)}%)
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, fontSize: '11px' }} className="neutral">
                          <div>{p.shares} acc.</div>
                          <div>Entrada: {p.currency} {fmt(p.entryPrice)}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                          <button className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => {
                              const np = prompt(`Nuevo precio actual para ${p.ticker}:`, String(p.currentPrice))
                              if (np && !isNaN(Number(np))) handleUpdatePrice(p.id, Number(np))
                            }}>
                            Actualizar
                          </button>
                          <button className="btn-primary" style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => setShowClose(p)}>
                            Cerrar
                          </button>
                          <button className="btn-danger" onClick={() => {
                            if (confirm(`¿Eliminar ${p.ticker}?`)) handleDeletePosition(p.id)
                          }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <div className="fadeIn">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span className="neutral" style={{ fontSize: '13px' }}>Total operaciones cerradas: </span>
                  <span className="mono" style={{ fontWeight: 700 }}>{closed.length}</span>
                </div>
                <button className="btn-ghost" onClick={() => setShowAddClosed(true)}>+ Cargar trade</button>
              </div>
              {closed.length === 0 ? (
                <EmptyState icon="📋" text="No hay trades cerrados todavía" />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Ticker', 'Acc.', 'Entrada', 'Salida', 'P&L', '%', 'Fecha', 'Nota', ''].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {closed.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700 }}>{t.ticker}</div>
                            <div className="neutral" style={{ fontSize: '11px' }}>{t.name}</div>
                          </td>
                          <td className="mono" style={{ padding: '12px' }}>{t.shares}</td>
                          <td className="mono" style={{ padding: '12px' }}>{fmt(t.entryPrice)}</td>
                          <td className="mono" style={{ padding: '12px' }}>{fmt(t.exitPrice)}</td>
                          <td className={`mono ${t.pnl >= 0 ? 'positive' : 'negative'}`} style={{ padding: '12px', fontWeight: 700 }}>
                            {t.pnl >= 0 ? '+' : ''}{fmt(t.pnl)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`tag ${t.pnlPct >= 0 ? 'tag-positive' : 'tag-negative'}`}>
                              {t.pnlPct >= 0 ? '+' : ''}{fmt(t.pnlPct)}%
                            </span>
                          </td>
                          <td className="neutral mono" style={{ padding: '12px', fontSize: '11px' }}>{t.closeDate}</td>
                          <td className="neutral" style={{ padding: '12px', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note}</td>
                          <td style={{ padding: '12px' }}>
                            <button className="btn-danger" onClick={() => {
                              if (confirm(`¿Eliminar trade ${t.ticker}?`)) handleDeleteClosed(t.id)
                            }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── MONTHLY TAB ── */}
          {tab === 'monthly' && (
            <div className="fadeIn">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button className="btn-primary" onClick={() => setShowAddSnap(true)}>+ Agregar mes</button>
              </div>
              {snapshots.length === 0 ? (
                <EmptyState icon="📅" text="Agregá tu primer snapshot mensual" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {snapshots.slice().reverse().map((s, i, arr) => {
                    const prev = arr[i + 1]
                    const change = prev ? ((s.totalUSD - prev.totalUSD) / prev.totalUSD) * 100 : null
                    const retorno = s.capitalInvested > 0 ? ((s.totalUSD - s.capitalInvested) / s.capitalInvested) * 100 : null
                    return (
                      <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 20px' }}>
                        <div>
                          <div className="mono" style={{ fontWeight: 700, fontSize: '16px', color: 'var(--accent)' }}>
                            {s.month}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '18px' }} className="mono">US$ {fmt(s.totalUSD)}</div>
                          {s.capitalInvested > 0 && (
                            <div className="neutral" style={{ fontSize: '12px' }}>Capital: US$ {fmt(s.capitalInvested)}</div>
                          )}
                        </div>
                        {change !== null && (
                          <div style={{ textAlign: 'right' }}>
                            <div className={change >= 0 ? 'positive' : 'negative'} style={{ fontWeight: 700 }}>
                              {change >= 0 ? '+' : ''}{fmt(change)}%
                            </div>
                            <div className="neutral" style={{ fontSize: '11px' }}>vs mes anterior</div>
                          </div>
                        )}
                        {retorno !== null && (
                          <div style={{ textAlign: 'right' }}>
                            <span className={`tag ${retorno >= 0 ? 'tag-positive' : 'tag-negative'}`}>
                              {retorno >= 0 ? '+' : ''}{fmt(retorno)}% total
                            </span>
                          </div>
                        )}
                        {s.note && <div className="neutral" style={{ fontSize: '12px', maxWidth: '120px' }}>{s.note}</div>}
                        <button className="btn-danger" onClick={() => {
                          if (confirm('¿Eliminar este snapshot?')) handleDeleteSnapshot(s.id)
                        }}>✕</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {showAddPos && <AddPositionModal onAdd={handleAddPosition} onClose={() => setShowAddPos(false)} />}
      {showClose && <ClosePositionModal pos={showClose} onClose={() => setShowClose(null)} onConfirm={handleClosePosition} />}
      {showAddSnap && <AddSnapshotModal onAdd={handleAddSnapshot} onClose={() => setShowAddSnap(false)} currentValue={totalValue} />}
      {showAddClosed && <AddClosedTradeModal onAdd={handleAddClosed} onClose={() => setShowAddClosed(false)} />}
    </>
  )
}

// ─── Small components ──────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="card">
      <div className="neutral" style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div className="mono" style={{
        fontSize: '20px', fontWeight: 700,
        color: positive === undefined ? 'var(--text)' : positive ? 'var(--accent)' : 'var(--red)'
      }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: positive ? 'var(--accent)' : 'var(--red)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      <div className="neutral">{text}</div>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '16px'
    }} onClick={onClose}>
      <div className="card fadeIn" style={{ width: '100%', maxWidth: '440px', padding: '28px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>{title}</h2>
          <button className="btn-ghost" style={{ padding: '4px 10px' }} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

function AddPositionModal({ onAdd, onClose }: { onAdd: (d: Omit<Position, 'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ ticker: '', name: '', shares: '', entryPrice: '', currentPrice: '', currency: 'USD', date: new Date().toISOString().split('T')[0] })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.ticker || !form.shares || !form.entryPrice) return
    onAdd({
      ticker: form.ticker.toUpperCase(), name: form.name,
      shares: Number(form.shares), entryPrice: Number(form.entryPrice),
      currentPrice: Number(form.currentPrice) || Number(form.entryPrice),
      currency: form.currency, date: form.date
    })
  }

  return (
    <Modal title="Nueva Posición" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Ticker"><input placeholder="MELI" value={form.ticker} onChange={set('ticker')} /></Field>
          <Field label="Moneda">
            <select value={form.currency} onChange={set('currency')}>
              <option value="USD">USD</option><option value="ARS">ARS</option>
            </select>
          </Field>
        </div>
        <Field label="Nombre"><input placeholder="Mercado Libre" value={form.name} onChange={set('name')} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <Field label="Acciones"><input type="number" placeholder="10" value={form.shares} onChange={set('shares')} /></Field>
          <Field label="Precio entrada"><input type="number" placeholder="1800" value={form.entryPrice} onChange={set('entryPrice')} /></Field>
          <Field label="Precio actual"><input type="number" placeholder="1800" value={form.currentPrice} onChange={set('currentPrice')} /></Field>
        </div>
        <Field label="Fecha compra"><input type="date" value={form.date} onChange={set('date')} /></Field>
        <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%' }}>Agregar</button>
      </form>
    </Modal>
  )
}

function ClosePositionModal({ pos, onClose, onConfirm }: { pos: Position; onClose: () => void; onConfirm: (p: Position, exitPrice: number, note: string) => void }) {
  const [exitPrice, setExitPrice] = useState(String(pos.currentPrice))
  const [note, setNote] = useState('')
  const pnl = (Number(exitPrice) - pos.entryPrice) * pos.shares
  const pct = ((Number(exitPrice) - pos.entryPrice) / pos.entryPrice) * 100

  return (
    <Modal title={`Cerrar ${pos.ticker}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card" style={{ background: 'var(--surface2)', padding: '14px' }}>
          <div style={{ fontSize: '12px' }} className="neutral">{pos.shares} acciones · Entrada: {pos.currency} {pos.entryPrice}</div>
          <div style={{ fontWeight: 700, marginTop: '4px' }} className={pnl >= 0 ? 'positive' : 'negative'}>
            P&L estimado: {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
          </div>
        </div>
        <Field label="Precio de salida">
          <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)} />
        </Field>
        <Field label="Nota (motivo de cierre)">
          <input placeholder="ej: Sin tesis, rebalanceo..." value={note} onChange={e => setNote(e.target.value)} />
        </Field>
        <button className="btn-primary" style={{ width: '100%' }}
          onClick={() => onConfirm(pos, Number(exitPrice), note)}>
          Confirmar cierre
        </button>
      </div>
    </Modal>
  )
}

function AddSnapshotModal({ onAdd, onClose, currentValue }: { onAdd: (d: Omit<MonthlySnapshot, 'id'>) => void; onClose: () => void; currentValue: number }) {
  const now = new Date()
  const [form, setForm] = useState({
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    totalUSD: String(Math.round(currentValue)),
    capitalInvested: '',
    note: ''
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({ month: form.month, totalUSD: Number(form.totalUSD), capitalInvested: Number(form.capitalInvested) || 0, note: form.note })
  }

  return (
    <Modal title="Snapshot Mensual" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Mes"><input type="month" value={form.month} onChange={set('month')} /></Field>
        <Field label="Valor total (USD)"><input type="number" value={form.totalUSD} onChange={set('totalUSD')} /></Field>
        <Field label="Capital invertido (USD)"><input type="number" placeholder="Cuánto pusiste de tu bolsillo" value={form.capitalInvested} onChange={set('capitalInvested')} /></Field>
        <Field label="Nota"><input placeholder="ej: Vendí ADBE, compré más MELI" value={form.note} onChange={set('note')} /></Field>
        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>Guardar</button>
      </form>
    </Modal>
  )
}

function AddClosedTradeModal({ onAdd, onClose }: { onAdd: (d: Omit<ClosedTrade, 'id'>) => void; onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ ticker: '', name: '', shares: '', entryPrice: '', exitPrice: '', currency: 'USD', openDate: today, closeDate: today, note: '' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const pnl = (Number(form.exitPrice) - Number(form.entryPrice)) * Number(form.shares)
    const pnlPct = ((Number(form.exitPrice) - Number(form.entryPrice)) / Number(form.entryPrice)) * 100
    onAdd({
      ticker: form.ticker.toUpperCase(), name: form.name,
      shares: Number(form.shares), entryPrice: Number(form.entryPrice),
      exitPrice: Number(form.exitPrice), pnl, pnlPct,
      currency: form.currency, openDate: form.openDate,
      closeDate: form.closeDate, note: form.note
    })
  }

  return (
    <Modal title="Cargar Trade Cerrado" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Ticker"><input placeholder="ADBE" value={form.ticker} onChange={set('ticker')} /></Field>
          <Field label="Moneda"><select value={form.currency} onChange={set('currency')}><option>USD</option><option>ARS</option></select></Field>
        </div>
        <Field label="Nombre"><input placeholder="Adobe Inc." value={form.name} onChange={set('name')} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <Field label="Acciones"><input type="number" value={form.shares} onChange={set('shares')} /></Field>
          <Field label="Entrada"><input type="number" value={form.entryPrice} onChange={set('entryPrice')} /></Field>
          <Field label="Salida"><input type="number" value={form.exitPrice} onChange={set('exitPrice')} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Fecha apertura"><input type="date" value={form.openDate} onChange={set('openDate')} /></Field>
          <Field label="Fecha cierre"><input type="date" value={form.closeDate} onChange={set('closeDate')} /></Field>
        </div>
        <Field label="Nota"><input placeholder="Motivo..." value={form.note} onChange={set('note')} /></Field>
        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '4px' }}>Guardar</button>
      </form>
    </Modal>
  )
}
