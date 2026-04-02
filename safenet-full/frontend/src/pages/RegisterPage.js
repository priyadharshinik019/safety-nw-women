import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form,    setForm]    = useState({ name:'', email:'', phone:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key:'name',     label:'Full Name',     type:'text',     placeholder:'Priya Sharma'       },
    { key:'email',    label:'Email',         type:'email',    placeholder:'priya@example.com'  },
    { key:'phone',    label:'Phone Number',  type:'tel',      placeholder:'+91 9876543210'     },
    { key:'password', label:'Password',      type:'password', placeholder:'Min. 8 characters'  },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 24px' }}>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{
          width:64, height:64, background:'var(--red)', borderRadius:18,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:32, margin:'0 auto 14px',
          boxShadow:'0 0 30px rgba(255,45,45,0.35)',
        }}>🛡️</div>
        <h1 style={{ fontSize:24, fontWeight:800 }}>Create Account</h1>
        <p style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>Stay safe with SafeNet</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background:'rgba(255,45,45,0.1)', border:'1px solid rgba(255,45,45,0.3)',
            borderRadius:12, padding:'12px 16px', marginBottom:16,
            color:'var(--red)', fontSize:14,
          }}>{error}</div>
        )}

        {fields.map(({ key, label, type, placeholder }) => (
          <div key={key} className="input-group">
            <label className="input-label">{label}</label>
            <input
              className="input"
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={set(key)}
              required
            />
          </div>
        ))}

        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop:4 }}>
          {loading ? <span className="spinner" style={{width:20,height:20,borderWidth:2}}/> : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign:'center', marginTop:20, color:'var(--muted)', fontSize:14 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color:'var(--red)', fontWeight:600, textDecoration:'none' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
