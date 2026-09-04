import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Calendar,
  Clock,
  BookOpen,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  X,
  ArrowRight,
  FileText,
  AlertCircle,
} from 'lucide-react';
import assignmentService from '../../services/assignmentService';
import subjectService from '../../services/subjectService';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    subject: '',
    topic: '',
    dueDate: '',
    totalPoints: 100,
    status: 'published',
  });

  const [availableTopics, setAvailableTopics] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [subjectFilter, statusFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subjectsRes] = await Promise.all([
        subjectService.getSubjects(),
        fetchAssignments(),
      ]);
      const list = subjectsRes.subjects || subjectsRes.data || [];
      setSubjects(list);
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const params = {};
      if (subjectFilter !== 'all') params.subject = subjectFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await assignmentService.getAssignments(params);
      setAssignments(res.data || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssignments();
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    const defaultSubject = subjects.length > 0 ? subjects[0].id || subjects[0]._id : '';
    setFormData({
      title: '',
      description: '',
      instructions: '',
      subject: defaultSubject,
      topic: '',
      dueDate: '',
      totalPoints: 100,
      status: 'published',
    });
    setAvailableTopics([]);
    if (defaultSubject) {
      handleSubjectChange(defaultSubject);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (assignment, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setEditingId(assignment._id);

    const formattedDue = assignment.dueDate
      ? new Date(assignment.dueDate).toISOString().slice(0, 16)
      : '';

    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      subject: assignment.subject?._id || assignment.subject || '',
      topic: assignment.topic?._id || assignment.topic || '',
      dueDate: formattedDue,
      totalPoints: assignment.totalPoints || 100,
      status: assignment.status || 'published',
    });

    const sId = assignment.subject?._id || assignment.subject;
    if (sId) {
      subjectService.getTopics(sId).then((res) => {
        setAvailableTopics(res.topics || res.data || []);
      }).catch(() => {});
    }

    setIsModalOpen(true);
  };

  const handleSubjectChange = async (subjId) => {
    setFormData((prev) => ({ ...prev, subject: subjId, topic: '' }));
    if (!subjId) {
      setAvailableTopics([]);
      return;
    }
    try {
      const res = await subjectService.getTopics(subjId);
      setAvailableTopics(res.topics || res.data || []);
    } catch {
      setAvailableTopics([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert('Please enter an assignment title');
    if (!formData.subject) return alert('Please select a subject');
    if (!formData.dueDate) return alert('Please provide a deadline');

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const res = await assignmentService.createAssignment(formData);
        setAssignments((prev) => [res.data, ...prev]);
      } else {
        const res = await assignmentService.updateAssignment(editingId, formData);
        setAssignments((prev) =>
          prev.map((a) => (a._id === editingId ? res.data : a))
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await assignmentService.deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  // Metrics
  const totalAssignments = assignments.length;
  const publishedAssignments = assignments.filter((a) => a.status === 'published').length;
  const totalSubmissions = assignments.reduce(
    (acc, a) => acc + (a.stats?.submittedCount || 0),
    0
  );

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <PageHeader
        badge="Coursework Administration"
        title="Course Assignments"
        description="Publish homework assignments, set deadlines, and track student completion rosters."
        action={
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={18} /> Create Assignment
          </button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
        <StatCard
          icon={Layers}
          value={totalAssignments}
          label="Total Assignments"
          accent="mauve"
        />
        <StatCard
          icon={CheckCircle2}
          value={publishedAssignments}
          label="Published Active"
          accent="sky"
        />
        <StatCard
          icon={Users}
          value={totalSubmissions}
          label="Submissions Handed In"
          accent="pink"
        />
      </div>

      {/* Search & Filters */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search
            size={17}
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search assignments by title or instructions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: '2.4rem', height: '40px', borderRadius: 'var(--radius-md)' }}
          />
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="input-field"
            style={{ height: '40px', fontSize: '0.85rem', borderRadius: 'var(--radius-md)' }}
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {s.code ? `${s.code} - ` : ''}{s.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ height: '40px', fontSize: '0.85rem', borderRadius: 'var(--radius-md)' }}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Assignments Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-light)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1rem',
              borderRadius: '16px',
              background: 'var(--pastel-mauve-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
            }}
          >
            <Layers size={30} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No assignments created yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Create your first assignment to assign problem sets, readings, or project milestones to your students.
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
            <Plus size={16} /> Create Assignment
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {assignments.map((assignment) => {
            const total = assignment.stats?.totalEnrolled || 0;
            const submitted = assignment.stats?.submittedCount || 0;
            const percent = assignment.stats?.completionPercentage || 0;

            return (
              <div
                key={assignment._id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xs)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'var(--transition-normal)',
                }}
              >
                <div>
                  {/* Subject Tag & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--pastel-mauve-subtle)',
                        color: 'var(--brand-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <BookOpen size={12} />
                      {assignment.subject?.code || assignment.subject?.title}
                    </span>

                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: assignment.status === 'published' ? 'var(--status-success-bg)' : 'var(--bg-subtle)',
                        color: assignment.status === 'published' ? 'var(--status-success-text)' : 'var(--text-muted)',
                      }}
                    >
                      {assignment.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                    {assignment.title}
                  </h3>

                  {assignment.description && (
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.45 }}>
                      {assignment.description}
                    </p>
                  )}

                  {/* Due Date & Points */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} color="var(--brand-primary)" />
                      <span>
                        Due: {new Date(assignment.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={13} color="var(--brand-primary)" />
                      <span>{assignment.totalPoints} Points</span>
                    </div>
                  </div>

                  {/* Student Completion Progress Bar */}
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Student Submissions</span>
                      <span style={{ color: 'var(--brand-primary)' }}>{submitted} / {total} ({percent}%)</span>
                    </div>

                    <div style={{ width: '100%', height: '7px', background: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: 'var(--pastel-lavender)',
                          borderRadius: '999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={(e) => openEditModal(assignment, e)}
                      className="btn btn-ghost"
                      style={{ padding: '0.45rem', color: 'var(--text-muted)' }}
                      title="Edit Assignment"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(assignment._id, e)}
                      className="btn btn-ghost"
                      style={{ padding: '0.45rem', color: 'var(--status-error-text)' }}
                      title="Delete Assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <Link
                    to={`/assignments/${assignment._id}`}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.95rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    View Roster & Grade <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(30, 37, 56, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {modalMode === 'create' ? 'Create New Assignment' : 'Edit Assignment'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Problem Set 2: Linear Transformations"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Short Overview
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of assignment goals..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              {/* Instructions */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Detailed Instructions & Questions
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide step-by-step instructions, questions 1-5, submission guidelines..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', resize: 'vertical' }}
                />
              </div>

              {/* Subject & Cascading Topic */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.code ? `${s.code} - ` : ''}{s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Topic (Optional)
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="input-field"
                    disabled={!formData.subject || availableTopics.length === 0}
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">None / General</option>
                    {availableTopics.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date, Points & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Due Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Total Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={formData.totalPoints}
                    onChange={(e) => setFormData({ ...formData, totalPoints: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontWeight: 700 }}>
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Assignment' : 'Update Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
