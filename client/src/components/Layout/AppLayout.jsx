import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Calendar,
  FileText,
  PenTool,
  TrendingUp,
  Compass,
  Bot,
  Zap,
  HelpCircle,
  Users,
  GraduationCap,
  Shield,
  Layers,
  Megaphone,
  Sliders,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';

const AppLayout = () => {
  const { user, logout, getDashboardPath } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/subjects' && location.pathname.startsWith('/subjects')) return true;
    if (path === '/tasks' && location.pathname.startsWith('/tasks')) return true;
    if (path === '/materials' && location.pathname.startsWith('/materials')) return true;
    if (path === '/notes' && location.pathname.startsWith('/notes')) return true;
    if (path === '/quizzes' && location.pathname.startsWith('/quizzes')) return true;
    if (path === '/progress' && location.pathname.startsWith('/progress')) return true;
    if (path === '/recommendations' && location.pathname.startsWith('/recommendations')) return true;
    if (path === '/study-planner' && location.pathname.startsWith('/study-planner')) return true;
    if (path === '/assistant' && location.pathname.startsWith('/assistant')) return true;
    if (path === '/summarizer' && location.pathname.startsWith('/summarizer')) return true;
    if (path === '/teacher/subjects' && location.pathname.startsWith('/teacher/subjects')) return true;
    if (path === '/teacher/materials' && location.pathname.startsWith('/teacher/materials')) return true;
    if (path === '/teacher/assignments' && location.pathname.startsWith('/teacher/assignments')) return true;
    if (path === '/teacher/students' && location.pathname.startsWith('/teacher/students')) return true;
    if (path === '/teacher/announcements' && location.pathname.startsWith('/teacher/announcements')) return true;
    if (path === '/admin/users' && location.pathname.startsWith('/admin/users')) return true;
    if (path === '/admin/students' && location.pathname.startsWith('/admin/students')) return true;
    if (path === '/admin/teachers' && location.pathname.startsWith('/admin/teachers')) return true;
    if (path === '/admin/subjects' && location.pathname.startsWith('/admin/subjects')) return true;
    if (path === '/admin/materials' && location.pathname.startsWith('/admin/materials')) return true;
    if (path === '/admin/quizzes' && location.pathname.startsWith('/admin/quizzes')) return true;
    if (path === '/admin/settings' && location.pathname.startsWith('/admin/settings')) return true;
    return location.pathname === path;
  };

  // Grouped Navigation Items per Role
  const getNavGroups = () => {
    if (!user) return [];

    if (user.role === 'student') {
      return [
        {
          title: 'Workspace',
          items: [
            { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'Academic',
          items: [
            { label: 'My Subjects', path: '/subjects', icon: BookOpen },
            { label: 'Tasks', path: '/tasks', icon: CheckSquare },
            { label: 'Calendar', path: '/calendar', icon: Calendar },
            { label: 'Materials', path: '/materials', icon: FileText },
            { label: 'My Notes', path: '/notes', icon: PenTool },
            { label: 'Progress', path: '/progress', icon: TrendingUp },
          ],
        },
        {
          title: 'AI Suite',
          items: [
            { label: 'AI Study Planner', path: '/study-planner', icon: Sparkles },
            { label: 'AI Assistant', path: '/assistant', icon: Bot },
            { label: 'AI Summarizer', path: '/summarizer', icon: Zap },
            { label: 'Practice Quizzes', path: '/quizzes', icon: HelpCircle },
            { label: 'AI Recommendations', path: '/recommendations', icon: Compass },
          ],
        },
        {
          title: 'Account',
          items: [
            { label: 'Profile', path: '/profile', icon: User },
            { label: 'Settings', path: '/settings', icon: Sliders },
          ],
        },
      ];
    }

    if (user.role === 'teacher') {
      return [
        {
          title: 'Workspace',
          items: [
            { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'Teaching & Cohort',
          items: [
            { label: 'My Classes', path: '/teacher/subjects', icon: BookOpen },
            { label: 'Course Materials', path: '/teacher/materials', icon: FileText },
            { label: 'Assignments', path: '/teacher/assignments', icon: Layers },
            { label: 'Quizzes', path: '/quizzes', icon: HelpCircle },
            { label: 'Student Monitoring', path: '/teacher/students', icon: Users },
            { label: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
            { label: 'Calendar', path: '/calendar', icon: Calendar },
            { label: 'AI Assistant', path: '/assistant', icon: Bot },
          ],
        },
        {
          title: 'Account',
          items: [
            { label: 'Profile', path: '/profile', icon: User },
            { label: 'Settings', path: '/settings', icon: Sliders },
          ],
        },
      ];
    }

    if (user.role === 'admin') {
      return [
        {
          title: 'Workspace',
          items: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'Administration',
          items: [
            { label: 'Users', path: '/admin/users', icon: Users },
            { label: 'Students', path: '/admin/students', icon: BookOpen },
            { label: 'Faculty', path: '/admin/teachers', icon: GraduationCap },
            { label: 'Subjects & Topics', path: '/admin/subjects', icon: BookOpen },
            { label: 'Materials Moderation', path: '/admin/materials', icon: FileText },
            { label: 'Quiz Repository', path: '/admin/quizzes', icon: HelpCircle },
            { label: 'System Settings', path: '/admin/settings', icon: Sliders },
          ],
        },
        {
          title: 'Account',
          items: [
            { label: 'Profile', path: '/profile', icon: User },
            { label: 'Settings', path: '/settings', icon: Sliders },
          ],
        },
      ];
    }

    return [];
  };

  const navGroups = getNavGroups();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return <span className="badge badge-admin"><Shield size={11} /> Admin</span>;
      case 'teacher':
        return <span className="badge badge-teacher"><GraduationCap size={11} /> Faculty</span>;
      case 'student':
      default:
        return <span className="badge badge-student"><BookOpen size={11} /> Student</span>;
    }
  };

  // Render navigation links list
  const renderNavLinks = (isMobile = false) => (
    <div className="sidebar-nav">
      {navGroups.map((group, idx) => (
        <div key={idx} className="sidebar-nav-group">
          {(!isSidebarCollapsed || isMobile) && (
            <div className="sidebar-group-title">{group.title}</div>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${active ? 'active' : ''}`}
                title={isSidebarCollapsed && !isMobile ? item.label : undefined}
                style={isSidebarCollapsed && !isMobile ? { justifyContent: 'center', padding: '0.65rem 0' } : {}}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {(!isSidebarCollapsed || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="app-shell">
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (>= 1024px)                                            */}
      {/* ========================================================================= */}
      <aside className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link
            to={getDashboardPath(user?.role)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--pastel-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(200, 182, 255, 0.4)',
              }}
            >
              <Sparkles size={17} color="#342852" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                  Study<span style={{ color: 'var(--brand-primary)' }}>Genie</span>
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="btn btn-ghost btn-sm btn-icon"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color: 'var(--text-muted)' }}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Grouped Nav Items */}
        {renderNavLinks(false)}

        {/* Sidebar Footer / User Profile Card */}
        <div className="sidebar-footer">
          <Link
            to="/profile"
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden', flex: 1, minWidth: 0 }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--pastel-lavender)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--pastel-periwinkle)',
                  color: '#242F55',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  flexShrink: 0,
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            {!isSidebarCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user?.role}
                </span>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm btn-icon"
              title="Sign out"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE DRAWER (< 1024px)                                               */}
      {/* ========================================================================= */}
      <div
        className={`mobile-drawer-backdrop ${isMobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />
      <div className={`mobile-drawer ${isMobileDrawerOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link
            to={getDashboardPath(user?.role)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--pastel-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="#342852" />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Study<span style={{ color: 'var(--brand-primary)' }}>Genie</span>
            </span>
          </Link>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="btn btn-ghost btn-sm btn-icon"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Navigation List */}
        {renderNavLinks(true)}

        {/* Drawer Footer */}
        <div className="sidebar-footer">
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--pastel-periwinkle)',
                color: '#242F55',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.82rem',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {user?.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {user?.role}
              </span>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm btn-icon"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WRAPPER & TOP APP HEADER                                          */}
      {/* ========================================================================= */}
      <div className={`app-main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="app-header">
          {/* Left: Mobile Hamburger & Page Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="btn btn-ghost btn-sm btn-icon"
              style={{ display: 'none' }}
              id="mobile-drawer-toggle"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            <style>{`
              @media (max-width: 1024px) {
                #mobile-drawer-toggle {
                  display: flex !important;
                }
              }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getRoleBadge()}
            </div>
          </div>

          {/* Right: Quick Actions, Notifications, Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user?.role === 'student' && (
              <Link
                to="/study-planner"
                className="btn btn-sm btn-outline"
                style={{ display: 'none' }}
                id="header-planner-btn"
              >
                <Sparkles size={14} color="var(--brand-primary)" />
                <span>AI Planner</span>
              </Link>
            )}

            <style>{`
              @media (min-width: 768px) {
                #header-planner-btn {
                  display: inline-flex !important;
                }
              }
            `}</style>

            {/* Live Notification Bell Component */}
            <NotificationBell />

            {/* Profile Pill */}
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                textDecoration: 'none',
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--pastel-periwinkle)',
                    color: '#242F55',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Scrollable Main Content Container */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
