import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  FileText, 
  Package, 
  RefreshCcw, 
  ClipboardCheck, 
  Briefcase, 
  TrendingUp, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Handshake,
  BookOpen,
  PieChart,
  UserCircle
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userRole = localStorage.getItem('role') || 'admin';

  const menuSections = [
    {
      title: "OVERVIEW",
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/', roles: ['admin', 'sales', 'inventory', 'hr', 'employee'] },
      ]
    },
    {
      title: "COMMERCIAL",
      items: [
        { name: 'Leads', icon: <Target size={20} />, path: '/leads', roles: ['admin', 'sales'] },
        { name: 'Customers', icon: <Users size={20} />, path: '/customers', roles: ['admin', 'sales'] },
        { name: 'Invoices', icon: <FileText size={20} />, path: '/invoices', roles: ['admin', 'sales'] },
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { name: 'Inventory', icon: <Package size={20} />, path: '/inventory', roles: ['admin', 'inventory'] },
        { name: 'Vendors', icon: <Handshake size={20} />, path: '/vendors', roles: ['admin', 'inventory'] },
        { name: 'Purchase Orders', icon: <ClipboardCheck size={20} />, path: '/purchase-view', roles: ['admin', 'inventory'] },
        { name: 'Receive Goods', icon: <Package size={20} />, path: '/grn', roles: ['admin', 'inventory'] },
      ]
    },
    {
      title: "FINANCE",
      items: [
        { name: 'Tally Sync', icon: <RefreshCcw size={20} />, path: '/tally-dashboard', roles: ['admin'] },
        { name: 'Vendor Bills', icon: <FileText size={20} />, path: '/vendor-bills', roles: ['admin', 'accounts'] },
        { name: 'Vendor Ledger', icon: <BookOpen size={20} />, path: '/vendor-ledger', roles: ['admin', 'accounts'] },
        { name: 'Aging Analysis', icon: <TrendingUp size={20} />, path: '/aging-dashboard', roles: ['admin', 'accounts'] },
      ]
    },
    {
      title: "HUMAN RESOURCES",
      items: [
        { name: 'Project Mgmt', icon: <Briefcase size={20} />, path: '/tasks', roles: ['admin', 'employee', 'hr'] },
        { name: 'Employees', icon: <UserCircle size={20} />, path: '/employees', roles: ['admin', 'hr'] },
        { name: 'Payroll', icon: <TrendingUp size={20} />, path: '/payroll', roles: ['admin', 'hr'] },
        { name: 'Reports', icon: <PieChart size={20} />, path: '/reports', roles: ['admin', 'hr'] },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside style={{
      width: isCollapsed ? '88px' : '280px',
      height: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'sticky',
      top: 0,
      borderRight: '1px solid rgba(255,255,255,0.1)',
      zIndex: 100,
      padding: '24px 16px'
    }}>
      {/* Brand Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 12px',
        marginBottom: '40px',
        overflow: 'hidden'
      }}>
        <div style={{
          minWidth: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)'
        }}>
          <span style={{ fontWeight: '900', fontSize: '1.2rem', color: 'white' }}>Z</span>
        </div>
        {!isCollapsed && (
          <div style={{ transition: 'opacity 0.3s' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Zen Finance</h1>
            <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Enterprise Suite</p>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' }}>
        {menuSections.map((section, sidx) => {
          const filteredItems = section.items.filter(i => i.roles.includes(userRole));
          if (filteredItems.length === 0) return null;

          return (
            <div key={sidx} style={{ marginBottom: '24px' }}>
              {!isCollapsed && (
                <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#475569', marginBottom: '12px', paddingLeft: '12px', letterSpacing: '0.15em' }}>
                  {section.title}
                </p>
              )}
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      color: isActive ? '#fff' : '#94a3b8',
                      background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'transparent',
                      marginBottom: '4px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      justifyContent: isCollapsed ? 'center' : 'flex-start'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {isActive && (
                      <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', background: '#6366f1', borderRadius: '0 4px 4px 0' }} />
                    )}
                    <span style={{ color: isActive ? '#6366f1' : 'inherit' }}>{item.icon}</span>
                    {!isCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ChevronLeft size={18} /> <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Collapse</span></div>}
        </button>
        
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: 'none',
            borderRadius: '10px',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} />
          {!isCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
