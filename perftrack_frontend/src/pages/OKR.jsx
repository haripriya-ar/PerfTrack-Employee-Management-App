import { useState, useEffect } from 'react';
import api from '../api/client';

const statusCfg = {
  on_track: { label: 'On Track', cls: 'pill-green' },
  at_risk: { label: 'At Risk', cls: 'pill-amber' },
  delayed: { label: 'Delayed', cls: 'pill-red' },
  completed: { label: 'Completed', cls: 'pill-accent' },
};

const getStatus = (obj) => {
  if (obj.progress >= 100) return 'completed';
  const now = new Date();
  const end = new Date(obj.end_date);
  const start = new Date(obj.start_date);
  const elapsed = (now - start) / (end - start);
  if (obj.progress / 100 >= elapsed * 0.7) return 'on_track';
  if (obj.progress / 100 >= elapsed * 0.4) return 'at_risk';
  return 'delayed';
};

const OKRPage = ({ user }) => {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    title: '', description: '', owner: user?.id || '', department: '', start_date: '', end_date: '',
  });

  useEffect(() => {
    api.get('/okr/objectives/').then(r => {
      setObjectives(r.data.results || r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.start_date || !form.end_date) return;
    try {
      await api.post('/okr/objectives/', { ...form, owner: form.owner || user.id });
      const r = await api.get('/okr/objectives/');
      setObjectives(r.data.results || r.data || []);
      setShowForm(false);
      setForm({ title: '', description: '', owner: user?.id || '', department: '', start_date: '', end_date: '' });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/okr/objectives/${id}/`);
      setObjectives(prev => prev.filter(o => o.id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'all' ? objectives : objectives.filter(o => getStatus(o) === filter);

  if (loading) return <div style={{ padding: 40, color: 'var(--text3)', textAlign: 'center' }}>Loading OKRs…</div>;

  const completed = objectives.filter(o => o.progress >= 100).length;
  const avgProgress = objectives.length > 0 ? Math.round(objectives.reduce((a, o) => a + (o.progress || 0), 0) / objectives.length) : 0;

  return (
    <>
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card accent">
          <div className="metric-label">Total Objectives</div>
          <div className="metric-value accent">{objectives.length}</div>
        </div>
        <div className="metric-card teal">
          <div className="metric-label">Avg Progress</div>
          <div className="metric-value teal">{avgProgress}%</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Completed</div>
          <div className="metric-value green">{completed}</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">At Risk</div>
          <div className="metric-value amber">{objectives.filter(o => getStatus(o) === 'at_risk' || getStatus(o) === 'delayed').length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'on_track', 'at_risk', 'delayed', 'completed'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : (statusCfg[f]?.label || f)}
            </button>
          ))}
        </div>
        {(user.role === 'admin' || user.role === 'manager') && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Objective</button>
        )}
      </div>

      {/* OKR Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {filtered.map(obj => {
          const st = getStatus(obj);
          const cfg = statusCfg[st];
          const krs = obj.key_results || [];
          return (
            <div key={obj.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{obj.title}</div>
                  {obj.description && <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 8 }}>{obj.description}</div>}
                </div>
                <span className={`stat-pill ${cfg.cls}`}>{cfg.label}</span>
              </div>

              {/* Progress Ring */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ position: 'relative', width: 56, height: 56 }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--bg4)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke={st === 'completed' ? 'var(--green)' : st === 'delayed' ? 'var(--red)' : 'var(--accent)'} strokeWidth="4" strokeDasharray={`${(obj.progress / 100) * 150.8} 150.8`} strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{Math.round(obj.progress)}%</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Owner: {obj.owner_name || obj.owner?.full_name || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {obj.start_date} → {obj.end_date}
                  </div>
                  {obj.department && <div style={{ marginTop: 4 }}><span className="tag">{obj.department}</span></div>}
                </div>
              </div>

              {/* Key Results */}
              {krs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, fontWeight: 600 }}>Key Results</div>
                  {krs.map(kr => (
                    <div key={kr.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{kr.title}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)' }}>{Math.round(kr.progress_percentage || 0)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill fill-accent" style={{ width: `${kr.progress_percentage || 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(user.role === 'admin' || user.role === 'manager') && (
                <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(obj.id)}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No objectives found</div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create Objective</div>
            <div className="input-group">
              <label className="input-label">Title</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Q3 Revenue Growth" />
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the objective…" style={{ resize: 'vertical' }} />
            </div>
            <div className="form-row">
              <div className="form-col">
                <label className="input-label">Start Date</label>
                <input className="input-field" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="form-col">
                <label className="input-label">End Date</label>
                <input className="input-field" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Department</label>
              <input className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Objective</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OKRPage;
