import { useState, useEffect } from 'react';
import api from '../api/client';

const FeedbackPage = ({ user }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    reviewee: '', rating: 4, comments: '', strengths: '', improvements: '', is_anonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const fbRes = await api.get('/feedback/');
        setFeedbacks(fbRes.data.results || fbRes.data || []);
      } catch (e) {
        console.error('Failed to load feedback:', e);
      }

      // Fetch employees — use /employees/dropdown/ (available to all authenticated users)
      try {
        let empData = [];
        try {
          const res = await api.get('/employees/dropdown/');
          empData = Array.isArray(res.data) ? res.data : res.data.results || [];
        } catch {
          // Fallback: try /users/ for admins
          const res = await api.get('/users/');
          empData = Array.isArray(res.data) ? res.data : res.data.results || [];
        }
        setEmployees(empData.filter(e => e.id !== user.id));
      } catch (e) {
        console.error('Failed to load employees:', e);
        showToast('Could not load employee list', 'error');
      }

      setEmpLoading(false);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const handleSubmit = async () => {
    if (!form.reviewee) { showToast('Please select an employee', 'error'); return; }
    if (!form.comments.trim()) { showToast('Please add comments', 'error'); return; }
    setSubmitting(true);
    try {
      await api.post('/feedback/', {
        reviewee: Number(form.reviewee),
        rating: form.rating,
        comments: form.comments,
        strengths: form.strengths,
        improvements: form.improvements,
        is_anonymous: form.is_anonymous,
      });
      const r = await api.get('/feedback/');
      setFeedbacks(r.data.results || r.data || []);
      setShowForm(false);
      setForm({ reviewee: '', rating: 4, comments: '', strengths: '', improvements: '', is_anonymous: false });
      showToast('Feedback submitted successfully!');
    } catch (e) {
      console.error('Submit failed:', e);
      showToast(e.response?.data?.detail || 'Submission failed', 'error');
    }
    setSubmitting(false);
  };

  const getSentiment = (rating) => {
    if (rating >= 4) return { label: 'Positive', cls: 'pill-green', icon: '😊' };
    if (rating >= 3) return { label: 'Neutral', cls: 'pill-amber', icon: '😐' };
    return { label: 'Negative', cls: 'pill-red', icon: '😟' };
  };

  const getName = (detail, fallbackId) => {
    if (detail?.full_name) return detail.full_name;
    return `User #${fallbackId}`;
  };

  const filtered = filter === 'all' ? feedbacks
    : filter === 'given' ? feedbacks.filter(f => f.reviewer === user.id)
    : feedbacks.filter(f => f.reviewee === user.id);

  if (loading) return <div style={{ padding: 40, color: 'var(--text3)', textAlign: 'center' }}>Loading feedback…</div>;

  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((a, f) => a + (f.rating || 0), 0) / feedbacks.length).toFixed(1) : '0.0';

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 200, padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
          color: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
          fontSize: 13, fontWeight: 500, backdropFilter: 'blur(12px)',
        }}>
          {toast.type === 'error' ? '✗' : '✓'} {toast.msg}
        </div>
      )}

      {/* Metrics */}
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card accent">
          <div className="metric-label">Total Reviews</div>
          <div className="metric-value accent">{feedbacks.length}</div>
          <div className="metric-delta" style={{ color: 'var(--text3)' }}>All peer reviews</div>
        </div>
        <div className="metric-card teal">
          <div className="metric-label">Avg Rating</div>
          <div className="metric-value teal">{avgRating}</div>
          <div className="metric-delta delta-up">Out of 5.0</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Positive</div>
          <div className="metric-value amber">{feedbacks.filter(f => f.rating >= 4).length}</div>
          <div className="metric-delta" style={{ color: 'var(--text3)' }}>Rating ≥ 4</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Anonymous</div>
          <div className="metric-value green">{feedbacks.filter(f => f.is_anonymous).length}</div>
          <div className="metric-delta" style={{ color: 'var(--text3)' }}>Private reviews</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'given', 'received'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Submit Review</button>
      </div>

      {/* Feedback Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Feedback History</div>
          <span className="tag">{filtered.length} entries</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Reviewer</th><th>Reviewee</th><th>Rating</th><th>Sentiment</th><th>Comments</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 30 }}>No feedback found</td></tr>
              )}
              {filtered.map((f, i) => {
                const s = getSentiment(f.rating);
                const reviewerName = f.is_anonymous ? 'Anonymous' : getName(f.reviewer_detail, f.reviewer);
                const revieweeName = getName(f.reviewee_detail, f.reviewee);
                const reviewerInitials = f.is_anonymous ? '🔒' : (f.reviewer_detail?.avatar_initials || reviewerName.slice(0, 2).toUpperCase());
                return (
                  <tr key={f.id || i}>
                    <td>
                      <div className="td-name">
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 10 }}>{reviewerInitials}</div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{reviewerName}</div>
                          {f.reviewer_detail?.department_name && !f.is_anonymous && (
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{f.reviewer_detail.department_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="td-name">
                        <div className="avatar teal" style={{ width: 30, height: 30, fontSize: 10 }}>{f.reviewee_detail?.avatar_initials || '?'}</div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{revieweeName}</div>
                          {f.reviewee_detail?.department_name && (
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{f.reviewee_detail.department_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className={`star ${n <= f.rating ? '' : 'empty'}`}>★</span>
                        ))}
                        <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--text2)' }}>{f.rating}.0</span>
                      </div>
                    </td>
                    <td><span className={`stat-pill ${s.cls}`}>{s.icon} {s.label}</span></td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)', fontSize: 13 }}>{f.comments}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 560 }}>
            <div className="modal-title">Submit Peer Review</div>

            <div className="form-row">
              <div className="form-col">
                <label className="input-label">Select Employee *</label>
                <select
                  className="input-field"
                  value={form.reviewee}
                  onChange={e => setForm({ ...form, reviewee: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">{empLoading ? 'Loading employees…' : 'Choose employee…'}</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.full_name || e.email}
                      {(e.department || e.department_name) ? ` — ${e.department || e.department_name}` : ''}
                    </option>
                  ))}
                </select>
                {!empLoading && employees.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>No employees loaded. Check API connection.</div>
                )}
              </div>
              <div className="form-col">
                <label className="input-label">Rating</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min={1} max={5} step={1} value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} style={{ flex: 1 }} />
                  <span className="range-val">{form.rating}/5</span>
                </div>
                <div className="stars" style={{ marginTop: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={`star ${n <= form.rating ? '' : 'empty'}`} style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setForm({ ...form, rating: n })}>★</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Comments *</label>
              <textarea className="input-field" rows={3} value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} placeholder="Share your detailed feedback…" style={{ resize: 'vertical' }} />
            </div>

            <div className="form-row">
              <div className="form-col">
                <label className="input-label">Strengths</label>
                <textarea className="input-field" rows={2} value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} placeholder="Key strengths observed…" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-col">
                <label className="input-label">Areas for Improvement</label>
                <textarea className="input-field" rows={2} value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} placeholder="Improvement suggestions…" style={{ resize: 'vertical' }} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} />
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>🔒 Submit anonymously</span>
            </label>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackPage;
