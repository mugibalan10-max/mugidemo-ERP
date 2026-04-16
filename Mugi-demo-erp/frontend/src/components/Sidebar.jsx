import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

/**
 * Sidebar Component for Mugi Demo ERP
 * Features a modern, premium dark-themed design with hover effects and glassmorphism.
 */
export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('role') || 'employee';

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('token'); // Assuming token is also stored
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/', roles: ['admin', 'sales', 'inventory', 'hr', 'employee'] },
    { name: 'Leads', icon: '🎯', path: '/leads', roles: ['admin', 'sales'] },
    { name: 'Customers', icon: '👥', path: '/customers', roles: ['admin', 'sales'] },
    { name: 'Invoice', icon: '📄', path: '/invoices', roles: ['admin', 'sales'] },
    { name: 'Inventory', icon: '📦', path: '/inventory', roles: ['admin', 'inventory'] },
    { name: 'Tally Sync', icon: '🔄', path: '/tally-dashboard', roles: ['admin'] },
    { name: 'Tasks', icon: '📋', path: '/tasks', roles: ['admin', 'employee', 'hr'] },
    { name: 'Employees', icon: '👷', path: '/employees', roles: ['admin', 'hr'] },
    { name: 'Payroll', icon: '🏦', path: '/payroll', roles: ['admin', 'hr'] },
    { name: 'Reports', icon: '📊', path: '/reports', roles: ['admin', 'hr'] },
  ].filter(item => item.roles.includes(userRole));

  const sidebarStyle = {
    width: "240px",
    height: "100vh",
    background: "#0f172a", // Sleek Slate-900 background
    color: "#f8fafc",
    padding: "32px 16px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "4px 0 24px rgba(0, 0, 0, 0.4)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
  };

  const logoStyle = {
    fontSize: "1.25rem",
    fontWeight: "800",
    marginBottom: "48px",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.025em",
  };

  const navItemStyle = {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    marginBottom: "8px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    color: "#94a3b8",
    fontSize: "0.9375rem",
    fontWeight: "500",
    textDecoration: "none",
  };

  const activeItemStyle = {
    ...navItemStyle,
    background: "rgba(99, 102, 241, 0.15)",
    color: "#ffffff",
    boxShadow: "inset 0 0 0 1px rgba(99, 102, 241, 0.2)",
  };

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>
        <div style={{ 
          width: "32px", 
          height: "32px", 
          background: "linear-gradient(135deg, #6366f1 0%, #10b981 100%)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          WebkitTextFillColor: "initial",
          boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)"
        }}>
          Z
        </div>
        Zen Finance
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
          <Link
            key={item.name}
            to={item.path || '#'}
            style={isActive ? activeItemStyle : navItemStyle}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.transform = "translateX(4px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.transform = "translateX(0)";
              }
            }}
          >
            <span style={{ marginRight: "14px", fontSize: "1.25rem", filter: isActive ? "none" : "grayscale(0.2)" }}>
              {item.icon}
            </span>
            {item.name}
          </Link>
        )})}
      </nav>

      {/* User Profile Section at Bottom */}
      <div style={{ 
        marginTop: "auto", 
        padding: "16px 12px", 
        background: "rgba(255, 255, 255, 0.03)", 
        borderRadius: "12px", 
        display: "flex", 
        alignItems: "center", 
        gap: "12px" 
      }}>
        <div style={{ 
          width: "36px", 
          height: "36px", 
          borderRadius: "10px", 
          background: "linear-gradient(45deg, #4f46e5, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "0.8rem"
        }}>
          JD
        </div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            John Doe
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
            Administrator
          </p>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(244, 63, 94, 0.1)";
            e.currentTarget.style.color = "#f43f5e";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#94a3b8";
          }}
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}

