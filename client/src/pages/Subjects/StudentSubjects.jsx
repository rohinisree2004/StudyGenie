import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subjectService } from '../../services/subjectService';
import { BookOpen, Plus, Search, CheckCircle2, User, Clock, ArrowRight, X, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/UI/PageHeader';

const StudentSubjects = () => {
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [catalogSubjects, setCatalogSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bannerMessage, setBannerMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [enrolledRes, catalogRes] = await Promise.all([
        subjectService.getSubjects(false),
        subjectService.getSubjects(true),
      ]);
      setEnrolledSubjects(enrolledRes.subjects || []);
      setCatalogSubjects(catalogRes.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (subjectId) => {
    setActionLoadingId(subjectId);
    try {
      await subjectService.enroll(subjectId);
      setBannerMessage('Enrolled in subject successfully! 🎉');
      await loadData();
      setTimeout(() => setBannerMessage(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to enroll');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnenroll = async (subjectId, subjectTitle) => {
    if (!window.confirm(`Are you sure you want to drop ${subjectTitle}?`)) return;
    setActionLoadingId(subjectId);
    try {
      await subjectService.unenroll(subjectId);
      setBannerMessage(`Dropped ${subjectTitle}`);
      await loadData();
      setTimeout(() => setBannerMessage(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to unenroll');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCatalog = catalogSubjects.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Top Header */}
      <PageHeader
        badge="Academic Curriculum"
        title="My Enrolled Subjects"
        description="Track your coursework, topics, assignments, and syllabus completion."
        action={
          <button
            onClick={() => setShowExploreModal(true)}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={16} /> Explore & Enroll
          </button>
        }
      />

      {bannerMessage && (
        <div className="alert alert-success">
          <CheckCircle2 size={17} />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Enrolled Subjects Grid */}
      {isLoading ? (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : enrolledSubjects.length === 0 ? (
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
              background: 'var(--pastel-sky-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <BookOpen size={26} color="#254382" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No enrolled subjects yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            Explore available university or school subjects to begin tracking syllabus topics and generating study plans.
          </p>
          <button onClick={() => setShowExploreModal(true)} className="btn btn-primary">
            Browse Subject Directory
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
          {enrolledSubjects.map((subject) => (
            <div
              key={subject.id}
              className="card"
              style={{
                borderRadius: 'var(--radius-lg)',
                borderTop: `4px solid ${subject.color || 'var(--pastel-sky)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span className="badge badge-student" style={{ fontSize: '0.72rem' }}>
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

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Syllabus Mastery</span>
                    <span style={{ color: 'var(--brand-primary)' }}>{subject.progress || 0}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#E9EDF5', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${subject.progress || 0}%`,
                        height: '100%',
                        backgroundColor: 'var(--brand-primary)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Instructor details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  <User size={14} />
                  <span>Educator: {subject.teacher?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <Link
                  to={`/subjects/${subject.id}`}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.85rem', padding: '0.55rem' }}
                >
                  Study Topics ({subject.topicCount || 0}) <ArrowRight size={14} />
                </Link>
                <button
                  onClick={() => handleUnenroll(subject.id, subject.title)}
                  disabled={actionLoadingId === subject.id}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.8rem', color: 'var(--status-error-text)', padding: '0.55rem 0.75rem' }}
                  title="Drop Subject"
                >
                  Drop
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explore & Enroll Catalog Modal */}
      {showExploreModal && (
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
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Explore Course Catalog
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Enroll in courses to unlock topics and AI revision planning
                </p>
              </div>
              <button
                onClick={() => setShowExploreModal(false)}
                className="btn btn-ghost"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search filter input */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div className="input-wrapper">
                <Search className="input-icon-left" size={17} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by title, subject code, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px' }}>
              {filteredCatalog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No subjects match your search.
                </div>
              ) : (
                filteredCatalog.map((subj) => {
                  const isAlreadyEnrolled = enrolledSubjects.some((s) => s.id === subj.id);
                  return (
                    <div
                      key={subj.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-subtle)',
                        borderLeft: `4px solid ${subj.color || 'var(--pastel-sky)'}`,
                      }}
                    >
                      <div style={{ flex: 1, marginRight: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {subj.title}
                          </span>
                          {subj.code && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              ({subj.code})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {subj.category} • {subj.topicCount || 0} topics • Instructor: {subj.teacher?.name || 'Unassigned'}
                        </div>
                      </div>

                      {isAlreadyEnrolled ? (
                        <span
                          className="badge badge-active"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                        >
                          Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnroll(subj.id)}
                          disabled={actionLoadingId === subj.id}
                          className="btn btn-primary"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                        >
                          {actionLoadingId === subj.id ? 'Enrolling...' : 'Enroll'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;
