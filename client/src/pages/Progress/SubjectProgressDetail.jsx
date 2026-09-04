import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Layers,
  GraduationCap,
} from 'lucide-react';
import progressService from '../../services/progressService';

const DIFFICULTY_BADGES = {
  beginner: { bg: 'var(--pastel-sky-subtle)', border: '#BBD0FF', text: '#1E4D8A', label: 'Beginner' },
  intermediate: { bg: 'var(--pastel-lavender-subtle)', border: '#C8B6FF', text: '#342852', label: 'Intermediate' },
  advanced: { bg: 'var(--pastel-pink-subtle)', border: '#FFD6FF', text: '#68245D', label: 'Advanced' },
};

const STATUS_PILLS = {
  mastered: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', label: 'Mastered' },
  in_progress: { bg: 'var(--pastel-sky-subtle)', border: '#BBD0FF', text: '#1E4D8A', label: 'In Progress' },
  needs_revision: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', label: 'Needs Revision' },
  not_started: { bg: 'var(--surface-sunken)', border: 'var(--border-color)', text: 'var(--text-muted)', label: 'Not Started' },
};

const SubjectProgressDetail = () => {
  const { subjectId } = useParams();

  const [subjectData, setSubjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjectProgress = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await progressService.getSubjectProgress(subjectId);
        if (res.success && res.data) {
          setSubjectData(res.data);
        } else {
          setError('Could not retrieve subject analytics.');
        }
      } catch (err) {
        console.error('Error fetching subject detail progress:', err);
        setError(err.response?.data?.message || 'Failed to load subject progress.');
      } finally {
        setIsLoading(false);
      }
    };

    if (subjectId) {
      fetchSubjectProgress();
    }
  }, [subjectId]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div
          className="animate-spin"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #E7C6FF',
            borderTopColor: 'var(--brand-primary)',
            borderRadius: '50%',
            margin: '0 auto 1.25rem',
          }}
        />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Loading Subject Mastery Breakdown...
        </h3>
      </div>
    );
  }

  if (error || !subjectData) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Subject Not Available
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {error || 'We could not locate this course in your records.'}
        </p>
        <Link to="/progress" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Progress Hub
        </Link>
      </div>
    );
  }

  const { subject, summary, topics = [], tasks = [] } = subjectData;

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/progress"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={16} />
          Back to Progress Dashboard
        </Link>
      </div>

      {/* Subject Hero Header */}
      <div
        className="card"
        style={{
          padding: '2rem 2.25rem',
          borderRadius: 'var(--radius-xl)',
          borderTop: `4px solid ${subject.color || '#BBD0FF'}`,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8FF 100%)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-secondary)',
                }}
              >
                {subject.code || 'COURSE'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {subject.category || 'General'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>
              {subject.title}
            </h1>
            {subject.teacher && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                👨‍🏫 Taught by <strong>{subject.teacher.name}</strong> {subject.teacher.institution ? `(${subject.teacher.institution})` : ''}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Syllabus Completion
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-primary)', fontFamily: 'Outfit, sans-serif' }}>
              {summary.completionRate}%
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Topics Completed
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {summary.completedTopics} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {summary.totalTopics}</span>
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Study Hours Logged
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E4D8A' }}>
              {summary.totalStudyHours} hrs
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tasks Finished
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
              {summary.completedTasks} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {summary.totalTasks}</span>
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Quiz Average
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: summary.averageQuizScore >= 70 ? '#10B981' : '#E11D48' }}>
              {summary.averageQuizScore !== null ? `${summary.averageQuizScore}%` : 'No Attempts'}
            </span>
          </div>
        </div>
      </div>

      {/* Topic-by-Topic Drilldown Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>
              Syllabus Topics Breakdown ({topics.length})
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Track concept completion, practice quizzes, and mastery ratings
            </p>
          </div>

          <Link
            to={`/quizzes/new?subjectId=${subject._id}`}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <Sparkles size={14} /> Practice Subject Quiz
          </Link>
        </div>

        {topics.length === 0 ? (
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
            }}
          >
            <BookOpen size={36} color="var(--brand-primary)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              No Topics Published for this Subject
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Your educator has not yet added topic units to this course.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {topics.map((topic, idx) => {
              const diff = DIFFICULTY_BADGES[topic.difficulty] || DIFFICULTY_BADGES.intermediate;
              const statusPill = STATUS_PILLS[topic.status] || STATUS_PILLS.not_started;

              return (
                <div
                  key={topic._id || idx}
                  style={{
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    border: topic.status === 'needs_revision' ? '1.5px solid #FECACA' : '1px solid var(--border-color)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  {/* Left: Topic Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: '260px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        background: topic.isCompleted ? '#ECFDF5' : 'var(--surface-sunken)',
                        color: topic.isCompleted ? '#065F46' : 'var(--text-muted)',
                        border: `1px solid ${topic.isCompleted ? '#A7F3D0' : 'var(--border-color)'}`,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {topic.isCompleted ? <CheckCircle2 size={16} color="#10B981" /> : idx + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {topic.title}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: diff.bg,
                            border: `1px solid ${diff.border}`,
                            color: diff.text,
                          }}
                        >
                          {diff.label}
                        </span>
                      </div>

                      {topic.description && (
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, maxWidth: '500px' }}>
                          {topic.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Performance Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Study Time
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {topic.studyHours}h
                      </span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Quiz Score
                      </span>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: topic.averageQuizScore !== null ? (topic.averageQuizScore >= 70 ? '#10B981' : '#E11D48') : 'var(--text-muted)',
                        }}
                      >
                        {topic.averageQuizScore !== null ? `${topic.averageQuizScore}%` : '—'}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        background: statusPill.bg,
                        border: `1px solid ${statusPill.border}`,
                        color: statusPill.text,
                      }}
                    >
                      {statusPill.label}
                    </span>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link
                      to={`/quizzes/new?topicId=${topic._id}&subjectId=${subject._id}`}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      title="Practice this topic with a quiz"
                    >
                      <HelpCircle size={13} color="var(--brand-primary)" />
                      Quiz
                    </Link>

                    <Link
                      to={`/assistant?subjectId=${subject._id}&topicId=${topic._id}&prompt=${encodeURIComponent(`Explain key concepts for ${topic.title} simply`)}`}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      title="Ask AI Assistant about this topic"
                    >
                      <MessageSquare size={13} color="var(--brand-primary)" />
                      Explain
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subject Tasks List */}
      {tasks.length > 0 && (
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem 1.75rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Course Tasks & Assignments ({tasks.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tasks.map((task) => (
              <div
                key={task._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-sunken)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={16} color={task.isCompleted ? '#10B981' : '#94A3B8'} />
                  <span style={{ fontWeight: 600, color: task.isCompleted ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                    {task.title}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: task.isCompleted ? '#065F46' : 'var(--text-muted)',
                  }}
                >
                  {task.isCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectProgressDetail;
