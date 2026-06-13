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
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
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
    const load = async () => {
      try {
        const r = await api.get('/projects/');
        setProjects(r.data.results || r.data || []);
      } catch { /* ignore */ }

      // Load employees for assignment
      if (canManage) {
        try {
          const empRes = await api.get('/employees/dropdown/');
          setEmployees(Array.isArray(empRes.data) ? empRes.data : empRes.data.results || []);
        } catch {
          try {
            const teamRes = await api.get('/team/');
            setEmployees(Array.isArray(teamRes.data) ? teamRes.data : teamRes.data.results || []);
          } catch { /* ignore */ }
        }
      }

      setLoading(false);
    };
    load();
  }, [canManage]);

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleCreate = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await api.post('/projects/', {
        ...form,
        manager: user.id,
        assigned_employees: selectedEmployees,
      });
      const r = await api.get('/projects/');
      setProjects(r.data.results || r.data || []);
      setShowForm(false);
      setForm({ name: '', description: '', status: 'planning', priority: 'medium', start_date: '', end_date: '', progress: 0 });
      setSelectedEmployees([]);
      showToast('Project created successfully!');
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

  // Loading skeleton
  if (loading) return (
    <div style={{ padding: 40 }}>
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="metric-card" style={{ minHeight: 90 }}>
            <div style={{ width: 100, height: 12, background: 'var(--bg4)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: 60, height: 28, background: 'var(--bg4)', borderRadius: 6 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {[1,2,3].map(i => (
          <div key={i} className="card" style={{ minHeight: 200 }}>
            <div style={{ width: '60%', height: 14, background: 'var(--bg4)', borderRadius: 4, marginBottom: 16 }} />
            <div style={{ width: '100%', height: 8, background: 'var(--bg4)', borderRadius: 4, marginBottom: 20 }} />
            <div style={{ width: '40%', height: 10, background: 'var(--bg4)', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );

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
          const empDetails = p.assigned_employees_detail || [];
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
                {p.manager_detail && (
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>👤 {p.manager_detail.full_name}</span>
                )}
              </div>

              {/* Team Avatars — use detailed employee data from serializer */}
              {empDetails.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>Team:</span>
                  {empDetails.slice(0, 5).map((emp, i) => (
                    <div key={emp.id || i} className="avatar" style={{ width: 26, height: 26, fontSize: 9, marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg2)' }} title={emp.full_name || ''}>
                      {emp.avatar_initials || (emp.full_name || '?')[0]}
                    </div>
                  ))}
                  {empDetails.length > 5 && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>+{empDetails.length - 5}</span>
                  )}
                </div>
              )}

              {/* Dates */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: empDetails.length > 0 ? 0 : 'auto', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Start: {p.start_date}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>End: {p.end_date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
          <div style={{ color: 'var(--text2)', fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
            {user.role === 'employee' ? 'No projects assigned to you yet' : 'No projects in this category'}
          </div>
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>
            {canManage ? 'Create a new project and assign team members.' : 'Projects assigned to you by your manager will appear here.'}
          </div>
        </div>
      )}

      {/* Create Modal - only for admin/manager */}
      {showForm && canManage && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 560 }}>
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

            {/* Employee Assignment */}
            <div className="input-group" style={{ marginTop: 4 }}>
              <label className="input-label">Assign Employees</label>
              {employees.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>No employees available</div>
              ) : (
                <div style={{
                  maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border2)',
                  borderRadius: 8, background: 'var(--bg3)',
                }}>
                  {employees.map(emp => {
                    const isSelected = selectedEmployees.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                          cursor: 'pointer', borderBottom: '1px solid var(--border)',
                          background: isSelected ? 'rgba(108,99,255,0.1)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, border: '2px solid',
                          borderColor: isSelected ? 'var(--accent)' : 'var(--border2)',
                          background: isSelected ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 0.15s',
                        }}>
                          {isSelected && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div className="avatar" style={{ width: 24, height: 24, fontSize: 9 }}>
                          {emp.avatar_initials || (emp.full_name || '?')[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.full_name}</div>
                          {(emp.department || emp.department_name) && (
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{emp.department || emp.department_name}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedEmployees.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 6 }}>
                  {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setSelectedEmployees([]); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Project</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectsPage;
