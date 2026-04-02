import React, { useState, useEffect, useRef } from 'react';
import { useSOS } from '../context/SOSContext';

const COUNTDOWN = 5;

export default function SOSButton() {
  const { triggerSOS, resolveSOS, activeSOS, loading } = useSOS();
  const [phase,   setPhase]   = useState('idle');   // idle | countdown | active | resolving
  const [count,   setCount]   = useState(COUNTDOWN);
  const [elapsed, setElapsed] = useState(0);
  const timerRef  = useRef(null);
  const elapsedRef = useRef(null);

  // Sync with activeSOS from context
  useEffect(() => {
    if (activeSOS && phase === 'idle') {
      setPhase('active');
      startElapsed();
    }
    if (!activeSOS && phase === 'active') {
      setPhase('idle');
      stopElapsed();
    }
  }, [activeSOS]);

  const startElapsed = () => {
    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const stopElapsed = () => {
    clearInterval(elapsedRef.current);
    setElapsed(0);
  };

  const handlePress = () => {
    if (loading || phase === 'resolving') return;
    if (phase === 'active') {
      handleResolve();
      return;
    }
    if (phase === 'countdown') {
      clearInterval(timerRef.current);
      setPhase('idle');
      setCount(COUNTDOWN);
      return;
    }
    // Start countdown
    setPhase('countdown');
    setCount(COUNTDOWN);
    let c = COUNTDOWN;
    timerRef.current = setInterval(async () => {
      c -= 1;
      setCount(c);
      if (c <= 0) {
        clearInterval(timerRef.current);
        setPhase('active');
        startElapsed();
        try { await triggerSOS('button'); }
        catch { setPhase('idle'); stopElapsed(); }
      }
    }, 1000);
  };

  const handleResolve = async () => {
    setPhase('resolving');
    stopElapsed();
    await resolveSOS();
    setPhase('idle');
  };

  const fmtElapsed = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 20px 16px' }}>

      {/* Outer ring + button */}
      <div style={{
        width: 210, height: 210,
        borderRadius: '50%',
        background: phase === 'active'
          ? 'radial-gradient(circle, rgba(255,45,45,0.2) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(255,45,45,0.1) 0%, transparent 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        animation: phase === 'active' ? 'sos-pulse 1.5s ease-in-out infinite' : phase === 'countdown' ? 'sos-breathe 1s ease-in-out infinite' : 'sos-breathe 3s ease-in-out infinite',
      }}>

        {/* Spinning ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: phase === 'active'
            ? 'conic-gradient(#FF2D2D 0deg, transparent 60deg, transparent 300deg, #FF2D2D 360deg)'
            : 'conic-gradient(rgba(255,45,45,0.4) 0deg, transparent 60deg, transparent 300deg, rgba(255,45,45,0.4) 360deg)',
          animation: 'spin-ring 3s linear infinite',
          opacity: phase === 'idle' ? 0.3 : 0.8,
        }}/>
        <div style={{ position:'absolute', inset:2, borderRadius:'50%', background:'#0A0A0F' }}/>

        {/* Main clickable circle */}
        <button
          onClick={handlePress}
          disabled={loading}
          style={{
            width: 168, height: 168,
            borderRadius: '50%',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            position: 'relative', zIndex: 1,
            background: phase === 'active'
              ? 'linear-gradient(145deg, #FF4444, #C41A1A)'
              : phase === 'countdown'
              ? 'linear-gradient(145deg, #FF6600, #CC4400)'
              : 'linear-gradient(145deg, #FF2D2D, #C41A1A)',
            boxShadow: phase === 'active'
              ? '0 0 60px rgba(255,45,45,0.7), 0 0 120px rgba(255,45,45,0.3), inset 0 2px 4px rgba(255,255,255,0.15)'
              : '0 0 40px rgba(255,45,45,0.45), inset 0 2px 4px rgba(255,255,255,0.15)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.1s, box-shadow 0.2s',
            userSelect: 'none',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e)   => e.currentTarget.style.transform = 'scale(1)'}
          onTouchStart={(e)=> e.currentTarget.style.transform = 'scale(0.95)'}
          onTouchEnd={(e)  => e.currentTarget.style.transform = 'scale(1)'}
        >
          {loading ? (
            <div className="spinner" style={{ borderTopColor:'#fff', width:32, height:32 }}/>
          ) : phase === 'countdown' ? (
            <>
              <span style={{ fontSize:56, fontWeight:800, color:'#fff', lineHeight:1 }}>{count}</span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', letterSpacing:2, marginTop:4 }}>TAP TO CANCEL</span>
            </>
          ) : phase === 'active' ? (
            <>
              <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>🔴 LIVE</span>
              <span style={{ fontSize:24, fontWeight:800, color:'#fff', lineHeight:1.2 }}>{fmtElapsed(elapsed)}</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.7)', letterSpacing:2, marginTop:4 }}>TAP — I'M SAFE</span>
            </>
          ) : (
            <>
              <span style={{ fontSize:46, fontWeight:800, color:'#fff', letterSpacing:-1, lineHeight:1 }}>SOS</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.65)', letterSpacing:2, marginTop:6 }}>HOLD TO SEND</span>
            </>
          )}
        </button>
      </div>

      {/* Hint text */}
      <p style={{ marginTop:18, fontSize:13, color:'var(--muted)', textAlign:'center', lineHeight:1.6 }}>
        {phase === 'idle'      && <>Tap to start a <strong style={{color:'var(--text)'}}>5-second</strong> countdown · Say <strong style={{color:'var(--text)'}}>"Help me"</strong> to skip</>}
        {phase === 'countdown' && <span style={{ color:'var(--amber)', fontWeight:600 }}>Sending alert in {count}s... Tap to cancel</span>}
        {phase === 'active'    && <span style={{ color:'var(--safe)', fontWeight:600 }}>🛡 Alert is live — contacts notified</span>}
        {phase === 'resolving' && <span style={{ color:'var(--muted)' }}>Marking you as safe...</span>}
      </p>

      <style>{`
        @keyframes sos-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes sos-pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes spin-ring   { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
