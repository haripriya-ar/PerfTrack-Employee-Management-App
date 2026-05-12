import { useState, useEffect } from 'react';
import api from '../api/client';
import { downloadAuthFile } from '../utils/exportHelpers';

const ReportsPage = ({ user }) => {
  const [companyData, setCompanyData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [compRes, empRes] = await Promise.all([
          api.get('/reports/company/'),
          api.get('/users/'),
        ]);
        setCompanyData(compRes.data);
        setEmployees((empRes.data.results || empRes.data || []).filter(u => u.role === 'employee'));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDownload = async (key, endpoint, filename) => {
    setDownloading(p => ({ ...p, [key]: true }));
    try {
      const ok = await downloadAuthFile(endpoint, filename);
      if (ok) showToast(`${filename} downloaded`);
      else showToast('Download failed', 'error');
    } catch (e) {
      showToast('Download failed — check backend', 'error');
    }
    setDownloading(p => ({ ...p, [key]: false }));
  };

  const topPerformers = companyData?.top_performers || [];
  const needsAttention = companyData?.needs_attention || [];
  const deptStats = companyData?.department_stats || [];
  const periodTrend = companyData?.period_trend || [];

  if (loading) return <div style={{ padding: 40, color: 'var(--text3)', textAlign: 'center' }}>Loading reports…</div>;

  // Compute summary stats
  const totalEvals = companyData?.total_evaluations || 0;
  const avgTask = deptStats.length > 0 ? Math.round(deptStats.reduce((a, d) => a + (d.avg_task || 0), 0) / deptStats.length) : 0;
  const avgAttend = deptStats.length > 0 ? Math.round(deptStats.reduce((a, d) => a + (d.avg_attend || 0), 0) / deptStats.length) : 0;

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

      {/* Summary Metrics */}
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card accent">
          <div className="metric-label">Total Evaluations</div>
          <div className="metric-value accent">{totalEvals}</div>
          <div className="metric-delta" style={{ color: 'var(--text3)' }}>All records</div>
        </div>
        <div className="metric-card teal">
          <div className="metric-label">Avg Task Score</div>
          <div className="metric-value teal">{avgTask}%</div>
          <div className="metric-delta delta-up">Company-wide</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Avg Attendance</div>
          <div className="metric-value amber">{avgAttend}%</div>
          <div className="metric-delta" style={{ color: 'var(--text3)' }}>All departments</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Departments</div>
          <div className="metric-value green">{deptStats.length}</div>
          <div className="metric-delta" style={{ color: 'var(--text3)' }}>Active teams</div>
        </div>
      </div>

      {/* Export Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600 }}>Employee CSV Export</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>All employee performance data</div>
          </div>
          <button className="btn btn-teal btn-sm" disabled={downloading.csv} onClick={() => handleDownload('csv', '/reports/employees-csv/', 'employees_export.csv')}>
            {downloading.csv ? '⏳ Downloading…' : '⬇ CSV'}
          </button>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600 }}>Performance PDF Report</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Full performance summary PDF</div>
          </div>
          <button className="btn btn-primary btn-sm" disabled={downloading.pdf} onClick={() => handleDownload('pdf', '/reports/performance-pdf/', 'performance_report.pdf')}>
            {downloading.pdf ? '⏳ Generating…' : '⬇ PDF'}
          </button>
        </div>
      </div>

      {/* Department Analytics */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Department Analytics</div>
            <div className="card-sub">Average scores by department</div>
          </div>
          <span className="tag">{deptStats.length} departments</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Department</th><th>Avg Tasks</th><th>Avg Productivity</th><th>Avg Attendance</th><th>Avg Rating</th><th>Records</th></tr>
            </thead>
            <tbody>
              {deptStats.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>No data</td></tr>
              )}
              {deptStats.map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{d.employee__department__name || 'N/A'}</td>
                  <td><span className={`stat-pill ${(d.avg_task || 0) >= 80 ? 'pill-green' : (d.avg_task || 0) >= 60 ? 'pill-amber' : 'pill-red'}`}>{Math.round(d.avg_task || 0)}%</span></td>
                  <td><span className={`stat-pill ${(d.avg_prod || 0) >= 80 ? 'pill-green' : 'pill-amber'}`}>{Math.round(d.avg_prod || 0)}%</span></td>
                  <td><span className={`stat-pill ${(d.avg_attend || 0) >= 90 ? 'pill-green' : 'pill-amber'}`}>{Math.round(d.avg_attend || 0)}%</span></td>
                  <td style={{ color: 'var(--amber)', fontWeight: 600 }}>{(d.avg_rating || 0).toFixed(1)} ★</td>
                  <td style={{ color: 'var(--text3)' }}>{d.count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Top Performers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏆 Top Performers</div>
            <span className="tag">{topPerformers.length}</span>
          </div>
          {topPerformers.length === 0 && <div style={{ padding: 20, color: 'var(--text3)', textAlign: 'center' }}>No data</div>}
          {topPerformers.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < topPerformers.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, background: i === 0 ? 'var(--amber)' : i === 1 ? '#a0a0a0' : 'var(--bg4)', color: 'white',
              }}>{i + 1}</div>
              <div className="avatar teal" style={{ width: 30, height: 30, fontSize: 10 }}>
                {p.employee__avatar_initials || (p.employee__first_name || '?')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.employee__first_name} {p.employee__last_name || ''}</div>
              </div>
              <span className="stat-pill pill-green">{Math.round(p.avg_task || 0)}%</span>
            </div>
          ))}
        </div>

        {/* Needs Attention */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ Needs Attention</div>
            <span className="tag">{needsAttention.length}</span>
          </div>
          {needsAttention.length === 0 && <div style={{ padding: 20, color: 'var(--text3)', textAlign: 'center' }}>All employees performing well ✓</div>}
          {needsAttention.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < needsAttention.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="avatar amber" style={{ width: 30, height: 30, fontSize: 10 }}>
                {(p.employee__first_name || '?')[0]}{(p.employee__last_name || '?')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.employee__first_name} {p.employee__last_name || ''}</div>
              </div>
              <span className="stat-pill pill-red">{Math.round(p.avg_task || 0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Rankings Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Employee Performance Rankings</div>
            <div className="card-sub">All employees from user accounts</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Employee</th><th>Role</th><th>Department</th><th>Status</th></tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>No employees</td></tr>
              )}
              {employees.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="td-name">
                      <div className="avatar amber" style={{ width: 30, height: 30, fontSize: 10 }}>{e.avatar_initials || '?'}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{e.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`role-badge role-${e.role}`}>{e.role}</span></td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>{e.department_name || '—'}</td>
                  <td>
                    <div className="flex-center gap8">
                      <div className={`dot ${e.is_active ? 'dot-green' : 'dot-red'}`} />
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{e.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>🤖 AI Analytics Summary</div>
        <div className="insight">
          <div className="insight-icon">📈</div>
          <div className="insight-text">
            <strong>Company overview:</strong> {totalEvals} evaluations across {deptStats.length} departments.
            {topPerformers[0] && <> Top performer: <strong>{topPerformers[0].employee__first_name}</strong> at {Math.round(topPerformers[0].avg_task || 0)}%.</>}
          </div>
        </div>
        <div className="insight">
          <div className="insight-icon">🎯</div>
          <div className="insight-text">
            <strong>Attention required:</strong> {needsAttention.length} employee{needsAttention.length !== 1 ? 's' : ''} below the 75% threshold need coaching.
          </div>
        </div>
        <div className="insight">
          <div className="insight-icon">📊</div>
          <div className="insight-text">
            <strong>Attendance:</strong> Average attendance across all departments is {avgAttend}%.
            {avgAttend >= 90 ? ' Excellent company-wide attendance.' : ' Consider reviewing attendance policies.'}
          </div>
        </div>
        <div className="insight">
          <div className="insight-icon">💡</div>
          <div className="insight-text">
            <strong>Recommendation:</strong> Use the CSV/PDF export buttons above to generate detailed offline reports for quarterly reviews.
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportsPage;
