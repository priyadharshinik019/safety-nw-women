import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 24px' }}>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{
          width:70, height:70, background:'var(--red)',
          borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:36, margin:'0 auto 16px',
          boxShadow:'0 0 40px rgba(255,45,45,0.4)',
        }}>🛡️</div>
        <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>SafeNet</h1>
        <p style={{ color:'var(--muted)', fontSize:14, marginTop:4 }}>Smart Safety Network</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background:'rgba(255,45,45,0.1)', border:'1px solid rgba(255,45,45,0.3)',
            borderRadius:12, padding:'12px 16px', marginBottom:20,
            color:'var(--red)', fontSize:14,
          }}>{error}</div>
        )}

        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? <span className="spinner" style={{width:20,height:20,borderWidth:2}}/> : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign:'center', marginTop:24, color:'var(--muted)', fontSize:14 }}>
        New to SafeNet?{' '}
        <Link to="/register" style={{ color:'var(--red)', fontWeight:600, textDecoration:'none' }}>
          Create account
        </Link>
      </p>
    </div>
  );
}
