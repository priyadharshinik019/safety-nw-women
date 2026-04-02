import React, { useEffect, useState } from 'react';
import { useAuth }          from '../context/AuthContext';
import { useSOS }           from '../context/SOSContext';
import { contactsAPI }      from '../services/api';
import SOSButton            from '../components/SOSButton';
import MapPreview           from '../components/MapPreview';
import VoiceActivation      from '../components/VoiceActivation';
import ToastContainer       from '../components/Toast';

export default function HomePage() {
  const { user }                      = useAuth();
  const { activeSOS }                 = useSOS();
  const [contacts, setContacts]       = useState([]);
  const [volunteerCount]              = useState(3);

  useEffect(() => {
    contactsAPI.getAll().then(({ data }) => setContacts(data.contacts)).catch(() => {});
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-content fade-in">
      <ToastContainer />

      {/* Header */}
      <div style={{ padding:'28px 20px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:38, height:38, background:'var(--red)', borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, boxShadow:'0 0 16px rgba(255,45,45,0.4)',
          }}>🛡️</div>
          <div>
            <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:0.5 }}>{greeting}</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{user?.name?.split(' ')[0]}</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:6,
          background: activeSOS ? 'rgba(255,45,45,0.12)' : 'rgba(42,232,122,0.1)',
          border:`1px solid ${activeSOS ? 'rgba(255,45,45,0.3)' : 'rgba(42,232,122,0.25)'}`,
          borderRadius:20, padding:'5px 12px' }}>
          <div className={`dot-pulse ${activeSOS ? 'dot-red' : 'dot-safe'}`}/>
          <span style={{ fontSize:12, fontWeight:600, color: activeSOS ? 'var(--red)' : 'var(--safe)' }}>
            {activeSOS ? 'ALERT ACTIVE' : 'Protected'}
          </span>
        </div>
      </div>

      {/* Active SOS Banner */}
      {activeSOS && (
        <div style={{
          margin:'0 20px 16px',
          background:'rgba(255,45,45,0.1)', border:'1px solid rgba(255,45,45,0.35)',
          borderRadius:16, padding:'14px 18px',
          animation:'fade-in 0.3s ease',
        }}>
          <div style={{ fontWeight:700, color:'var(--red)', marginBottom:4 }}>🚨 SOS Alert Active</div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>
            {activeSOS.notifiedContacts?.length || 0} contacts notified ·{' '}
            {activeSOS.notifiedVolunteers?.length || 0} volunteers alerted ·{' '}
            Live GPS streaming
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="card" style={{ margin:'0 20px 20px', display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontSize:28 }}>📍</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>
            Current Status
          </div>
          <div style={{ fontWeight:700, fontSize:16, color: activeSOS ? 'var(--red)' : 'var(--safe)' }}>
            {activeSOS ? 'SOS Alert is Live' : 'You are safe'}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
            GPS active · {contacts.length} contact{contacts.length !== 1 ? 's' : ''} watching · {volunteerCount} helpers nearby
          </div>
        </div>
      </div>

      {/* SOS Button */}
      <SOSButton />

      {/* Voice Activation */}
      <VoiceActivation />

      {/* Quick Actions */}
      <div style={{ padding:'0 20px', marginBottom:24 }}>
        <div className="section-title">Quick Actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { icon:'🚨', title:'Silent Alert', desc:'SOS without screen light or sound', color:'var(--red)'    },
            { icon:'📡', title:'Share Location', desc:'Start live GPS tracking session',  color:'var(--blue)'   },
            { icon:'👮', title:'Call Police',    desc:'Direct line with your coordinates', color:'var(--amber)'  },
            { icon:'🤝', title:'Find Helper',    desc:`${volunteerCount} volunteers within 500m`, color:'var(--purple)' },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} className="card" style={{ cursor:'pointer', position:'relative', overflow:'hidden',
              transition:'border-color 0.2s, transform 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color }}/>
              <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{title}</div>
              <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
       {[
  { icon:'🚨', title:'Silent Alert',   desc:'SOS without screen light or sound', color:'var(--red)',    onClick: () => {} },
  { icon:'📡', title:'Share Location', desc:'Start live GPS tracking session',   color:'var(--blue)',   onClick: () => {} },
  { icon:'👮', title:'Call Police',    desc:'Direct line with your coordinates', color:'var(--amber)',  onClick: () => window.open('tel:100') },
  { icon:'📞', title:'Fake Call',      desc:'Pretend your phone is ringing',     color:'var(--purple)', onClick: () => window.location.href='/fake-call' },
].map(({ icon, title, desc, color, onClick }) => (
  <div key={title} className="card" style={{ cursor:'pointer', position:'relative', overflow:'hidden',
    transition:'border-color 0.2s, transform 0.15s' }}
    onClick={onClick}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color }}/>
    <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>
    <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{title}</div>
    <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.4 }}>{desc}</div>
  </div>
))}
      <div style={{ padding:'0 0', marginBottom:4 }}>
        <div className="section-title" style={{ padding:'0 20px' }}>Live Map</div>
        <MapPreview sos={activeSOS} volunteerCount={volunteerCount} />
      </div>

      {/* Trusted Contacts preview */}
      {contacts.length > 0 && (
        <div style={{ padding:'0 20px', marginBottom:20 }}>
          <div className="section-title">Trusted Contacts</div>
          {contacts.slice(0, 3).map((c, i) => (
            <div key={c._id} className="card" style={{ marginBottom:8, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                width:40, height:40, borderRadius:'50%',
                background:'rgba(155,109,255,0.12)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, position:'relative', flexShrink:0,
              }}>
                {['👩','👧','👮'][i] || '👤'}
                <div style={{ position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'50%',
                  background:'var(--safe)', border:'2px solid var(--surface)' }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{c.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>
                  {c.relationship} · {c.phone}
                </div>
              </div>
              <span className="badge badge-red">#{c.priority}</span>
            </div>
          ))}
        </div>
      )}

      {contacts.length === 0 && (
        <div className="card" style={{ margin:'0 20px 20px', textAlign:'center', padding:'24px 20px' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>👥</div>
          <div style={{ fontWeight:600, marginBottom:6 }}>No trusted contacts yet</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>
            Add Priya (Mom), Rani (Sister) and others so they get notified in emergencies.
          </div>
          <a href="/contacts" className="btn btn-primary" style={{ fontSize:13, padding:'10px 20px' }}>
            Add Contacts
          </a>
        </div>
      )}
    </div>
  );
}
