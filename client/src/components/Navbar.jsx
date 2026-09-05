import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, LogOut, BookOpen, GraduationCap, Shield, LayoutDashboard, User, Users, Sliders, FileText, PenTool, CheckSquare, Calendar, Layers, Bot, Zap, HelpCircle, TrendingUp, Compass, Megaphone, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-admin"><Shield size={12} /> Admin</span>;
      case 'teacher':
        return <span className="badge badge-teacher"><GraduationCap size={12} /> Educator</span>;
      case 'student':
      default:
        return <span className="badge badge-student"><BookOpen size={12} /> Student</span>;
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.75rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Brand Logo */}
      <Link
        to={isAuthenticated ? getDashboardPath(user?.role) : '/'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--pastel-lavender)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(200, 182, 255, 0.4)',
          }}
        >
          <Sparkles size={18} color="#342852" />
        </div>
        <div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Study<span style={{ color: 'var(--brand-primary)' }}>Genie</span>
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              marginTop: '-3px',
            }}
          >
            AI Study Planner
          </span>
        </div>
      </Link>

      {/* Role Navigation & User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Primary Nav Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.5rem' }}>
              <Link
                to={getDashboardPath(user.role)}
                className="btn btn-ghost"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  color: isActive(getDashboardPath(user.role)) ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive(getDashboardPath(user.role)) ? 700 : 600,
                  backgroundColor: isActive(getDashboardPath(user.role)) ? 'var(--pastel-periwinkle-subtle)' : 'transparent',
                }}
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>

              {user.role === 'student' && (
                <>
                  <Link
                    to="/subjects"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/subjects') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/subjects') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/subjects') ? 'var(--pastel-sky-subtle)' : 'transparent',
                    }}
                  >
                    <BookOpen size={15} /> My Subjects
                  </Link>

                  <Link
                    to="/study-planner"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/study-planner') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/study-planner') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/study-planner') ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    }}
                  >
                    <Sparkles size={15} color="var(--brand-primary)" /> AI Planner
                  </Link>

                  <Link
                    to="/assistant"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/assistant') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/assistant') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/assistant') ? 'var(--pastel-sky-subtle)' : 'transparent',
                    }}
                  >
                    <Bot size={15} color="var(--brand-primary)" /> AI Assistant
                  </Link>

                  <Link
                    to="/summarizer"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/summarizer') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/summarizer') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/summarizer') ? 'var(--pastel-pink-subtle)' : 'transparent',
                    }}
                  >
                    <Zap size={15} color="var(--brand-primary)" /> AI Summarizer
                  </Link>

                  <Link
                    to="/quizzes"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/quizzes') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/quizzes') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/quizzes') ? 'var(--pastel-sky-subtle)' : 'transparent',
                    }}
                  >
                    <HelpCircle size={15} color="var(--brand-primary)" /> Quizzes
                  </Link>

                  <Link
                    to="/progress"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/progress') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/progress') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/progress') ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    }}
                  >
                    <TrendingUp size={15} color="var(--brand-primary)" /> Progress
                  </Link>

                  <Link
                    to="/recommendations"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/recommendations') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/recommendations') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/recommendations') ? 'var(--pastel-pink-subtle)' : 'transparent',
                    }}
                  >
                    <Compass size={15} color="var(--brand-primary)" /> AI Advice
                  </Link>

                  <Link
                    to="/tasks"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/tasks') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/tasks') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/tasks') ? 'var(--pastel-periwinkle-subtle)' : 'transparent',
                    }}
                  >
                    <CheckSquare size={15} /> Tasks
                  </Link>

                  <Link
                    to="/calendar"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/calendar') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/calendar') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/calendar') ? 'var(--pastel-pink-subtle)' : 'transparent',
                    }}
                  >
                    <Calendar size={15} /> Calendar
                  </Link>

                  <Link
                    to="/materials"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/materials') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/materials') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/materials') ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    }}
                  >
                    <FileText size={15} /> Materials
                  </Link>

                  <Link
                    to="/notes"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/notes') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/notes') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/notes') ? 'var(--pastel-mauve-subtle)' : 'transparent',
                    }}
                  >
                    <PenTool size={15} /> My Notes
                  </Link>
                </>
              )}

              {user.role === 'teacher' && (
                <>
                  <Link
                    to="/teacher/subjects"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/teacher/subjects') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/teacher/subjects') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/teacher/subjects') ? 'var(--pastel-mauve-subtle)' : 'transparent',
                    }}
                  >
                    <BookOpen size={15} /> My Classes
                  </Link>

                  <Link
                    to="/teacher/materials"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/teacher/materials') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/teacher/materials') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/teacher/materials') ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    }}
                  >
                    <FileText size={15} /> Course Materials
                  </Link>

                  <Link
                    to="/teacher/assignments"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/teacher/assignments') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/teacher/assignments') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/teacher/assignments') ? 'var(--pastel-pink-subtle)' : 'transparent',
                    }}
                  >
                    <Layers size={15} /> Assignments
                  </Link>

                  <Link
                    to="/quizzes"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/quizzes') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/quizzes') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/quizzes') ? 'var(--pastel-sky-subtle)' : 'transparent',
                    }}
                  >
                    <HelpCircle size={15} color="var(--brand-primary)" /> Quizzes
                  </Link>

                  <Link
                    to="/teacher/students"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/teacher/students') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/teacher/students') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/teacher/students') ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    }}
                  >
                    <Users size={15} color="var(--brand-primary)" /> Students Monitoring
                  </Link>

                  <Link
                    to="/teacher/announcements"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/teacher/announcements') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/teacher/announcements') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/teacher/announcements') ? 'var(--pastel-pink-subtle)' : 'transparent',
                    }}
                  >
                    <Megaphone size={15} color="var(--brand-primary)" /> Announcements
                  </Link>

                  <Link
                    to="/calendar"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/calendar') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/calendar') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/calendar') ? 'var(--pastel-periwinkle-subtle)' : 'transparent',
                    }}
                  >
                    <Calendar size={15} /> Calendar
                  </Link>

                  <Link
                    to="/assistant"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/assistant') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/assistant') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/assistant') ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    }}
                  >
                    <Bot size={15} color="var(--brand-primary)" /> AI Assistant
                  </Link>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <Link
                    to="/admin/users"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/admin/users') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/admin/users') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/admin/users') ? 'var(--pastel-pink-subtle)' : 'transparent',
                    }}
                  >
                    <Users size={15} /> Users
                  </Link>

                  <Link
                    to="/admin/students"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/admin/students') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/admin/students') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/admin/students') ? 'var(--pastel-sky-subtle)' : 'transparent',
                    }}
                  >
                    <BookOpen size={15} /> Students
                  </Link>

                  <Link
                    to="/admin/teachers"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/admin/teachers') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/admin/teachers') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/admin/teachers') ? 'var(--pastel-mauve-subtle)' : 'transparent',
                    }}
                  >
                    <GraduationCap size={15} /> Faculty
                  </Link>

                  <Link
                    to="/admin/subjects"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/admin/subjects') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/admin/subjects') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/admin/subjects') ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    }}
                  >
                    <BookOpen size={15} /> Subjects
                  </Link>

                  <Link
                    to="/admin/materials"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/admin/materials') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/admin/materials') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/admin/materials') ? 'var(--pastel-periwinkle-subtle)' : 'transparent',
                    }}
                  >
                    <FileText size={15} /> Materials
                  </Link>

                  <Link
                    to="/admin/quizzes"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/admin/quizzes') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/admin/quizzes') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/admin/quizzes') ? 'var(--pastel-sky-subtle)' : 'transparent',
                    }}
                  >
                    <HelpCircle size={15} color="var(--brand-primary)" /> Quizzes
                  </Link>

                  <Link
                    to="/admin/settings"
                    className="btn btn-ghost"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                      color: location.pathname.startsWith('/admin/settings') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: location.pathname.startsWith('/admin/settings') ? 700 : 600,
                      backgroundColor: location.pathname.startsWith('/admin/settings') ? 'var(--pastel-pink-subtle)' : 'transparent',
                    }}
                  >
                    <Sliders size={15} /> System
                  </Link>
                </>
              )}

              <Link
                to="/profile"
                className="btn btn-ghost"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  color: isActive('/profile') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive('/profile') ? 700 : 600,
                  backgroundColor: isActive('/profile') ? 'var(--pastel-lavender-subtle)' : 'transparent',
                }}
              >
                <User size={15} /> Profile
              </Link>

              <Link
                to="/settings"
                className="btn btn-ghost"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  color: isActive('/settings') ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive('/settings') ? 700 : 600,
                  backgroundColor: isActive('/settings') ? 'var(--pastel-sky-subtle)' : 'transparent',
                }}
              >
                <Sliders size={15} /> Settings
              </Link>
            </nav>

            {/* Notification Bell with Badge & Quick Dropdown */}
            <NotificationBell />

            {/* Profile Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--pastel-lavender)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--pastel-periwinkle)',
                    color: '#242F55',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
              title="Log out of StudyGenie"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-ghost">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary">
              Create Free Account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
