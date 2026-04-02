import React from 'react';

const AVATARS = ['👩','👧','👨','🧑','👵','👴','👩‍⚕️','👮'];

export default function ContactCard({ contact, onEdit, onDelete, index }) {
  const avatar = AVATARS[index % AVATARS.length];

  return (
    <div className="card" style={{ marginBottom:10, display:'flex', alignItems:'center', gap:14 }}>
      {/* Avatar */}
      <div style={{
        width:46, height:46, borderRadius:'50%',
        background:'rgba(155,109,255,0.12)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, flexShrink:0, position:'relative',
      }}>
        {avatar}
        <div style={{
          position:'absolute', bottom:1, right:1,
          width:11, height:11, borderRadius:'50%',
          background:'var(--safe)', border:'2px solid var(--surface)',
        }}/>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:15, marginBottom:2 }}>{contact.name}</div>
        <div style={{ fontSize:12, color:'var(--muted)' }}>
          {contact.relationship && <span>{contact.relationship} · </span>}
          {contact.phone}
        </div>
        <div style={{ display:'flex', gap:6, marginTop:5 }}>
          {contact.notifyBySMS  && <span className="badge badge-safe"  style={{fontSize:10}}>SMS</span>}
          {contact.notifyByCall && <span className="badge badge-red"   style={{fontSize:10}}>📞 Call</span>}
          {contact.notifyByPush && <span className="badge badge-amber" style={{fontSize:10}}>Push</span>}
        </div>
      </div>

      {/* Priority badge */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
        <span className="badge badge-red">#{contact.priority}</span>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => onEdit(contact)} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--muted)', fontSize:15, padding:4,
          }}>✏️</button>
          <button onClick={() => onDelete(contact._id)} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--muted)', fontSize:15, padding:4,
          }}>🗑️</button>
        </div>
      </div>
    </div>
  );
}
