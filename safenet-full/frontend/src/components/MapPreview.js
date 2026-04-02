import React, { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

export default function MapPreview({ sos, volunteerCount = 0 }) {
  const canvasRef = useRef(null);
  const posRef    = useRef(sos?.location?.coordinates || null);

  // Update position from Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !sos?._id) return;

    const handler = ({ coordinates }) => {
      posRef.current = coordinates;
      drawMap();
    };
    socket.on('location:updated', handler);
    return () => socket.off('location:updated', handler);
  }, [sos?._id]);

  useEffect(() => { drawMap(); }, [sos]);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width: W, height: H } = canvas;

    // Background
    ctx.fillStyle = '#12121A';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(77,159,255,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Simulated roads
    ctx.strokeStyle = 'rgba(77,159,255,0.13)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    [[0, H*0.35, W, H*0.35], [0, H*0.7, W, H*0.7], [W*0.25, 0, W*0.25, H], [W*0.65, 0, W*0.65, H]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });

    // Volunteer dots
    const volunteerPositions = [
      [W*0.2, H*0.25], [W*0.75, H*0.55], [W*0.55, H*0.2],
    ].slice(0, volunteerCount || 3);
    volunteerPositions.forEach(([vx, vy]) => {
      ctx.beginPath();
      ctx.arc(vx, vy, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(42,232,122,0.2)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(vx, vy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2AE87A';
      ctx.fill();
    });

    // User pulse ring
    const cx = W / 2, cy = H / 2;
    const t = (Date.now() % 2000) / 2000;
    const pr = 20 + 30 * t;
    const palpha = 0.6 * (1 - t);
    ctx.beginPath();
    ctx.arc(cx, cy, pr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,45,45,${palpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // User dot
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,45,45,0.25)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FF2D2D'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();

    // Coordinate display if real GPS
    const pos = posRef.current;
    if (pos) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.fillText(`${pos[1].toFixed(5)}, ${pos[0].toFixed(5)}`, 8, H - 8);
    }
  };

  // Animate the pulse ring
  useEffect(() => {
    const id = setInterval(drawMap, 50);
    return () => clearInterval(id);
  }, [volunteerCount, sos]);

  return (
    <div style={{ margin:'0 20px 24px', borderRadius:20, overflow:'hidden', border:'1px solid var(--border)', position:'relative' }}>
      <canvas
        ref={canvasRef}
        width={390}
        height={160}
        style={{ width:'100%', height:160, display:'block' }}
      />
      {/* Overlay stats */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        background:'linear-gradient(transparent, rgba(18,18,26,0.95))',
        padding:'24px 16px 12px',
        display:'flex', justifyContent:'space-between',
      }}>
        <span style={{ fontSize:12, color:'var(--muted)' }}>
          <strong style={{ color:'var(--safe)' }}>{volunteerCount || 3}</strong> helpers nearby
        </span>
        <span style={{ fontSize:12, color:'var(--muted)' }}>
          {sos ? <span style={{ color:'var(--red)' }}>🔴 Live tracking</span> : 'GPS ready'}
        </span>
      </div>
    </div>
  );
}
