import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { subjectService } from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import { ArrowLeft, BookOpen, User, Clock, CheckCircle2, Circle, Award, Check, Megaphone, Pin } from 'lucide-react';
import announcementService from '../../services/announcementService';

const StudentSubjectDetails = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'announcements'
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchDetails = async () => {
    try {
      const [data, announceRes] = await Promise.all([
        subjectService.getSubjectById(subjectId),
        announcementService.getAnnouncements({ subjectId }),
      ]);

      if (data.subject) {
        setSubject(data.subject);
        setTopics(data.subject.topics || []);
        setProgress(data.subject.progress || 0);
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
    fetchDetails();
  }, [subjectId]);

  const handleToggleTopic = async (topicId) => {
    setTogglingId(topicId);
    try {
      const res = await topicService.toggleCompletion(topicId);
      // Update local state
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, isCompleted: res.isCompleted } : t))
      );
      if (res.progress !== undefined) {
        setProgress(res.progress);
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle completion');
    } finally {
      setTogglingId(null);
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
        <Link to="/subjects" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to My Subjects
        </Link>
      </div>
    );
  }

  const completedCount = topics.filter((t) => t.isCompleted).length;

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back navigation */}
      <Link
        to="/subjects"
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
        <ArrowLeft size={16} /> Back to My Subjects
      </Link>

      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '2.25rem 2.5rem',
          marginBottom: '2rem',
          borderRadius: 'var(--radius-xl)',
          borderTop: `4px solid ${subject.color || 'var(--pastel-sky)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-student">{subject.category || 'General'}</span>
          {subject.code && (
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {subject.code}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          {subject.title}
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {subject.description || 'No subject syllabus description specified.'}
        </p>

        {/* Progress & Instructor bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--pastel-lavender)',
                color: '#342656',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {subject.teacher?.name ? subject.teacher.name.charAt(0) : 'T'}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {subject.teacher?.name || 'Assigned Educator Pending'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {subject.teacher?.institution || 'Faculty Member'}
              </div>
            </div>
          </div>

          {/* Progress Pill */}
          <div style={{ minWidth: '220px', flex: 1, maxWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Overall Syllabus Completion</span>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '7px', backgroundColor: '#E9EDF5', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: 'var(--brand-primary)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {completedCount} of {topics.length} topics finished
            </div>
          </div>
        </div>
      </div>

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
          type="button"
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
          type="button"
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
          <Megaphone size={16} /> Class Announcements ({announcements.length})
        </button>
      </div>

      {/* Tab 1: Topics Checklist Section */}
      {activeTab === 'topics' && (
        <div className="card" style={{ padding: '2rem 2.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Topics & Learning Milestones
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Check off concepts as you master them to update your study streak
              </p>
            </div>
            <span className="badge badge-student" style={{ fontSize: '0.8rem' }}>
              {topics.length} Topics
            </span>
          </div>

          {topics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No topics have been published for this syllabus yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  onClick={() => handleToggleTopic(topic.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1.15rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: topic.isCompleted ? '1px solid #C4D7FF' : '1px solid var(--border-light)',
                    backgroundColor: topic.isCompleted ? 'var(--pastel-sky-subtle)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {topic.isCompleted ? (
                      <CheckCircle2 size={20} color="var(--brand-primary)" />
                    ) : (
                      <Circle size={20} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Unit {index + 1}
                        </span>
                        <h3
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: topic.isCompleted ? 'var(--text-secondary)' : 'var(--text-main)',
                            textDecoration: topic.isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {topic.title}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor:
                              topic.difficulty === 'advanced'
                                ? '#FEE2E2'
                                : topic.difficulty === 'intermediate'
                                ? '#FEF3C7'
                                : '#D1FAE5',
                            color:
                              topic.difficulty === 'advanced'
                                ? '#991B1B'
                                : topic.difficulty === 'intermediate'
                                ? '#92400E'
                                : '#065F46',
                          }}
                        >
                          {topic.difficulty}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={12} /> {topic.estimatedHours}h
                        </span>
                      </div>
                    </div>

                    {topic.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.2rem' }}>
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Class Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
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
                No announcements posted yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                Your instructor will broadcast important exam dates, room changes, and problem sets here.
              </p>
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
                  Posted by {item.teacher?.name || 'Educator'}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudentSubjectDetails;
