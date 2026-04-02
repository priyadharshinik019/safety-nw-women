import React, { useState } from 'react';
import { useAuth }    from '../context/AuthContext';
import { authAPI }    from '../services/api';
import { volunteerAPI } from '../services/api';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [settings, setSettings]      = useState(user?.settings || {});
  const [saving,   setSaving]        = useState(false);
  const [msg,      setMsg]           = useState('');
  const [isVol,    setIsVol]         = useState(user?.isVolunteer || false);

  const toggleSetting = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await authAPI.updateSettings({ [key]: updated[key] });
      updateUser({ settings: updated });
      setMsg('Settings saved.');
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('Failed to save.'); }
  };

  const handleVolunteer = async () => {
    setSaving(true);
    try {
      if (isVol) { await volunteerAPI.unregister(); setIsVol(false); }
      else       { await volunteerAPI.register();   setIsVol(true);  }
      updateUser({ isVolunteer: !isVol });
      setMsg(isVol ? 'Volunteer status removed.' : 'You are now a SafeNet volunteer! 🤝');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to update volunteer status.'); }
    finally { setSaving(false); }
  };

  const Row = ({ icon, label, desc, settingKey }) => (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0',
      borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600 }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{desc}</div>}
      </div>
      <label style={{ position:'relative', width:44, height:24, cursor:'pointer', flexShrink:0 }}>
        <input type="checkbox" checked={!!settings[settingKey]}
          onChange={() => toggleSetting(settingKey)}
          style={{ opacity:0, width:0, height:0 }} />
        <span style={{
          position:'absolute', inset:0, borderRadius:12,
          background: settings[settingKey] ? 'var(--red)' : 'var(--surface2)',
          border:'1px solid var(--border)',
          transition:'background 0.2s',
        }}>
          <span style={{
            position:'absolute', top:2, left: settings[settingKey] ? 22 : 2,
            width:18, height:18, borderRadius:'50%',
            background:'#fff', transition:'left 0.2s',
          }}/>
        </span>
      </label>
    </div>
  );

  return (
    <div className="page-content fade-in">
      <div style={{ padding:'28px 20px 20px' }}>
        <h2 style={{ fontSize:22, fontWeight:800 }}>Settings</h2>
      </div>

      {msg && (
        <div style={{ margin:'0 20px 16px', padding:'12px 16px',
          background:'rgba(42,232,122,0.1)', border:'1px solid rgba(42,232,122,0.3)',
          borderRadius:12, color:'var(--safe)', fontSize:14 }}>
          {msg}
        </div>
      )}

      {/* Profile */}
      <div style={{ padding:'0 20px', marginBottom:24 }}>
        <div className="section-title">Profile</div>
        <div className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(255,45,45,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
            👩
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:16 }}>{user?.name}</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>{user?.email}</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>{user?.phone}</div>
          </div>
        </div>
      </div>

      {/* SOS Settings */}
      <div style={{ padding:'0 20px', marginBottom:24 }}>
        <div className="section-title">SOS Settings</div>
        <div className="card" style={{ padding:'0 16px' }}>
          <Row icon="🎙️" label="Voice Activation"     desc='Say "Help me" to trigger SOS'       settingKey="voiceActivation"  />
          <Row icon="📳" label="Shake to Trigger"      desc="Shake phone 3x to send SOS"          settingKey="shakeActivation"  />
          <Row icon="👮" label="Auto-call Police"       desc="Notify police if SOS not resolved"   settingKey="autoCallPolice"   />
        </div>
      </div>

      {/* Volunteer */}
      <div style={{ padding:'0 20px', marginBottom:24 }}>
        <div className="section-title">Volunteer Network</div>
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:28 }}>🤝</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>
                {isVol ? 'You are a SafeNet Volunteer' : 'Become a Volunteer'}
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>
                {isVol
                  ? 'You get notified when someone nearby needs help.'
                  : 'Help others in your area during emergencies.'}
              </div>
            </div>
          </div>
          <button
            onClick={handleVolunteer}
            disabled={saving}
            className="btn btn-full"
            style={{ marginTop:16,
              background: isVol ? 'var(--surface2)' : 'rgba(42,232,122,0.15)',
              color: isVol ? 'var(--muted)' : 'var(--safe)',
              border: `1px solid ${isVol ? 'var(--border)' : 'rgba(42,232,122,0.3)'}`,
            }}
          >
            {saving ? <span className="spinner" style={{width:18,height:18,borderWidth:2}}/> :
              isVol ? 'Remove Volunteer Status' : '+ Join Volunteer Network'}
          </button>
        </div>
      </div>

      {/* Escalation delay */}
      <div style={{ padding:'0 20px', marginBottom:24 }}>
        <div className="section-title">Auto-Escalation</div>
        <div className="card">
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12, lineHeight:1.6 }}>
            If your SOS is not resolved within this time, the police will be notified automatically.
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {[1, 2, 5, 10].map((mins) => (
              <button
                key={mins}
                onClick={async () => {
                  const updated = { ...settings, escalationDelayMins: mins };
                  setSettings(updated);
                  await authAPI.updateSettings({ escalationDelayMins: mins });
                  updateUser({ settings: updated });
                }}
                style={{
                  flex:1, padding:'10px 0', borderRadius:10, border:'1px solid',
                  cursor:'pointer', fontWeight:600, fontSize:13,
                  borderColor: settings.escalationDelayMins === mins ? 'var(--red)' : 'var(--border)',
                  background: settings.escalationDelayMins === mins ? 'rgba(255,45,45,0.15)' : 'var(--surface2)',
                  color: settings.escalationDelayMins === mins ? 'var(--red)' : 'var(--muted)',
                }}
              >{mins}m</button>
            ))}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding:'0 20px', marginBottom:40 }}>
        <button className="btn btn-surface btn-full" onClick={logout}>
          Sign Out
        </button>
        <p style={{ textAlign:'center', fontSize:11, color:'var(--muted)', marginTop:16 }}>
          SafeNet v1.0.0 · Built with ❤️ for safety
        </p>
      </div>
    </div>
  );
}
