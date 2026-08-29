import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subjectService } from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import { ArrowLeft, BookOpen, Users, Plus, Trash2, Edit, Clock, X, CheckCircle2, AlertCircle, Sparkles, Megaphone, Pin } from 'lucide-react';
import announcementService from '../../services/announcementService';

const TeacherSubjectDetails = () => {
  const { subjectId } = useParams();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'roster' | 'announcements'
  const [isLoading, setIsLoading] = useState(true);

  // Topic Modal State
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    difficulty: 'intermediate',
    estimatedHours: 2,
    order: 1,
  });

  const [bannerMessage, setBannerMessage] = useState('');

  const loadDetails = async () => {
    try {
      const [data, announceRes] = await Promise.all([
        subjectService.getSubjectById(subjectId),
        announcementService.getAnnouncements({ subjectId }),
      ]);

      if (data.subject) {
        setSubject(data.subject);
        setTopics(data.subject.topics || []);
        setStudents(data.subject.enrolledStudents || []);
      }
      if (announceRes.success) {
        setAnnouncements(announceRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load subject details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [subjectId]);

  const handleOpenAddTopic = () => {
    setIsEditing(false);
    setCurrentTopicId(null);
    setTopicForm({
      title: '',
      description: '',
      difficulty: 'intermediate',
      estimatedHours: 2,
      order: topics.length + 1,
    });
    setShowTopicModal(true);
  };

  const handleOpenEditTopic = (topic) => {
    setIsEditing(true);
    setCurrentTopicId(topic.id);
    setTopicForm({
      title: topic.title,
      description: topic.description || '',
      difficulty: topic.difficulty || 'intermediate',
      estimatedHours: topic.estimatedHours || 2,
      order: topic.order || 1,
    });
    setShowTopicModal(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.title.trim()) return;

    try {
      if (isEditing) {
        await topicService.updateTopic(currentTopicId, topicForm);
        setBannerMessage('Topic updated successfully!');
      } else {
        await topicService.createTopic(subjectId, topicForm);
        setBannerMessage('Topic added to syllabus!');
      }
      setShowTopicModal(false);
      await loadDetails();
      setTimeout(() => setBannerMessage(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to save topic');
    }
  };

  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`Are you sure you want to delete topic "${topicTitle}"?`)) return;
    try {
      await topicService.deleteTopic(topicId);
      setBannerMessage(`Deleted topic "${topicTitle}"`);
      await loadDetails();
      setTimeout(() => setBannerMessage(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to delete topic');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center' }}>
        <h2>Subject not found</h2>
        <Link to="/teacher/subjects" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1020px', margin: '0 auto' }}>
      <Link
        to="/teacher/subjects"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.88rem',
          marginBottom: '1.5rem',
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={16} /> Back to My Classes
      </Link>

      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '2.25rem 2.5rem',
          marginBottom: '2rem',
          borderRadius: 'var(--radius-xl)',
          borderTop: `4px solid ${subject.color || 'var(--pastel-mauve)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-teacher">{subject.category || 'General'}</span>
          {subject.code && (
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {subject.code}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          {subject.title}
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          {subject.description || 'No subject syllabus description specified.'}
        </p>
      </div>

      {bannerMessage && (
        <div className="alert alert-success">
          <CheckCircle2 size={17} />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Tab Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('topics')}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: activeTab === 'topics' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'topics' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <BookOpen size={16} /> Syllabus Topics ({topics.length})
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: activeTab === 'roster' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'roster' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Users size={16} /> Enrolled Students ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: activeTab === 'announcements' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'announcements' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Megaphone size={16} /> Announcements ({announcements.length})
        </button>
      </div>

      {/* Tab 1: Topics & Curriculum */}
      {activeTab === 'topics' && (
        <div className="card" style={{ padding: '2rem 2.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Course Topics
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Structure concepts for student pacing and upcoming AI study generation
              </p>
            </div>
            <button onClick={handleOpenAddTopic} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Plus size={15} /> Add Topic
            </button>
          </div>

          {topics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No topics created yet. Click "Add Topic" to begin building the syllabus.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <div style={{ flex: 1, marginRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {index + 1}. {topic.title}
                      </span>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.68rem',
                          background:
                            topic.difficulty === 'advanced'
                              ? '#FFE4E6'
                              : topic.difficulty === 'intermediate'
                              ? 'var(--pastel-lavender-subtle)'
                              : 'var(--status-success-bg)',
                          color:
                            topic.difficulty === 'advanced'
                              ? '#9F1239'
                              : topic.difficulty === 'intermediate'
                              ? '#5B21B6'
                              : '#065F46',
                        }}
                      >
                        {topic.difficulty}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} /> {topic.estimatedHours}h
                      </span>
                    </div>

                    {topic.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {topic.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => handleOpenEditTopic(topic)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                      title="Edit Topic"
                    >
                      <Edit size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id, topic.title)}
                      className="btn btn-ghost"
                      style={{ padding: '0.4rem 0.65rem', color: 'var(--status-error-text)' }}
                      title="Delete Topic"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Enrolled Students Roster */}
      {activeTab === 'roster' && (
        <div className="card" style={{ padding: '2rem 2.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Enrolled Student Roster
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Students currently attending this curriculum
              </p>
            </div>
            <Link
              to={`/teacher/subjects/${subject._id}/students`}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            >
              <Users size={14} /> Full Class Monitoring & Roster →
            </Link>
          </div>

          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No students have enrolled in this class yet.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {students.map((student) => (
                <div
                  key={student._id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--pastel-sky)',
                      color: '#1E3264',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                    }}
                  >
                    {student.name ? student.name.charAt(0) : 'S'}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {student.email}
                    </div>
                    {student.institution && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {student.institution}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Course Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Course Announcements
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Notices broadcast to all students enrolled in {subject.title}
              </p>
            </div>
            <Link
              to="/teacher/announcements"
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
            >
              <Plus size={15} /> Post New Announcement
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <Megaphone size={32} color="#7E2A6A" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                No announcements for this class yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', maxWidth: '440px', margin: '0 auto 1rem auto' }}>
                Broadcast important syllabus updates, exam guidelines, and seminar reminders to all enrolled students.
              </p>
              <Link
                to="/teacher/announcements"
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.82rem' }}
              >
                <Plus size={15} /> Post First Announcement
              </Link>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                        <Pin size={11} /> Pinned
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
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
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: '0 0 0.75rem 0' }}>
                  {item.content}
                </p>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                  Read by <strong>{item.readCount || 0}</strong> of <strong>{item.totalEnrolled || 0}</strong> enrolled students
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add / Edit Topic Modal */}
      {showTopicModal && (
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
              maxWidth: '520px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {isEditing ? 'Edit Topic' : 'Add Syllabus Topic'}
              </h2>
              <button
                onClick={() => setShowTopicModal(false)}
                className="btn btn-ghost"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTopic}>
              <div className="form-group">
                <label className="form-label" htmlFor="topicTitle">Topic Title *</label>
                <input
                  id="topicTitle"
                  type="text"
                  className="form-input no-icon"
                  placeholder="e.g. Graph Traversal & Dijkstra's Algorithm"
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="difficulty">Difficulty</label>
                  <select
                    id="difficulty"
                    className="form-input no-icon"
                    value={topicForm.difficulty}
                    onChange={(e) => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="estHours">Est. Study Hours</label>
                  <input
                    id="estHours"
                    type="number"
                    min="0.5"
                    max="50"
                    step="0.5"
                    className="form-input no-icon"
                    value={topicForm.estimatedHours}
                    onChange={(e) => setTopicForm({ ...topicForm, estimatedHours: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="topicDesc">Topic Description / Objectives</label>
                <textarea
                  id="topicDesc"
                  rows={3}
                  className="form-input no-icon"
                  placeholder="Key concepts, formulas, or competencies covered..."
                  value={topicForm.description}
                  onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Add Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSubjectDetails;
