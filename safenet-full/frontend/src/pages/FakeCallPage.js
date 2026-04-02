import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FAKE_CALLERS = [
  { name: 'Priya (Mom)',   number: '+91 95008 38503', avatar: '👩' },
  { name: 'Rani (Sister)', number: '+91 94XXX XXXXX', avatar: '👧' },
  { name: 'Police',        number: '100',             avatar: '👮' },
  { name: 'Doctor',        number: '+91 98XXX XXXXX', avatar: '👨‍⚕️' },
];

export default function FakeCallPage() {
  const navigate    = useNavigate();
  const [step,      setStep]      = useState('setup');   // setup | ringing | active | ended
  const [caller,    setCaller]    = useState(FAKE_CALLERS[0]);
  const [delay,     setDelay]     = useState(5);
  const [duration,  setDuration]  = useState(0);
  const [customName,setCustomName]= useState('');
  const timerRef    = useRef(null);
  const durationRef = useRef(null);
  const audioRef    = useRef(null);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearInterval(durationRef.current);
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const startFakeCall = () => {
    const selected = customName
      ? { name: customName, number: 'Private Number', avatar: '📞' }
      : caller;
    setCaller(selected);
    setStep('ringing');

    // Vibrate phone
    if (navigator.vibrate) {
      navigator.vibrate([500, 300, 500, 300, 500, 300, 500]);
    }

    // Play ringtone using Web Audio API
    playRingtone();

    // Auto-answer after delay
    timerRef.current = setTimeout(() => {
      if (step !== 'ended') answerCall();
    }, delay * 1000 + 30000); // max 30s ringing
  };

  const playRingtone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (time) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 440;
        g.gain.setValueAtTime(0.3, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
        o.start(time);
        o.stop(time + 0.8);
      };
      // Ring pattern: beep beep ... pause ... beep beep
      for (let i = 0; i < 6; i++) {
        playBeep(ctx.currentTime + i * 1.5);
        playBeep(ctx.currentTime + i * 1.5 + 0.9);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const answerCall = () => {
    setStep('active');
    clearTimeout(timerRef.current);
    if (navigator.vibrate) navigator.vibrate(0);
    setDuration(0);
    durationRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const endCall = () => {
    setStep('ended');
    clearInterval(durationRef.current);
    if (navigator.vibrate) navigator.vibrate(0);
    setTimeout(() => setStep('setup'), 2000);
  };

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── SETUP SCREEN ─────────────────────────────────────────────
  if (step === 'setup') return (
    <div style={{ minHeight:'100vh', padding:'28px 20px 100px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <button onClick={() => navigate('/')}
          style={{ background:'none', border:'none', color:'var(--muted)', fontSize:22, cursor:'pointer' }}>
          ←
        </button>
        <h2 style={{ fontSize:22, fontWeight:800 }}>Fake Call</h2>
      </div>

      <div className="card" style={{ marginBottom:16, padding:'16px 20px',
        border:'1px solid rgba(255,184,48,0.3)', background:'rgba(255,184,48,0.05)' }}>
        <div style={{ fontSize:13, color:'var(--amber)', fontWeight:600, marginBottom:4 }}>
          💡 How to use
        </div>
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
          Tap "Start Fake Call" and your phone will ring after the delay.
          Use it to escape uncomfortable or dangerous situations.
        </div>
      </div>

      {/* Choose caller */}
      <div className="section-title" style={{ marginTop:24 }}>Choose Caller</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {FAKE_CALLERS.map((c) => (
          <div key={c.name}
            onClick={() => { setCaller(c); setCustomName(''); }}
            className="card"
            style={{
              cursor:'pointer', textAlign:'center', padding:'14px 10px',
              borderColor: caller.name === c.name && !customName
                ? 'var(--red)' : 'var(--border)',
              background: caller.name === c.name && !customName
                ? 'rgba(255,45,45,0.08)' : 'var(--surface)',
            }}>
            <div style={{ fontSize:28, marginBottom:6 }}>{c.avatar}</div>
            <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>{c.number}</div>
          </div>
        ))}
      </div>

      {/* Custom caller name */}
      <div className="input-group">
        <label className="input-label">Or enter custom caller name</label>
        <input
          className="input"
          placeholder="e.g. Boss, Hospital..."
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
        />
      </div>

      {/* Delay selector */}
      <div style={{ marginBottom:24 }}>
        <label className="input-label">Call arrives in</label>
        <div style={{ display:'flex', gap:8 }}>
          {[3, 5, 10, 15, 30].map((s) => (
            <button key={s} onClick={() => setDelay(s)}
              style={{
                flex:1, padding:'10px 0', borderRadius:10, border:'1px solid',
                cursor:'pointer', fontWeight:600, fontSize:13,
                borderColor: delay === s ? 'var(--red)' : 'var(--border)',
                background: delay === s ? 'rgba(255,45,45,0.15)' : 'var(--surface2)',
                color: delay === s ? 'var(--red)' : 'var(--muted)',
              }}>
              {s}s
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button onClick={startFakeCall} className="btn btn-primary btn-full"
        style={{ fontSize:16, padding:'16px' }}>
        📞 Start Fake Call
      </button>
    </div>
  );

  // ── RINGING SCREEN ────────────────────────────────────────────
  if (step === 'ringing') return (
    <div style={{
      minHeight:'100vh', background:'#1A1A2E',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'space-between',
      padding:'80px 40px 80px',
    }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:12,
          letterSpacing:2, textTransform:'uppercase' }}>
          Incoming Call
        </div>
        <div style={{
          width:110, height:110, borderRadius:'50%',
          background:'rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:56, margin:'0 auto 20px',
          animation:'ring-pulse 1s ease-in-out infinite',
          boxShadow:'0 0 0 0 rgba(255,255,255,0.4)',
        }}>
          {caller.avatar}
        </div>
        <div style={{ fontSize:28, fontWeight:700, color:'#fff', marginBottom:8 }}>
          {caller.name}
        </div>
        <div style={{ fontSize:15, color:'rgba(255,255,255,0.5)' }}>
          {caller.number}
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:8 }}>
          SafeNet Fake Call 🛡️
        </div>
      </div>

      {/* Answer / Decline buttons */}
      <div style={{ display:'flex', justifyContent:'space-around', width:'100%', maxWidth:300 }}>
        {/* Decline */}
        <div style={{ textAlign:'center' }}>
          <button onClick={endCall} style={{
            width:70, height:70, borderRadius:'50%',
            background:'#FF3B30', border:'none', cursor:'pointer',
            fontSize:28, boxShadow:'0 0 20px rgba(255,59,48,0.5)',
          }}>📵</button>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginTop:8 }}>Decline</div>
        </div>

        {/* Answer */}
        <div style={{ textAlign:'center' }}>
          <button onClick={answerCall} style={{
            width:70, height:70, borderRadius:'50%',
            background:'#34C759', border:'none', cursor:'pointer',
            fontSize:28, boxShadow:'0 0 20px rgba(52,199,89,0.5)',
            animation:'answer-pulse 1s ease-in-out infinite',
          }}>📞</button>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginTop:8 }}>Answer</div>
        </div>
      </div>

      <style>{`
        @keyframes ring-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
          50%      { box-shadow: 0 0 0 20px rgba(255,255,255,0); }
        }
        @keyframes answer-pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );

  // ── ACTIVE CALL SCREEN ────────────────────────────────────────
  if (step === 'active') return (
    <div style={{
      minHeight:'100vh', background:'#1A1A2E',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'space-between',
      padding:'80px 40px 80px',
    }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:12,
          letterSpacing:2, textTransform:'uppercase' }}>
          Active Call
        </div>
        <div style={{
          width:110, height:110, borderRadius:'50%',
          background:'rgba(52,199,89,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:56, margin:'0 auto 20px',
          border:'2px solid rgba(52,199,89,0.4)',
        }}>
          {caller.avatar}
        </div>
        <div style={{ fontSize:28, fontWeight:700, color:'#fff', marginBottom:8 }}>
          {caller.name}
        </div>
        <div style={{ fontSize:24, color:'#34C759', fontWeight:600, marginTop:8 }}>
          {fmt(duration)}
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:8 }}>
          Fake call in progress...
        </div>
      </div>

      {/* Fake call controls */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20,
        width:'100%', maxWidth:300, marginBottom:20 }}>
        {[
          { icon:'🔇', label:'Mute'     },
          { icon:'🔊', label:'Speaker'  },
          { icon:'⌨️',  label:'Keypad'  },
        ].map(({ icon, label }) => (
          <div key={label} style={{ textAlign:'center' }}>
            <button style={{
              width:56, height:56, borderRadius:'50%',
              background:'rgba(255,255,255,0.1)',
              border:'none', cursor:'pointer', fontSize:22,
            }}>{icon}</button>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:6 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* End call */}
      <div style={{ textAlign:'center' }}>
        <button onClick={endCall} style={{
          width:70, height:70, borderRadius:'50%',
          background:'#FF3B30', border:'none', cursor:'pointer',
          fontSize:28, boxShadow:'0 0 20px rgba(255,59,48,0.5)',
        }}>📵</button>
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginTop:8 }}>End Call</div>
      </div>
    </div>
  );

  // ── ENDED SCREEN ──────────────────────────────────────────────
  if (step === 'ended') return (
    <div style={{
      minHeight:'100vh', background:'#1A1A2E',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:16,
    }}>
      <div style={{ fontSize:56 }}>📵</div>
      <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Call Ended</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)' }}>
        Duration: {fmt(duration)}
      </div>
    </div>
  );
}