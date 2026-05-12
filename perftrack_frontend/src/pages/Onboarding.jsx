import { useState, useEffect } from 'react';
import api from '../api/client';

const OnboardingPage = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee: '', template: '' });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const endpoints = user.role === 'employee'
          ? [api.get('/onboarding/me/')]
          : [api.get('/onboarding/'), api.get('/onboarding/templates/'), api.get('/users/')];
        const results = await Promise.all(endpoints);

        if (user.role === 'employee') {
          const d = results[0].data;
          setRecords(Array.isArray(d) ? d : d ? [d] : []);
        } else {
          setRecords(results[0].data.results || results[0].data || []);
          setTemplates(results[1].data.results || results[1].data || []);
          const u = results[2].data.results || results[2].data || [];
          setEmployees(u.filter(e => e.role === 'employee'));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [user.role]);

  const handleCreate = async () => {
    if (!form.employee || !form.template) return;
    try {
      await api.post('/onboarding/create/', form);
      const r = await api.get('/onboarding/');
      setRecords(r.data.results || r.data || []);
      setShowCreate(false);
      setForm({ employee: '', template: '' });
    } catch (e) { console.error(e); }
  };

  const handleCompleteStep = async (recordId, stepIndex) => {
    try {
      await api.post(`/onboarding/${recordId}/complete-step/`, { step_index: stepIndex });
      const r = user.role === 'employee' ? await api.get('/onboarding/me/') : await api.get('/onboarding/');
      if (user.role === 'employee') {
        const d = r.data;
        setRecords(Array.isArray(d) ? d : d ? [d] : []);
      } else {
        setRecords(r.data.results || r.data || []);
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text3)', textAlign: 'center' }}>Loading onboarding…</div>;

  const completedCount = records.filter(r => r.is_complete).length;
  const inProgressCount = records.filter(r => !r.is_complete).length;
  const avgProgress = records.length > 0 ? Math.round(records.reduce((a, r) => a + (r.progress_percentage || 0), 0) / records.length) : 0;

  return (
    <>
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card accent">
          <div className="metric-label">Total Records</div>
          <div className="metric-value accent">{records.length}</div>
        </div>
        <div className="metric-card teal">
          <div className="metric-label">In Progress</div>
          <div className="metric-value teal">{inProgressCount}</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Completed</div>
          <div className="metric-value green">{completedCount}</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Avg Progress</div>
          <div className="metric-value amber">{avgProgress}%</div>
        </div>
      </div>

      {user.role !== 'employee' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Start Onboarding</button>
        </div>
      )}

      {/* Onboarding Records */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
        {records.map(rec => {
          const templateSteps = rec.template_data?.steps || rec.template?.steps || [];
          const completedSteps = rec.completed_steps || [];
          const isExpanded = expandedId === rec.id;

          return (
            <div key={rec.id} className="card">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    {rec.employee_name || rec.employee?.full_name || 'Employee'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    Started: {rec.started_at ? new Date(rec.started_at).toLocaleDateString() : '—'}
                  </div>
                </div>
                <span className={`stat-pill ${rec.is_complete ? 'pill-green' : 'pill-amber'}`}>
                  {rec.is_complete ? '✓ Complete' : 'In Progress'}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Onboarding Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)' }}>{Math.round(rec.progress_percentage || 0)}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{
                    width: `${rec.progress_percentage || 0}%`,
                    background: rec.is_complete ? 'linear-gradient(90deg, var(--green), #6ee7b7)' : 'linear-gradient(90deg, var(--accent), var(--accent2))',
                  }} />
                </div>
              </div>

              {/* Stepper - Steps */}
              {templateSteps.length > 0 && (
                <div>
                  <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12, width: '100%' }} onClick={() => setExpandedId(isExpanded ? null : rec.id)}>
                    {isExpanded ? '▾ Hide Steps' : '▸ Show Steps'} ({completedSteps.length}/{templateSteps.length})
                  </button>

                  {isExpanded && templateSteps.map((step, idx) => {
                    const done = completedSteps.includes(idx);
                    return (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
                        borderBottom: idx < templateSteps.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        {/* Step indicator */}
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                          background: done ? 'var(--green)' : 'var(--bg4)', color: done ? 'white' : 'var(--text3)',
                        }}>
                          {done ? '✓' : idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: done ? 'var(--green)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>
                            {step.title || `Step ${idx + 1}`}
                          </div>
                          {step.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{step.description}</div>}
                        </div>
                        {!done && (user.role !== 'employee' || true) && (
                          <button className="btn btn-teal btn-sm" onClick={() => handleCompleteStep(rec.id, idx)}>
                            Complete
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {records.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          {user.role === 'employee' ? 'No onboarding assigned yet' : 'No onboarding records'}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Start Employee Onboarding</div>
            <div className="input-group">
              <label className="input-label">Employee</label>
              <select className="input-field" value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })} style={{ width: '100%' }}>
                <option value="">Select employee…</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name || e.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Template</label>
              <select className="input-field" value={form.template} onChange={e => setForm({ ...form, template: e.target.value })} style={{ width: '100%' }}>
                <option value="">Select template…</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.department})</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Start Onboarding</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnboardingPage;
