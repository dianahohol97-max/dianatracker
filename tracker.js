'use client'

import { useState, useEffect } from 'react'

const PHASES = [
  {
    id: 'apr1', label: 'April · Week 1-2', color: '#4C7BC9',
    tasks: [
      { id: 't1', n: 'TouchMemories — mobile adaptation of constructor', plannedDays: 2, deadline: '2026-04-07' },
      { id: 't2', n: 'TouchMemories — remaining features + hand off to PM', plannedDays: 1, deadline: '2026-04-08' },
      { id: 't3', n: 'VistelaCo — apply for Canva Connect API access', plannedDays: 1, deadline: '2026-04-09', note: 'API review takes 3-7 days after applying' },
      { id: 't4', n: 'VistelaCo — set up Etsy OAuth + API credentials', plannedDays: 2, deadline: '2026-04-11' },
    ]
  },
  {
    id: 'apr2', label: 'April · Week 3-4', color: '#C94C6E',
    tasks: [
      { id: 't5', n: 'VistelaCo — Agent 1: Canva template generation (once API approved)', plannedDays: 4, deadline: '2026-04-21', note: 'Depends on Canva API approval' },
      { id: 't6', n: 'VistelaCo — Agent 2: listing visuals + mockups', plannedDays: 3, deadline: '2026-04-24' },
      { id: 't7', n: 'First YouTube/TikTok channel — Psychology + facts', plannedDays: 5, deadline: '2026-04-28' },
      { id: 't8', n: 'Affiliate network setup — ElevenLabs, Canva, Make, Amazon', plannedDays: 1, deadline: '2026-04-29' },
    ]
  },
  {
    id: 'may1', label: 'May · Week 1-2', color: '#4CC98A',
    tasks: [
      { id: 't9', n: 'VistelaCo — Agent 3: Etsy listings via API', plannedDays: 4, deadline: '2026-05-09', note: 'More complex than originally estimated — 1 week' },
      { id: 't10', n: 'VistelaCo — Agent 4: auto-posting Pinterest + Instagram + TikTok', plannedDays: 3, deadline: '2026-05-13' },
      { id: 't11', n: 'Channel 2 — Little-known history', plannedDays: 2, deadline: '2026-05-09' },
      { id: 't12', n: 'Channel 3 — Mysteries & secrets', plannedDays: 2, deadline: '2026-05-12' },
    ]
  },
  {
    id: 'may2', label: 'May · Week 3-4', color: '#9B4CC9',
    tasks: [
      { id: 't13', n: 'Etsy shop 2 — Art & posters (botanical, star maps, city maps)', plannedDays: 4, deadline: '2026-05-22' },
      { id: 't14', n: 'Etsy shop 3 — Planners & business templates', plannedDays: 4, deadline: '2026-05-27' },
      { id: 't15', n: 'TikTok Shop — connect for US market', plannedDays: 1, deadline: '2026-05-28' },
      { id: 't16', n: 'LinkedIn + Instagram — packaging as AI specialist', plannedDays: 2, deadline: '2026-05-30' },
    ]
  },
  {
    id: 'jun1', label: 'June · Week 1-2', color: '#C97A4C',
    tasks: [
      { id: 't17', n: 'Channels 4-5 — Money facts + Human body & science', plannedDays: 4, deadline: '2026-06-10' },
      { id: 't18', n: 'AI Marketing machine TouchMemories — layers 1-4', plannedDays: 6, deadline: '2026-06-14', note: 'Complex — 26 agents across 7 layers' },
    ]
  },
  {
    id: 'jun2', label: 'June · Week 3-4', color: '#4CC9C9',
    tasks: [
      { id: 't19', n: 'AI Marketing machine — layers 5-7 (SEO, Retention, Expansion)', plannedDays: 5, deadline: '2026-06-24' },
      { id: 't20', n: 'First consulting client via Upwork', plannedDays: 0, deadline: '2026-06-30', note: 'Ongoing — set up profile, apply to first projects' },
    ]
  },
  {
    id: 'jul', label: 'July', color: '#C9A84C',
    tasks: [
      { id: 't21', n: 'Channel 6 — Strange laws & traditions', plannedDays: 2, deadline: '2026-07-05' },
      { id: 't22', n: 'Momently Co — MVP: domain, env vars, 6 distinct templates', plannedDays: 10, deadline: '2026-07-18', note: 'More complex than estimated — 2 weeks realistic' },
      { id: 't23', n: 'Print on Demand — Printify integration', plannedDays: 3, deadline: '2026-07-22' },
      { id: 't24', n: 'Pinterest automation — auto-pin every listing & video', plannedDays: 2, deadline: '2026-07-25' },
    ]
  },
  {
    id: 'aug', label: 'August — September', color: '#4CC98A',
    tasks: [
      { id: 't25', n: 'Personal AI assistant — income tracking + project management', plannedDays: 7, deadline: '2026-08-14' },
      { id: 't26', n: 'Consulting — move to high-ticket $300-500/session', plannedDays: 0, deadline: '2026-08-30', note: 'Ongoing' },
      { id: 't27', n: 'System audit — what to scale, what to remove', plannedDays: 3, deadline: '2026-09-05' },
      { id: 't28', n: 'Optimize gaps — automate anything still manual', plannedDays: 5, deadline: '2026-09-15' },
    ]
  }
]

const S = {
  app: { background: '#0F0F0F', minHeight: '100vh', color: '#E8E8E0', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", fontSize: 15, paddingBottom: 60 },
  top: { position: 'sticky', top: 0, zIndex: 50, background: '#0F0F0F', borderBottom: '1px solid #1e1e1e', padding: '14px 20px 12px' },
  logo: { fontSize: 18, fontWeight: 700, color: '#C9A84C', marginBottom: 12 },
  tabs: { display: 'flex', gap: 6 },
  tab: (on) => ({ flex: 1, padding: '9px 6px', borderRadius: 9, border: on ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent', background: on ? 'rgba(201,168,76,0.1)' : '#222', color: on ? '#C9A84C' : '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
  prog: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 8px' },
  pbar: { flex: 1, height: 4, background: '#222', borderRadius: 2, overflow: 'hidden' },
  pfill: (pct) => ({ width: pct + '%', height: '100%', background: '#4CC98A', borderRadius: 2, transition: 'width .4s ease' }),
  pnum: { fontSize: 13, color: '#666', minWidth: 55, textAlign: 'right' },
  phlabel: (c) => ({ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: c, opacity: 0.8, padding: '14px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }),
  phcount: { fontSize: 10, color: '#444', fontWeight: 400, letterSpacing: 1 },
  row: (done) => ({ background: '#181818', borderRadius: 12, padding: '13px 16px', marginBottom: 7, cursor: 'pointer', border: '1px solid transparent', transition: 'background .12s, border-color .12s', opacity: done ? 0.5 : 1 }),
  rowInner: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  chk: (done, c) => ({ width: 22, height: 22, borderRadius: 7, border: done ? 'none' : '2px solid #333', background: done ? c : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all .2s', fontSize: 12, fontWeight: 800, color: 'white' }),
  info: { flex: 1, minWidth: 0 },
  taskName: (done) => ({ fontSize: 14, fontWeight: 500, lineHeight: 1.4, textDecoration: done ? 'line-through' : 'none', color: done ? '#444' : '#E8E8E0' }),
  note: { fontSize: 11, color: '#C97A4C', marginTop: 3, fontStyle: 'italic' },
  meta: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  deadlineLabel: (overdue) => ({ fontSize: 11, color: overdue ? '#C94C4C' : '#666', display: 'flex', alignItems: 'center', gap: 4 }),
  hoursRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 },
  hoursInp: { width: 52, background: '#222', border: '1px solid #333', borderRadius: 7, color: '#E8E8E0', fontSize: 14, fontWeight: 600, textAlign: 'center', padding: '4px 2px', outline: 'none' },
  hoursLabel: { fontSize: 11, color: '#666' },
  plannedBadge: (c) => ({ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: c + '18', color: c, fontWeight: 500 }),
}

function fmtDate(ds) {
  if (!ds) return ''
  const d = new Date(ds)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function isOverdue(ds, done) {
  if (done || !ds) return false
  return new Date(ds) < new Date()
}

export default function Tracker() {
  const [tab, setTab] = useState('plan')
  const [state, setState] = useState({})
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    try {
      const s = localStorage.getItem('diana_tracker_v2')
      if (s) setState(JSON.parse(s))
    } catch (e) {}
  }, [])

  function save(newState) {
    setState(newState)
    try { localStorage.setItem('diana_tracker_v2', JSON.stringify(newState)) } catch (e) {}
  }

  function toggleDone(id) {
    const s = { ...state, [id]: { ...state[id], done: !state[id]?.done } }
    save(s)
  }

  function setHours(id, val) {
    const s = { ...state, [id]: { ...state[id], hours: parseFloat(val) || 0 } }
    save(s)
  }

  function setDeadline(id, val) {
    const s = { ...state, [id]: { ...state[id], deadline: val } }
    save(s)
  }

  function toggleExpand(id, e) {
    e.stopPropagation()
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const allTasks = PHASES.flatMap(ph => ph.tasks)
  const total = allTasks.length
  const done = allTasks.filter(t => state[t.id]?.done).length
  const pct = total ? Math.round(done / total * 100) : 0
  const totalHours = allTasks.reduce((s, t) => s + (state[t.id]?.hours || 0), 0)

  return (
    <div style={S.app}>
      <div style={S.top}>
        <div style={S.logo}>✦ Diana · Plan Tracker</div>
        <div style={S.tabs}>
          {[['plan', '📋 Plan'], ['analytics', '📊 Stats']].map(([t, l]) => (
            <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>
      </div>

      {tab === 'plan' && <>
        <div style={S.prog}>
          <div style={S.pbar}><div style={S.pfill(pct)} /></div>
          <div style={S.pnum}>{done} / {total} · {pct}%</div>
        </div>

        {PHASES.map(ph => {
          const phDone = ph.tasks.filter(t => state[t.id]?.done).length
          return (
            <div key={ph.id}>
              <div style={S.phlabel(ph.color)}>
                {ph.label}
                <span style={S.phcount}>{phDone}/{ph.tasks.length}</span>
              </div>
              <div style={{ padding: '0 20px' }}>
                {ph.tasks.map(t => {
                  const isDone = !!state[t.id]?.done
                  const hours = state[t.id]?.hours || ''
                  const deadline = state[t.id]?.deadline || t.deadline
                  const overdue = isOverdue(deadline, isDone)
                  const isOpen = expanded[t.id]

                  return (
                    <div key={t.id} style={S.row(isDone)}>
                      <div style={S.rowInner} onClick={() => toggleDone(t.id)}>
                        <div style={S.chk(isDone, ph.color)}>{isDone ? '✓' : ''}</div>
                        <div style={S.info}>
                          <div style={S.taskName(isDone)}>{t.n}</div>
                          {t.note && <div style={S.note}>⚠ {t.note}</div>}
                          <div style={S.meta}>
                            {t.plannedDays > 0 && <span style={S.plannedBadge(ph.color)}>~{t.plannedDays}d planned</span>}
                            <span style={S.deadlineLabel(overdue)}>
                              {overdue ? '⚠' : '📅'} {fmtDate(deadline)}
                            </span>
                            {hours > 0 && <span style={{ fontSize: 11, color: '#4CC98A' }}>⏱ {hours}h logged</span>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => toggleExpand(t.id, e)}
                          style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>
                          {isOpen ? '▲' : '▼'}
                        </button>
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #222' }} onClick={e => e.stopPropagation()}>
                          <div style={S.hoursRow}>
                            <span style={S.hoursLabel}>Hours spent:</span>
                            <input
                              type="number" min="0" max="200" step="0.5"
                              value={hours} placeholder="0"
                              onChange={e => setHours(t.id, e.target.value)}
                              style={S.hoursInp} />
                            <span style={S.hoursLabel}>h total</span>
                          </div>
                          <div style={{ ...S.hoursRow, marginTop: 8 }}>
                            <span style={S.hoursLabel}>Deadline:</span>
                            <input
                              type="date"
                              value={deadline || ''}
                              onChange={e => setDeadline(t.id, e.target.value)}
                              style={{ ...S.hoursInp, width: 140, fontSize: 12 }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </>}

      {tab === 'analytics' && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              [done + ' / ' + total, 'Tasks done'],
              [pct + '%', 'Progress'],
              [totalHours.toFixed(1) + 'h', 'Hours logged'],
              [PHASES.filter(ph => ph.tasks.every(t => state[t.id]?.done)).length + ' / ' + PHASES.length, 'Phases done'],
            ].map(([v, l], i) => (
              <div key={i} style={{ background: '#181818', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#C9A84C', marginBottom: 4 }}>{v}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', opacity: 0.8, marginBottom: 12 }}>Hours by phase</div>
          {PHASES.map(ph => {
            const phHours = ph.tasks.reduce((s, t) => s + (state[t.id]?.hours || 0), 0)
            const phDone = ph.tasks.filter(t => state[t.id]?.done).length
            const maxH = Math.max(...PHASES.map(p => p.tasks.reduce((s, t) => s + (state[t.id]?.hours || 0), 0)), 1)
            return (
              <div key={ph.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: ph.color, width: 120, flexShrink: 0 }}>{ph.label.split('·')[0].trim()}</div>
                <div style={{ flex: 1, height: 5, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: (phHours / maxH * 100).toFixed(0) + '%', height: '100%', background: ph.color, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: '#666', width: 50, textAlign: 'right' }}>{phHours.toFixed(1)}h · {phDone}/{ph.tasks.length}</div>
              </div>
            )
          })}

          <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', opacity: 0.8, margin: '20px 0 12px' }}>Overdue tasks</div>
          {PHASES.flatMap(ph => ph.tasks.filter(t => isOverdue(state[t.id]?.deadline || t.deadline, state[t.id]?.done))).map(t => (
            <div key={t.id} style={{ background: 'rgba(201,76,76,0.08)', border: '1px solid rgba(201,76,76,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 7, fontSize: 13 }}>
              <div style={{ color: '#E8E8E0', fontWeight: 500 }}>{t.n}</div>
              <div style={{ color: '#C94C4C', fontSize: 11, marginTop: 3 }}>Deadline: {fmtDate(state[t.id]?.deadline || t.deadline)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
