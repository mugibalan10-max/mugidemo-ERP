import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Globe, Zap, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      const data = response.data;
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Force a small delay for better UX
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.error || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: 'var(--secondary)',
      fontFamily: "var(--font-main)"
    }}>
      {/* Left Branding Side */}
      <div style={{ 
        flex: 1, 
        padding: '80px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        background: 'radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements - pointerEvents: none to prevent blocking clicks */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: '#a855f7', filter: 'blur(120px)', opacity: 0.1, pointerEvents: 'none' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Zap color="white" fill="white" size={24} />
            </div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.75rem', fontWeight: 'var(--weight-bold)' }}>Mugi ERP</h2>
          </div>
          
          <h1 style={{ color: 'white', fontSize: '3.5rem', fontWeight: 'var(--weight-bold)', lineHeight: 1.1, maxWidth: '500px', marginBottom: '24px', letterSpacing: '-0.02em' }}>
            Enterprise <span style={{ color: 'var(--primary-light)' }}>Resource</span> Planning Redefined.
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '400px', lineHeight: 1.6, fontWeight: 'var(--weight-medium)' }}>
            The all-in-one suite for modern businesses to automate procurement, accounting, and human operations with pixel-perfect precision.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: 'var(--weight-semibold)' }}>
              <ShieldCheck size={18} /> Bank-Grade Security
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: 'var(--weight-semibold)' }}>
              <Globe size={18} /> Multi-Entity Support
           </div>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div style={{ 
        width: '580px', 
        background: 'var(--bg-card)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '40px' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 'var(--weight-bold)', color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.01em' }}>Welcome Back</h2>
             <p style={{ color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' }}>Sign in to your enterprise workstation.</p>
          </div>

          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: '#fef2f2', 
              border: '1px solid #fee2e2', 
              borderRadius: '12px', 
              color: 'var(--danger)', 
              fontSize: '0.85rem', 
              fontWeight: 'var(--weight-semibold)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label htmlFor="email" style={labelStyle}>WORK EMAIL</label>
              <div style={inputContainer}>
                <Mail style={iconStyle} size={20} />
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  placeholder="name@company.com" 
                  style={inputStyle} 
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label htmlFor="password" style={labelStyle}>PASSWORD</label>
                <a href="#" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'var(--weight-bold)' }}>Forgot password?</a>
              </div>
              <div style={inputContainer}>
                <Lock style={iconStyle} size={20} />
                <input 
                  id="password"
                  name="password"
                  type="password" 
                  placeholder="••••••••" 
                  style={inputStyle} 
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
               <input type="checkbox" id="remember" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
               <label htmlFor="remember" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', margin: 0 }}>Remember this device for 30 days</label>
            </div>

            <button type="submit" style={isLoading ? {...btnStyle, opacity: 0.7, cursor: 'not-allowed'} : btnStyle} disabled={isLoading}>
              {isLoading ? (
                <>Authenticating... <Loader2 size={20} className="animate-spin" /></>
              ) : (
                <>Enter Workstation <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: '60px', textAlign: 'center' }}>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'var(--weight-semibold)' }}>
               MUGI ENTERPRISE ERP v5.0.4 • © 2026 MUGI ERP SYSTEMS
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'var(--weight-bold)', color: '#475569', letterSpacing: '0.05em' };
const inputContainer = { position: 'relative' };
const iconStyle = { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' };
const inputStyle = { 
  width: '100%', 
  padding: '16px 16px 16px 52px', 
  borderRadius: '14px', 
  border: '2px solid #f1f5f9', 
  background: '#f8fafc',
  fontSize: '1rem',
  fontWeight: 'var(--weight-medium)',
  outline: 'none',
  transition: 'all 0.2s',
  color: 'var(--text-main)'
};
const btnStyle = {
  width: '100%',
  padding: '18px',
  background: 'var(--secondary)',
  color: 'white',
  border: 'none',
  borderRadius: '16px',
  fontSize: '1rem',
  fontWeight: 'var(--weight-bold)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: 'var(--shadow-md)'
};
