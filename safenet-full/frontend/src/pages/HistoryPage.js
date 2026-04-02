import React, { useEffect, useState } from 'react';
import { sosAPI } from '../services/api';

const STATUS_COLORS = {
  active:    { bg:'rgba(255,45,45,0.12)',   color:'var(--red)',   label:'🔴 Active'    },
  resolved:  { bg:'rgba(42,232,122,0.12)',  color:'var(--safe)',  label:'✅ Resolved'  },
  cancelled: { bg:'rgba(122,120,144,0.12)', color:'var(--muted)', label:'⚪ Cancelled' },
  escalated: { bg:'rgba(255,184,48,0.12)',  color:'var(--amber)', label:'⚠️ Escalated' },
};

const TRIGGER_ICONS = { button:'🔴', voice:'🎙️', shake:'📳', silent:'🔇', test:'🧪' };

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    sosAPI.getHistory()
      .then(({ data }) => setHistory(data.history))
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d) => new Date(d).toLocaleString('en-IN', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit',
  });

  const duration = (sos) => {
    if (!sos.resolvedAt) return null;
    const ms = new Date(sos.resolvedAt) - new Date(sos.createdAt);
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="page-content fade-in">
      <div style={{ padding:'28px 20px 20px' }}>
        <h2 style={{ fontSize:22, fontWeight:800 }}>Alert History</h2>
        <p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>
          Your past SOS alerts and their outcomes
        </p>
      </div>

      {error && (
        <div style={{ margin:'0 20px 16px', padding:'12px 16px',
          background:'rgba(255,45,45,0.1)', border:'1px solid rgba(255,45,45,0.3)',
          borderRadius:12, color:'var(--red)', fontSize:14 }}>
          {error}
        </div>
      )}

      <div style={{ padding:'0 20px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:48 }}>
            <div className="spinner" style={{ margin:'0 auto' }}/>
          </div>
        ) : history.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'36px 20px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>No alerts yet</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>
              Your SOS alert history will appear here.
            </div>
          </div>
        ) : (
          history.map((sos) => {
            const s = STATUS_COLORS[sos.status] || STATUS_COLORS.resolved;
            const d = duration(sos);
            return (
              <div key={sos._id} className="card" style={{ marginBottom:12 }}>
                {/* Top row */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>{TRIGGER_ICONS[sos.triggerMethod] || '🔴'}</span>
                    <span style={{ fontSize:14, fontWeight:600, textTransform:'capitalize' }}>
                      {sos.triggerMethod} trigger
                    </span>
                  </div>
                  <span style={{
                    fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                    background:s.bg, color:s.color,
                  }}>{s.label}</span>
                </div>

                {/* Time */}
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>
                  🕐 {fmt(sos.createdAt)}
                  {d && <span style={{ marginLeft:8, color:'var(--muted)' }}>· Duration: {d}</span>}
                </div>

                {/* Location */}
                {sos.location?.coordinates && (
                  <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>
                    📍{' '}
                    <a
                      href={`https://maps.google.com/?q=${sos.location.coordinates[1]},${sos.location.coordinates[0]}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color:'var(--blue)', textDecoration:'none' }}
                    >
                      View on map
                    </a>
                    {sos.location.address && ` · ${sos.location.address}`}
                  </div>
                )}

                {/* Stats */}
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  {sos.notifiedContacts?.length > 0 && (
                    <span style={{ fontSize:11, color:'var(--muted)' }}>
                      👥 {sos.notifiedContacts.length} contact{sos.notifiedContacts.length !== 1 ? 's' : ''} notified
                    </span>
                  )}
                  {sos.policeNotified && (
                    <span style={{ fontSize:11, color:'var(--amber)' }}>👮 Police notified</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
