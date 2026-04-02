import React, { useEffect, useState } from 'react';
import { contactsAPI } from '../services/api';
import ContactCard     from '../components/ContactCard';

const EMPTY_FORM = { name:'', phone:'', email:'', relationship:'', priority:1, notifyBySMS:true, notifyByCall:true, notifyByPush:false };

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await contactsAPI.getAll(); setContacts(data.contacts); }
    catch { setError('Failed to load contacts.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({
    ...f,
    [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (c) => {
    setEditing(c._id);
    setForm({ name:c.name, phone:c.phone, email:c.email||'', relationship:c.relationship||'',
              priority:c.priority, notifyBySMS:c.notifyBySMS, notifyByCall:c.notifyByCall, notifyByPush:c.notifyByPush });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError('Name and phone are required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) await contactsAPI.update(editing, form);
      else         await contactsAPI.add(form);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save contact.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this contact?')) return;
    try { await contactsAPI.delete(id); await load(); }
    catch { setError('Failed to delete contact.'); }
  };

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ padding:'28px 20px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800 }}>Trusted Contacts</h2>
          <p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>
            These people get called & texted when you trigger SOS
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ padding:'10px 18px', fontSize:13 }}>
          + Add
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin:'0 20px 16px', padding:'12px 16px', background:'rgba(255,45,45,0.1)',
          border:'1px solid rgba(255,45,45,0.3)', borderRadius:12, color:'var(--red)', fontSize:14 }}>
          {error}
        </div>
      )}

      {/* Contact list */}
      <div style={{ padding:'0 20px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }}/></div>
        ) : contacts.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'32px 20px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
            <div style={{ fontWeight:600, marginBottom:8 }}>No contacts yet</div>
            <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
              Add Priya (Mom) and Rani (Sister) so they receive<br/>calls, SMS and live location when you need help.
            </div>
          </div>
        ) : (
          contacts.map((c, i) => (
            <ContactCard key={c._id} contact={c} index={i} onEdit={openEdit} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200,
          display:'flex', alignItems:'flex-end', justifyContent:'center',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{
            width:'100%', maxWidth:430,
            background:'var(--surface)', borderRadius:'20px 20px 0 0',
            padding:'24px 20px 40px',
            animation:'slide-up 0.3s ease',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700 }}>{editing ? 'Edit Contact' : 'Add Contact'}</h3>
              <button onClick={() => setShowForm(false)}
                style={{ background:'none', border:'none', color:'var(--muted)', fontSize:22, cursor:'pointer' }}>✕</button>
            </div>

            {error && (
              <div style={{ padding:'10px 14px', background:'rgba(255,45,45,0.1)',
                border:'1px solid rgba(255,45,45,0.3)', borderRadius:10, color:'var(--red)', fontSize:13, marginBottom:14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              {[
                { k:'name',         label:'Full Name *',   type:'text',  ph:'Priya Sharma'    },
                { k:'phone',        label:'Phone Number *', type:'tel',  ph:'+91 9876543210'  },
                { k:'relationship', label:'Relationship',   type:'text',  ph:'Mom, Sister...'  },
                { k:'email',        label:'Email',          type:'email', ph:'priya@email.com' },
              ].map(({ k, label, type, ph }) => (
                <div key={k} className="input-group">
                  <label className="input-label">{label}</label>
                  <input className="input" type={type} placeholder={ph} value={form[k]} onChange={set(k)} />
                </div>
              ))}

              <div className="input-group">
                <label className="input-label">Priority (1 = first to be called)</label>
                <input className="input" type="number" min="1" max="10" value={form.priority} onChange={set('priority')} />
              </div>

              <div style={{ marginBottom:20 }}>
                <label className="input-label">Notify by</label>
                {[
                  { k:'notifyBySMS',  label:'SMS' },
                  { k:'notifyByCall', label:'Phone Call' },
                  { k:'notifyByPush', label:'Push Notification' },
                ].map(({ k, label }) => (
                  <label key={k} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, cursor:'pointer' }}>
                    <input type="checkbox" checked={form[k]} onChange={set(k)} style={{ width:18, height:18, accentColor:'var(--red)' }} />
                    <span style={{ fontSize:14 }}>{label}</span>
                  </label>
                ))}
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                {saving ? <span className="spinner" style={{width:20,height:20,borderWidth:2}}/> : editing ? 'Save Changes' : 'Add Contact'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>
    </div>
  );
}
