import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  BookOpen,
  FileText,
  Clock,
  Award,
  Sparkles,
  Megaphone,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import notificationService from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count and recent items
  const fetchNotificationData = async () => {
    if (!isAuthenticated) return;
    try {
      const [countRes, listRes] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getNotifications({ limit: 5 }),
      ]);
      if (countRes.success) {
        setUnreadCount(countRes.data.unreadCount);
      }
      if (listRes.success) {
        setRecentNotifications(listRes.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch notification badge count:', err.message);
    }
  };

  useEffect(() => {
    fetchNotificationData();

    // Poll every 60 seconds for live updates
    const interval = setInterval(fetchNotificationData, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotificationData();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleItemClick = async (notif) => {
    setIsOpen(false);
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    } else {
      navigate('/notifications');
    }
  };

  const getNotificationIcon = (type, category) => {
    switch (type) {
      case 'announcement_posted':
        return <Megaphone size={14} color="#7E2A6A" />;
      case 'assignment_created':
      case 'assignment_graded':
        return <FileText size={14} color="#2A4580" />;
      case 'material_uploaded':
        return <BookOpen size={14} color="#453E8A" />;
      case 'quiz_result':
        return <Award size={14} color="#5D2FA3" />;
      case 'study_session_scheduled':
      case 'deadline_reminder':
        return <Clock size={14} color="#991B1B" />;
      case 'recommendation_ready':
        return <Sparkles size={14} color="#7E2A6A" />;
      default:
        return <AlertCircle size={14} color="#5A5FDB" />;
    }
  };

  const getNotificationColorBg = (type) => {
    switch (type) {
      case 'announcement_posted':
        return 'var(--pastel-pink, #FFD6FF)';
      case 'assignment_created':
      case 'assignment_graded':
        return 'var(--pastel-sky, #BBD0FF)';
      case 'material_uploaded':
        return 'var(--pastel-lavender, #E7C6FF)';
      case 'quiz_result':
        return 'var(--pastel-mauve, #C8B6FF)';
      case 'deadline_reminder':
        return '#FEE2E2';
      case 'study_session_scheduled':
        return 'var(--pastel-periwinkle, #B8C0FF)';
      case 'recommendation_ready':
        return 'var(--pastel-pink, #FFD6FF)';
      default:
        return 'var(--bg-subtle, #F8FAFC)';
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="btn btn-ghost"
        style={{
          position: 'relative',
          padding: '0.45rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isOpen ? 'var(--pastel-lavender-subtle)' : 'transparent',
          color: unreadCount > 0 ? 'var(--brand-primary)' : 'var(--text-secondary)',
        }}
        title="Notifications & Alerts"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#E11D48',
              color: '#FFFFFF',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: '17px',
              height: '17px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Quick Notifications Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            backgroundColor: 'var(--bg-surface, #FFFFFF)',
            borderRadius: 'var(--radius-lg, 16px)',
            border: '1px solid var(--border-light, #E2E8F0)',
            boxShadow: '0 12px 32px rgba(90, 95, 219, 0.12), 0 4px 12px rgba(0,0,0,0.06)',
            zIndex: 100,
            overflow: 'hidden',
          }}
          className="animate-scale-in"
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border-light, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    backgroundColor: 'var(--pastel-lavender)',
                    color: '#342852',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--brand-primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {recentNotifications.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--pastel-sky-subtle, #F0F5FF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                  }}
                >
                  <CheckCircle2 size={20} color="var(--brand-primary)" />
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  All caught up!
                </p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  No new notifications right now.
                </p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    borderBottom: '1px solid var(--border-light, #F1F5F9)',
                    backgroundColor: notif.isRead ? 'transparent' : 'rgba(231, 198, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle, #F8FAFC)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = notif.isRead
                      ? 'transparent'
                      : 'rgba(231, 198, 255, 0.08)')
                  }
                >
                  {/* Category icon */}
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: getNotificationColorBg(notif.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {getNotificationIcon(notif.type, notif.category)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: notif.isRead ? 600 : 700,
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {notif.title}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-secondary)',
                        margin: '0.2rem 0 0 0',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread indicator dot */}
                  {!notif.isRead && (
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-primary, #5A5FDB)',
                        flexShrink: 0,
                        marginTop: '6px',
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div
            style={{
              padding: '0.65rem 1rem',
              borderTop: '1px solid var(--border-light, #E2E8F0)',
              backgroundColor: 'var(--bg-subtle, #F8FAFC)',
              textAlign: 'center',
            }}
          >
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--brand-primary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>View all notifications</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
