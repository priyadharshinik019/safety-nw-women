import React, { useEffect, useRef, useState } from 'react';
import { useSOS } from '../context/SOSContext';

const TRIGGER_PHRASES = ['help me', 'help', 'emergency', 'danger', 'sos'];

export default function VoiceActivation() {
  const { triggerSOS, activeSOS } = useSOS();
  const [listening,  setListening]  = useState(false);
  const [supported,  setSupported]  = useState(true);
  const [lastHeard,  setLastHeard]  = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous   = true;
    recognition.interimResults = true;
    recognition.lang         = 'en-IN';
    recognitionRef.current   = recognition;

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript.toLowerCase().trim();
        setLastHeard(transcript);
        if (TRIGGER_PHRASES.some((p) => transcript.includes(p))) {
          if (!activeSOS) {
            triggerSOS('voice').catch(() => {});
          }
        }
      }
    };

    recognition.onend   = () => { if (listening) recognition.start(); };
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') setListening(false);
    };

    return () => { recognition.stop(); };
  }, []);

  const toggle = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); setListening(false); }
    else           { rec.start(); setListening(true);  }
  };

  if (!supported) return null;

  return (
    <div
      className="card"
      style={{ margin:'0 20px 16px', display:'flex', alignItems:'center', gap:14,
               borderColor: listening ? 'rgba(155,109,255,0.35)' : 'var(--border)',
               cursor:'pointer' }}
      onClick={toggle}
    >
      <span style={{ fontSize:22 }}>🎙️</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>
          Voice Activation — {listening ? 'Listening' : 'Off'}
        </div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>
          {listening
            ? lastHeard ? `Heard: "${lastHeard}"` : 'Say "Help me" to trigger SOS instantly'
            : 'Tap to enable voice SOS trigger'}
        </div>
      </div>
      {listening && (
        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
          {[8,16,12,20,10].map((h, i) => (
            <div key={i} style={{
              width:3, height:h,
              background:'var(--purple)',
              borderRadius:2,
              animation:`wave ${0.8 + i*0.1}s ease-in-out infinite alternate`,
              animationDelay:`${i*0.1}s`,
            }}/>
          ))}
        </div>
      )}
      <style>{`@keyframes wave { from{transform:scaleY(0.4);opacity:0.5} to{transform:scaleY(1);opacity:1} }`}</style>
    </div>
  );
}
