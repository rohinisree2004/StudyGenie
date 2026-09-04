import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Megaphone,
  FileText,
  BookOpen,
  Award,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/UI';

const NotificationsCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'academic', 'announcements', 'reminders', 'recommendations'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusMessage, setStatusMessage] = useState(null);

  // Fetch notifications
  const loadNotifications = async (tab = activeTab, search = searchQuery, pageNum = 1) => {
    try {
      setIsLoading(true);
      const params = {
        page: pageNum,
        limit: 15,
        search: search.trim() || undefined,
      };

      if (tab === 'unread') {
        params.isRead = 'false';
      } else if (tab === 'academic') {
        params.category = 'academic';
      } else if (tab === 'announcements') {
        params.category = 'announcement';
      } else if (tab === 'reminders') {
        params.category = 'reminder';
      } else if (tab === 'recommendations') {
        params.type = 'recommendation_ready';
      }

      const res = await notificationService.getNotifications(params);
      if (res.success) {
        setNotifications(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setUnreadCount(res.pagination?.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Could not fetch notifications' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(activeTab, searchQuery, page);
  }, [activeTab, page]);

  // Handle live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadNotifications(activeTab, searchQuery, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger manual reminder scan
  const handleScanReminders = async () => {
    try {
      setIsScanning(true);
      const res = await notificationService.checkReminders();
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Scan complete: ${res.message || 'Deadlines and sessions synchronized!'}`,
        });
        loadNotifications(activeTab, searchQuery, 1);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to scan reminders: ' + err.message });
    } finally {
      setIsScanning(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Mark single read/unread
  const handleToggleRead = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to toggle read state:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        setStatusMessage({ type: 'success', text: 'All notifications marked as read' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  // Delete single notification
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setStatusMessage({ type: 'success', text: 'Notification deleted' });
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Clear all read
  const handleClearRead = async () => {
    if (!window.confirm('Clear all read notifications from your history?')) return;
    try {
      const res = await notificationService.clearReadNotifications();
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
        setStatusMessage({ type: 'success', text: 'Cleared read notifications' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  // Helpers
  const getIconForType = (type) => {
    switch (type) {
      case 'announcement_posted':
        return <Megaphone size={16} color="#7E2A6A" />;
      case 'assignment_created':
      case 'assignment_graded':
        return <FileText size={16} color="#2A4580" />;
      case 'material_uploaded':
        return <BookOpen size={16} color="#453E8A" />;
      case 'quiz_result':
        return <Award size={16} color="#5D2FA3" />;
      case 'study_session_scheduled':
      case 'deadline_reminder':
        return <Clock size={16} color="#991B1B" />;
      case 'recommendation_ready':
        return <Sparkles size={16} color="#7E2A6A" />;
      default:
        return <AlertCircle size={16} color="#5A5FDB" />;
    }
  };

  const getBorderColor = (type) => {
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
        return '#FCA5A5';
      case 'study_session_scheduled':
        return 'var(--pastel-periwinkle, #B8C0FF)';
      case 'recommendation_ready':
        return 'var(--pastel-pink, #FFD6FF)';
      default:
        return 'var(--border-light, #E2E8F0)';
    }
  };

  const getBadgeStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' };
      case 'high':
      case 'important':
        return { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
      default:
        return { backgroundColor: 'var(--pastel-lavender-subtle, #F7F2FF)', color: '#4A3E72', border: '1px solid var(--border-light)' };
    }
  };

  const getActionLabel = (notif) => {
    switch (notif.type) {
      case 'assignment_created':
      case 'assignment_graded':
        return 'View Assignment';
      case 'material_uploaded':
        return 'Open Courseware';
      case 'quiz_result':
        return 'Review Quiz Results';
      case 'announcement_posted':
        return 'Read Course Announcement';
      case 'study_session_scheduled':
        return 'Open Study Calendar';
      case 'recommendation_ready':
        return 'Inspect AI Insights';
      default:
        return 'Open Details';
    }
  };

  const tabs = [
    { id: 'all', label: 'All Notifications', count: null },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'announcements', label: 'Announcements' },
    { id: 'academic', label: 'Coursework & Materials' },
    { id: 'reminders', label: 'Deadlines & Sessions' },
    { id: 'recommendations', label: 'AI Advice' },
  ];

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Top Header */}
      <PageHeader
        title="Notifications & Academic Reminders"
        subtitle="Stay updated on course announcements, assignment deadlines, teacher notes, graded tests, and AI study recommendations."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-accent" style={{ background: 'var(--pastel-lavender-subtle)', color: 'var(--brand-primary)' }}>
              <Bell size={13} /> Communications Hub
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#E11D48',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleScanReminders}
              disabled={isScanning}
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', gap: '0.4rem' }}
              title="Auto-scan upcoming deadlines and study sessions"
            >
              <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
              <span>{isScanning ? 'Scanning...' : 'Check Deadlines'}</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="btn btn-ghost"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', gap: '0.4rem', color: 'var(--brand-primary)' }}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearRead}
              className="btn btn-ghost"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', gap: '0.4rem', color: 'var(--text-muted)' }}
              title="Remove all read notifications"
            >
              <Trash2 size={14} />
              <span>Clear read</span>
            </button>
          </div>
        }
      />

      {/* Toast Alert */}
      {statusMessage && (
        <div
          className="animate-fade-in"
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 600,
            backgroundColor: statusMessage.type === 'error' ? '#FEE2E2' : '#DCFCE7',
            color: statusMessage.type === 'error' ? '#991B1B' : '#166534',
            border: `1px solid ${statusMessage.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {statusMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '0.75rem',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 600,
                  border: '1px solid',
                  borderColor: isActive ? 'var(--brand-primary)' : 'var(--border-light)',
                  backgroundColor: isActive ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count !== null && tab.count > 0 && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--pastel-lavender)',
                      color: isActive ? '#FFFFFF' : '#342852',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={15}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)',
              fontSize: '0.82rem',
              backgroundColor: 'var(--bg-surface)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-spin inline-block mb-3">
              <RefreshCw size={24} color="var(--brand-primary)" />
            </div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div
            className="card"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--pastel-lavender-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle size={28} color="var(--brand-primary)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No notifications found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              {activeTab === 'unread'
                ? "You're all caught up! There are no unread notifications right now."
                : 'No notification records match your current filter criteria.'}
            </p>
            {activeTab !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
                className="btn btn-outline"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          notifications.map((notif) => {
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif._id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: `5px solid ${getBorderColor(notif.type)}`,
                  backgroundColor: isUnread ? 'rgba(255, 255, 255, 0.98)' : 'var(--bg-surface)',
                  boxShadow: isUnread ? '0 4px 14px rgba(90, 95, 219, 0.08)' : 'var(--shadow-xs)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Left: Icon & Details */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    {getIconForType(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header line: Tags and timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      {/* Priority pill */}
                      {notif.priority && notif.priority !== 'normal' && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            ...getBadgeStyle(notif.priority),
                          }}
                        >
                          {notif.priority}
                        </span>
                      )}

                      {/* Course / Subject badge if available */}
                      {notif.metadata?.subjectTitle && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: notif.metadata?.subjectColor || 'var(--pastel-sky)',
                            color: '#1E293B',
                          }}
                        >
                          {notif.metadata?.subjectCode ? `${notif.metadata.subjectCode}: ` : ''}
                          {notif.metadata.subjectTitle}
                        </span>
                      )}

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {isUnread && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--brand-primary)',
                            display: 'inline-block',
                          }}
                          title="Unread"
                        />
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '0.98rem',
                        fontWeight: isUnread ? 800 : 700,
                        color: 'var(--text-main)',
                        margin: '0 0 0.3rem 0',
                      }}
                    >
                      {notif.title}
                    </h3>

                    {/* Message */}
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {notif.message}
                    </p>

                    {/* Context link / Action CTA */}
                    {notif.link && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <Link
                          to={notif.link}
                          onClick={() => handleToggleRead(notif)}
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
                          <span>{getActionLabel(notif)}</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions: Mark read / delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  {isUnread ? (
                    <button
                      type="button"
                      onClick={() => handleToggleRead(notif)}
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem', color: 'var(--text-muted)', borderRadius: '8px' }}
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(notif._id, e)}
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem', color: 'var(--text-muted)', borderRadius: '8px' }}
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsCenter;
