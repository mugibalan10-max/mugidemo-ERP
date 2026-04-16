import React from 'react';

/**
 * Enterprise Card Component
 */
export const Card = ({ title, subtitle, children, icon, action, footer }) => (
  <div className="card-premium">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {icon && (
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
        )}
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{title}</h3>
          {subtitle && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    {footer && <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>{footer}</div>}
  </div>
);

/**
 * Professional Data Table
 */
export const Table = ({ headers, data, renderRow }) => (
  <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fcfcfd'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {renderRow(item)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Premium Status Badge
 */
export const Badge = ({ children, variant = 'info' }) => {
  const styles = {
    info: { bg: '#eef2ff', text: '#6366f1' },
    success: { bg: '#ecfdf5', text: '#10b981' },
    warning: { bg: '#fffbeb', text: '#f59e0b' },
    danger: { bg: '#fef2f2', text: '#ef4444' }
  }[variant];

  return (
    <span style={{ 
      padding: '4px 10px', 
      borderRadius: '8px', 
      fontSize: '0.75rem', 
      fontWeight: '800', 
      background: styles.bg, 
      color: styles.text,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      whiteSpace: 'nowrap'
    }}>{children}</span>
  );
};

/**
 * Enterprise Form Input
 */
export const Input = ({ label, helper, icon, ...props }) => (
  <div style={{ marginBottom: '20px' }}>
    {label && <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{icon}</div>}
      <input 
        {...props} 
        style={{ 
          width: '100%', 
          padding: icon ? '14px 16px 14px 48px' : '14px 16px', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          fontSize: '1rem', 
          background: '#fff',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }} 
        onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)'; }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
    {helper && <p style={{ marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>{helper}</p>}
  </div>
);

/**
 * Prime Button
 */
export const Button = ({ children, variant = 'primary', icon, loading, ...props }) => {
  const styles = {
    primary: { bg: '#6366f1', text: '#fff' },
    secondary: { bg: '#1e293b', text: '#fff' },
    outline: { bg: 'transparent', text: '#64748b', border: '1px solid #e2e8f0' },
    ghost: { bg: 'transparent', text: '#64748b' }
  }[variant];

  return (
    <button 
      {...props}
      disabled={loading}
      style={{
        padding: '12px 24px',
        borderRadius: '12px',
        background: styles.bg,
        color: styles.text,
        border: styles.border || 'none',
        fontWeight: '700',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        opacity: loading ? 0.7 : 1,
        boxShadow: variant === 'primary' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
      }}
    >
      {icon && !loading && icon}
      {loading ? 'Processing...' : children}
    </button>
  );
};
