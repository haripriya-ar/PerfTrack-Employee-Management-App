import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const typeIcons = {
  performance: '📊', project: '📁', feedback: '⭐',
  hr: '👤', okr: '🎯', system: '🔔',
};

const NotificationPanel = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(!open)} style={{ position: 'relative' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        Alerts
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: 'white',
            fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 360,
          background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 150, overflow: 'hidden',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600 }}>Notifications</span>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No notifications</div>
            )}
            {notifications.slice(0, 15).map(n => (
              <div
                key={n.id}
                onClick={() => { if (!n.is_read) markRead(n.id); }}
                style={{
                  display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: n.is_read ? 'transparent' : 'rgba(108,99,255,0.05)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(108,99,255,0.05)'}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcons[n.type] || '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 500, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </div>
                </div>
                {!n.is_read && <div className="dot dot-green" style={{ marginTop: 4 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
