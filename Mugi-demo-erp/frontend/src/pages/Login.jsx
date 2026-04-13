import React, { useState } from 'react';

/**
 * Enhanced Login Page
 * Connected to real Backend API for authentication.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/";
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%)',
    fontFamily: "'Inter', sans-serif",
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
  };

  const cardStyle = {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(16px)',
    padding: '48px 40px',
    borderRadius: '28px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '1rem',
    marginBottom: '20px',
    outline: 'none'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
          borderRadius: '18px', 
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '2rem',
          fontWeight: '800'
        }}>M</div>
        
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Mugi ERP</h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Welcome back! Log in to your account.</p>

        {error && <div style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', marginLeft: '4px' }}>Email Address</label>
          <input 
            type="email" 
            placeholder="admin@mugi.com" 
            style={inputStyle}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', marginLeft: '4px' }}>Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            style={inputStyle}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button 
          onClick={login} 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: '14px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
            color: '#fff',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
          }}
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}

