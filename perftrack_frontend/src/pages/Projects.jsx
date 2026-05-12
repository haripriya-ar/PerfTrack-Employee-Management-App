import { useState, useEffect } from 'react';
import api from '../api/client';

const priorityCfg = {
  critical: { cls: 'pill-red', label: 'Critical' },
  high: { cls: 'pill-amber', label: 'High' },
  medium: { cls: 'pill-accent', label: 'Medium' },
  low: { cls: 'pill-green', label: 'Low' },
};

const statusColors = {
  active: 'var(--green)', completed: 'var(--accent2)',
  planning: 'var(--amber)', on_hold: 'var(--red)', cancelled: 'var(--text3)',
};

const ProjectsPage = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', status: 'planning', priority: 'medium',
    start_date: '', end_date: '', progress: 0,
  });

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin || isManager;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get('/projects/').then(r => {
      setProjects(r.data.results || r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await api.post('/projects/', { ...form, manager: user.id });
      const r = await api.get('/projects/');
      setProjects(r.data.results || r.data || []);
      setShowForm(false);
      setForm({ name: '', description: '', status: 'planning', priority: 'medium', start_date: '', end_date: '', progress: 0 });
      showToast('Project created!');
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to create project', 'error');
    }
  };

  const tabFilter = {
    active: p => ['active', 'planning'].includes(p.status),
    completed: p => p.status === 'completed',
    delayed: p => p.status === 'on_hold' || p.status === 'cancelled' || (new Date(p.end_date) < new Date() && p.status !== 'completed'),
  };

  const filtered = projects
    .filter(tabFilter[tab] || (() => true))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const getDaysLeft = (end) => {
    const diff = Math.ceil((new Date(end) - new Date()) / 86400000);
    return diff > 0 ? `${diff}d left` : diff === 0 ? 'Due today' : `${Math.abs(diff)}d overdue`;
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text3)', textAlign: 'center' }}>Loading projects…</div>;

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 200, padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
          color: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
          fontSize: 13, fontWeight: 500, backdropFilter: 'blur(12px)',
        }}>{toast.type === 'error' ? '✗' : '✓'} {toast.msg}</div>
      )}

      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card accent">
          <div className="metric-label">Total Projects</div>
          <div className="metric-value accent">{projects.length}</div>
        </div>
        <div className="metric-card teal">
          <div className="metric-label">Active</div>
          <div className="metric-value teal">{projects.filter(p => p.status === 'active').length}</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Completed</div>
          <div className="metric-value green">{projects.filter(p => p.status === 'completed').length}</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Avg Progress</div>
          <div className="metric-value amber">{projects.length ? Math.round(projects.reduce((a, p) => a + (p.progress || 0), 0) / projects.length) : 0}%</div>
        </div>
      </div>

      {/* Tabs + Search + Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['active', 'completed', 'delayed'].map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="input-field" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200, padding: '6px 12px', fontSize: 13 }} />
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Project</button>
          )}
        </div>
      </div>

      {/* Project Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {filtered.map(p => {
          const pr = priorityCfg[p.priority] || priorityCfg.medium;
          const daysInfo = getDaysLeft(p.end_date);
          const isOverdue = daysInfo.includes('overdue');
          return (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 12.5, color: 'var(--text3)', lineHeight: 1.5 }}>{p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}</div>}
                </div>
                <span className={`stat-pill ${pr.cls}`}>{pr.label}</span>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)' }}>{p.progress}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{
                    width: `${p.progress}%`,
                    background: p.progress >= 80 ? 'linear-gradient(90deg, var(--green), #6ee7b7)' : p.progress >= 40 ? 'linear-gradient(90deg, var(--accent), var(--accent2))' : 'linear-gradient(90deg, var(--amber), #fbbf24)',
                  }} />
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="dot" style={{ background: statusColors[p.status] || 'var(--text3)', boxShadow: `0 0 8px ${statusColors[p.status] || 'transparent'}` }} />
                  <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'capitalize' }}>{(p.status || '').replace('_', ' ')}</span>
                </div>
                <span style={{ fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text3)', fontWeight: isOverdue ? 600 : 400 }}>📅 {daysInfo}</span>
              </div>

              {/* Team Avatars */}
              {p.assigned_employees && p.assigned_employees.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>Team:</span>
                  {p.assigned_employees.slice(0, 5).map((emp, i) => (
                    <div key={i} className="avatar" style={{ width: 26, height: 26, fontSize: 9, marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg2)' }}>
                      {typeof emp === 'object' ? (emp.avatar_initials || (emp.full_name || '?')[0]) : '?'}
                    </div>
                  ))}
                  {p.assigned_employees.length > 5 && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>+{p.assigned_employees.length - 5}</span>
                  )}
                </div>
              )}

              {/* Dates */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: p.assigned_employees?.length > 0 ? 0 : 'auto', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Start: {p.start_date}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>End: {p.end_date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          {user.role === 'employee' ? 'No projects assigned to you yet' : 'No projects in this category'}
        </div>
      )}

      {/* Create Modal - only for admin/manager */}
      {showForm && canManage && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create Project</div>
            <div className="input-group">
              <label className="input-label">Project Name *</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dashboard Redesign" />
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-row">
              <div className="form-col">
                <label className="input-label">Priority</label>
                <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-col">
                <label className="input-label">Status</label>
                <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%' }}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-col">
                <label className="input-label">Start Date *</label>
                <input className="input-field" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="form-col">
                <label className="input-label">End Date *</label>
                <input className="input-field" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Project</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectsPage;
