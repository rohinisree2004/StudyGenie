import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Users,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Search,
  Filter,
  X,
  Clock,
  Sparkles,
  Send,
} from 'lucide-react';
import announcementService from '../../services/announcementService';
import subjectService from '../../services/subjectService';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/UI';

const TeacherAnnouncements = () => {
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    priority: 'normal',
    isPinned: false,
  });

  // Load teacher's subjects & announcements
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subjectsRes, announcementsRes] = await Promise.all([
        subjectService.getSubjects(),
        announcementService.getAnnouncements({
          subjectId: selectedSubject !== 'all' ? selectedSubject : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          search: searchQuery.trim() || undefined,
        }),
      ]);

      if (subjectsRes.success) {
        setSubjects(subjectsRes.data || []);
      }
      if (announcementsRes.success) {
        setAnnouncements(announcementsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load announcements data:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Could not load data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubject, priorityFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      subject: subjects[0]?._id || '',
      priority: 'normal',
      isPinned: false,
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingAnnouncement(item);
    setFormData({
      title: item.title,
      content: item.content,
      subject: item.subject?._id || item.subject,
      priority: item.priority || 'normal',
      isPinned: Boolean(item.isPinned),
    });
    setShowModal(true);
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.subject) {
      setStatusMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingAnnouncement) {
        const res = await announcementService.updateAnnouncement(editingAnnouncement._id, formData);
        if (res.success) {
          setStatusMessage({ type: 'success', text: 'Announcement updated successfully!' });
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await announcementService.createAnnouncement(formData);
        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: 'Announcement published! Notifications sent to enrolled students.',
          });
          setShowModal(false);
          loadData();
        }
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save announcement.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (id) => {
    try {
      const res = await announcementService.togglePin(id);
      if (res.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a._id === id ? { ...a, isPinned: res.data.isPinned } : a))
        );
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Delete Announcement
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this announcement?')) return;
    try {
      const res = await announcementService.deleteAnnouncement(id);
      if (res.success) {
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
        setStatusMessage({ type: 'success', text: 'Announcement deleted.' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  // Summary Metrics
  const totalAnnouncements = announcements.length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;
  const totalAudience = announcements.reduce((acc, curr) => acc + (curr.totalEnrolled || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Header Banner */}
      <PageHeader
        title="Course Announcements & Broadcasts"
        subtitle="Broadcast urgent exam instructions, timetable revisions, and assignment directives. All enrolled students receive immediate notifications."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-teacher">
              <Megaphone size={13} /> Class Announcements
            </span>
            <span className="badge badge-active">
              <CheckCircle size={13} /> Live Broadcast
            </span>
          </div>
        }
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', gap: '0.45rem' }}
          >
            <Plus size={16} />
            <span>Post New Announcement</span>
          </button>
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

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="card card-pastel-pink" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Broadcasts
            </span>
            <Megaphone size={18} color="#7E2A6A" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {isLoading ? '...' : totalAnnouncements}
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Published across your courses
          </p>
        </div>

        <div className="card card-pastel-lavender" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Pinned Notices
            </span>
            <Pin size={18} color="#453E8A" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {isLoading ? '...' : pinnedCount}
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Anchored to top of student feeds
          </p>
        </div>

        <div className="card card-pastel-sky" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Students Reached
            </span>
            <Users size={18} color="#2A4580" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {isLoading ? '...' : totalAudience}
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Enrolled recipients notified
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Course Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={15} color="var(--text-muted)" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '0.82rem',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            >
              <option value="all">All Assigned Classes</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title} ({s.code || 'No Code'})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '0.82rem',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '250px' }}>
          <Search
            size={15}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search broadcasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)',
              fontSize: '0.82rem',
              backgroundColor: 'var(--bg-subtle)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '3.5rem 2rem',
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
                backgroundColor: 'var(--pastel-pink-subtle, #FFF4FA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Megaphone size={26} color="#7E2A6A" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No announcements published yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
              Keep students informed with updates on exam schedules, lecture materials, and problem set deadlines.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.2rem', fontSize: '0.82rem' }}
            >
              <Plus size={15} /> Create your first announcement
            </button>
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item._id}
              className="card"
              style={{
                padding: '1.5rem 1.75rem',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-surface)',
                borderTop: item.isPinned ? '4px solid #5A5FDB' : '1px solid var(--border-light)',
                boxShadow: item.isPinned ? '0 4px 16px rgba(90, 95, 219, 0.08)' : 'var(--shadow-xs)',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {item.isPinned && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        backgroundColor: '#EEF2FF',
                        color: '#4338CA',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Pin size={11} /> Pinned Notice
                    </span>
                  )}

                  {/* Priority pill */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      backgroundColor:
                        item.priority === 'urgent'
                          ? '#FEE2E2'
                          : item.priority === 'important'
                          ? '#FEF3C7'
                          : 'var(--pastel-lavender-subtle)',
                      color:
                        item.priority === 'urgent'
                          ? '#991B1B'
                          : item.priority === 'important'
                          ? '#92400E'
                          : '#453E8A',
                    }}
                  >
                    {item.priority}
                  </span>

                  {/* Subject badge */}
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: item.subject?.color || 'var(--pastel-sky)',
                      color: '#1E293B',
                    }}
                  >
                    {item.subject?.code ? `${item.subject.code}: ` : ''}
                    {item.subject?.title || 'Subject'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTogglePin(item._id)}
                    className="btn btn-ghost"
                    style={{
                      padding: '0.35rem 0.55rem',
                      fontSize: '0.75rem',
                      color: item.isPinned ? 'var(--brand-primary)' : 'var(--text-muted)',
                    }}
                    title={item.isPinned ? 'Unpin from top' : 'Pin to top'}
                  >
                    <Pin size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                    title="Edit announcement"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                    title="Delete announcement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Title & Body */}
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  margin: '0 0 1rem 0',
                }}
              >
                {item.content}
              </p>

              {/* Read Receipt Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={14} />
                  <span>
                    Read by <strong>{item.readCount || 0}</strong> of{' '}
                    <strong>{item.totalEnrolled || 0}</strong> enrolled students
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.teacher?.name && <span>Posted by {item.teacher.name}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          className="animate-fade-in"
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} color="var(--brand-primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {editingAnnouncement ? 'Edit Announcement' : 'New Course Announcement'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-ghost"
                style={{ padding: '0.35rem', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Target Class / Course <span style={{ color: '#E11D48' }}>*</span>
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                >
                  <option value="">Select a Course</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title} ({s.code || 'No Code'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Announcement Title <span style={{ color: '#E11D48' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Review Session Schedule & Formula Sheet"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Priority & Pinning Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-subtle)',
                      outline: 'none',
                    }}
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div style={{ paddingTop: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
                    />
                    <span>Pin to top of feed</span>
                  </label>
                </div>
              </div>

              {/* Content Body */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Announcement Message <span style={{ color: '#E11D48' }}>*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Type clear directives, instructions, or exam notes for your students..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.88rem',
                    backgroundColor: 'var(--bg-subtle)',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', gap: '0.4rem' }}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Broadcasting...' : editingAnnouncement ? 'Save Changes' : 'Broadcast to Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAnnouncements;
