import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Globe, Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      navigate('/');
    } catch (err) {
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
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
        {/* Animated Background Elements */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: '#6366f1', filter: 'blur(120px)', opacity: 0.1 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: '#a855f7', filter: 'blur(120px)', opacity: 0.1 }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
            <div style={{ width: '48px', height: '48px', background: '#6366f1', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Zap color="white" fill="white" size={24} />
            </div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.75rem', fontWeight: '800' }}>Zen Finance</h2>
          </div>
          
          <h1 style={{ color: 'white', fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.1, maxWidth: '500px', marginBottom: '24px' }}>
            Enterprise <span style={{ color: '#818cf8' }}>Resource</span> Planning Redefined.
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '400px', lineHeight: 1.6 }}>
            The all-in-one suite for modern businesses to automate procurement, finance, and human operations with pixel-perfect precision.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
              <ShieldCheck size={18} /> Bank-Grade Security
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
              <Globe size={18} /> Multi-Entity Support
           </div>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div style={{ 
        width: '580px', 
        background: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '40px' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Welcome Back</h2>
             <p style={{ color: '#64748b', fontWeight: '500' }}>Sign in to your enterprise workstation.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>WORK EMAIL</label>
              <div style={inputContainer}>
                <Mail style={iconStyle} size={20} />
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  style={inputStyle} 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={labelStyle}>PASSWORD</label>
                <a href="#" style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '700' }}>Forgot password?</a>
              </div>
              <div style={inputContainer}>
                <Lock style={iconStyle} size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  style={inputStyle} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
               <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
               <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Remember this device for 30 days</span>
            </div>

            <button type="submit" style={btnStyle}>
              Enter Workstation <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ marginTop: '60px', textAlign: 'center' }}>
             <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
               ZEN FINANCE ERP v5.0.4 • © 2026 MUGI ERP SYSTEMS
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' };
const inputContainer = { position: 'relative' };
const iconStyle = { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };
const inputStyle = { 
  width: '100%', 
  padding: '16px 16px 16px 52px', 
  borderRadius: '14px', 
  border: '2px solid #f1f5f9', 
  background: '#f8fafc',
  fontSize: '1rem',
  fontWeight: '500',
  outline: 'none',
  transition: 'all 0.2s'
};
const btnStyle = {
  width: '100%',
  padding: '18px',
  background: '#1e293b',
  color: 'white',
  border: 'none',
  borderRadius: '16px',
  fontSize: '1rem',
  fontWeight: '800',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
};
