import React, { useState, useEffect, useRef } from 'react';
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
  const scrollRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'employee';
  const userPermissions = user.permissions || [];

  // Restore scroll position on mount
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebar-scroll');
    if (savedScroll && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  // Save scroll position on interaction
  const handleScroll = () => {
    if (scrollRef.current) {
      sessionStorage.setItem('sidebar-scroll', scrollRef.current.scrollTop);
    }
  };

  const menuSections = [
    {
      title: "OVERVIEW",
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', permission: 'dashboard:view' },
      ]
    },
    {
      title: "COMMERCIAL",
      items: [
        { name: 'Leads', icon: <Target size={20} />, path: '/leads', permission: 'leads:view' },
        { name: 'Customers', icon: <Users size={20} />, path: '/customers', permission: 'customers:view' },
        { name: 'Invoices', icon: <FileText size={20} />, path: '/invoices', permission: 'invoices:view' },
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { name: 'Inventory', icon: <Package size={20} />, path: '/inventory', permission: 'inventory:view' },
        { name: 'Vendors', icon: <Handshake size={20} />, path: '/vendors', permission: 'vendors:view' },
        { name: 'Purchase Orders', icon: <ClipboardCheck size={20} />, path: '/purchase-view', permission: 'purchase_orders:view' },
        { name: 'Receive Goods', icon: <Package size={20} />, path: '/grn', permission: 'grn:view' },
      ]
    },
    {
      title: "FINANCE",
      items: [
        { name: 'Tally Sync', icon: <RefreshCcw size={20} />, path: '/tally-dashboard', permission: 'tally:view' },
        { name: 'Vendor Bills', icon: <FileText size={20} />, path: '/vendor-bills', permission: 'vendor_bills:view' },
        { name: 'Vendor Ledger', icon: <BookOpen size={20} />, path: '/vendor-ledger', permission: 'vendor_ledger:view' },
        { name: 'Aging Analysis', icon: <TrendingUp size={20} />, path: '/aging-dashboard', permission: 'aging:view' },
      ]
    },
    {
      title: "HUMAN RESOURCES",
      items: [
        { name: 'Project Mgmt', icon: <Briefcase size={20} />, path: '/tasks', permission: 'tasks:view' },
        { name: 'Employees', icon: <UserCircle size={20} />, path: '/employees', permission: 'employees:view' },
        { name: 'Payroll', icon: <TrendingUp size={20} />, path: '/payroll', permission: 'payroll:view' },
        { name: 'Reports', icon: <PieChart size={20} />, path: '/reports', permission: 'reports:view' },
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
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' }}
      >
        {menuSections.map((section, sidx) => {
          const filteredItems = section.items.filter(item => {
            return userRole.toLowerCase() === 'admin' || userPermissions.includes(item.permission);
          });
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
