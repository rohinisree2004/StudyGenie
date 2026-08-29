import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subjectService } from '../../services/subjectService';
import { GraduationCap, Plus, Users, BookOpen, ArrowRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/UI/PageHeader';

const TeacherSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  const [newSubject, setNewSubject] = useState({
    title: '',
    code: '',
    description: '',
    category: 'Computer Science',
    color: '#E7C6FF', // Soft Pastel Mauve
  });

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const res = await subjectService.getSubjects(false);
      setSubjects(res.subjects || []);
    } catch (err) {
      console.error('Failed to load teacher subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.title.trim()) return;
    setIsSubmitting(true);
    try {
      await subjectService.createSubject(newSubject);
      setBannerMessage('New subject created successfully!');
      setShowCreateModal(false);
      setNewSubject({
        title: '',
        code: '',
        description: '',
        category: 'Computer Science',
        color: '#E7C6FF',
      });
      await loadSubjects();
      setTimeout(() => setBannerMessage(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      <PageHeader
        badge="Instructor Workspace"
        title="My Classes & Curriculum"
        description="Manage course topics, track cohort enrollments, and prepare materials."
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={16} /> Create Subject
          </button>
        }
      />

      {bannerMessage && (
        <div className="alert alert-success">
          <CheckCircle2 size={17} />
          <span>{bannerMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : subjects.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--pastel-mauve-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <GraduationCap size={26} color="#5D2FA3" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No subjects assigned yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            Create your first class curriculum or contact the administrator to assign an existing syllabus.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create New Subject
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '1.25rem',
          }}
        >
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="card"
              style={{
                borderRadius: 'var(--radius-lg)',
                borderTop: `4px solid ${subject.color || 'var(--pastel-mauve)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span className="badge badge-teacher" style={{ fontSize: '0.72rem' }}>
                    {subject.category || 'General'}
                  </span>
                  {subject.code && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {subject.code}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  {subject.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.25rem',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {subject.description || 'No course overview provided.'}
                </p>

                {/* Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.6rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} color="var(--brand-primary)" />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {subject.studentCount || 0}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enrolled</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={16} color="#5D2FA3" />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {subject.topicCount || 0}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Topics</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <Link
                  to={`/teacher/subjects/${subject.id}`}
                  className="btn btn-primary btn-block"
                  style={{ fontSize: '0.88rem' }}
                >
                  Manage Curriculum & Roster <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Subject Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Create New Subject
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubject}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Subject Title *</label>
                <input
                  id="title"
                  type="text"
                  className="form-input no-icon"
                  placeholder="e.g. Advanced Calculus"
                  value={newSubject.title}
                  onChange={(e) => setNewSubject({ ...newSubject, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="code">Subject Code</label>
                  <input
                    id="code"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. MATH-301"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="category">Category</label>
                  <input
                    id="category"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. Mathematics"
                    value={newSubject.category}
                    onChange={(e) => setNewSubject({ ...newSubject, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="desc">Course Overview / Syllabus</label>
                <textarea
                  id="desc"
                  rows={3}
                  className="form-input no-icon"
                  placeholder="Brief synopsis of what this class covers..."
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Soft Pastel Color Picker */}
              <div className="form-group">
                <label className="form-label">Pastel Accent Theme</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  {['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubject({ ...newSubject, color: c })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: newSubject.color === c ? '3px solid var(--text-main)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transform: newSubject.color === c ? 'scale(1.15)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSubjects;
