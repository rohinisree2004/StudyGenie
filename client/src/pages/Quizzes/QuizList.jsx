import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  HelpCircle,
  Clock,
  Play,
  Award,
  BookOpen,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  RotateCcw,
  BarChart2,
  GraduationCap,
  ChevronRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import quizService from '../../services/quizService';
import subjectService from '../../services/subjectService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/UI/PageHeader';

const DIFFICULTY_COLORS = {
  easy: { bg: 'var(--pastel-sky-subtle)', border: '#BBD0FF', text: '#1E4D8A' },
  medium: { bg: 'var(--pastel-lavender-subtle)', border: '#C8B6FF', text: '#342852' },
  hard: { bg: 'var(--pastel-pink-subtle)', border: '#FFD6FF', text: '#68245D' },
  adaptive: { bg: 'var(--pastel-mauve-subtle)', border: '#E7C6FF', text: '#4A2A6B' },
};

const QuizList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const activeTab = searchParams.get('tab') || 'practice'; // 'practice' | 'class' | 'history'

  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await subjectService.getSubjects(true);
        setSubjects(res.subjects || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch quizzes or attempts based on active tab
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'history') {
          const res = await quizService.getUserAttempts({
            subjectId: selectedSubject || undefined,
          });
          setAttempts(res.data || []);
        } else {
          const res = await quizService.getQuizzes({
            tab: activeTab,
            subjectId: selectedSubject || undefined,
            difficulty: selectedDifficulty || undefined,
            search: searchQuery || undefined,
          });
          setQuizzes(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load quiz data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, selectedSubject, selectedDifficulty, searchQuery]);

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header Banner */}
      <PageHeader
        badge="Gemini Assessment Engine"
        title="AI Quizzes & Knowledge Check"
        description="Test your mastery with curriculum-aligned AI quizzes generated from subjects, notes, and study materials."
        action={
          <Link
            to="/quizzes/new"
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Generate New AI Quiz</span>
          </Link>
        }
      />

      {/* Tabs Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('practice')}
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: '10px',
            border: 'none',
            backgroundColor:
              activeTab === 'practice' ? 'var(--pastel-lavender-subtle)' : 'transparent',
            color: activeTab === 'practice' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'practice' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Sparkles size={16} />
          <span>Practice Quizzes</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('class')}
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: '10px',
            border: 'none',
            backgroundColor:
              activeTab === 'class' ? 'var(--pastel-lavender-subtle)' : 'transparent',
            color: activeTab === 'class' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'class' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <GraduationCap size={16} />
          <span>Course / Class Quizzes</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: '10px',
            border: 'none',
            backgroundColor:
              activeTab === 'history' ? 'var(--pastel-lavender-subtle)' : 'transparent',
            color: activeTab === 'history' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'history' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Award size={16} />
          <span>My Attempt History</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '12px' }}
          />
          <input
            type="text"
            placeholder="Search quizzes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingTop: '0.55rem',
              paddingBottom: '0.55rem',
              borderRadius: '10px',
              fontSize: '0.86rem',
            }}
          />
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input-field"
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.84rem',
              minWidth: '170px',
            }}
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.title} ({sub.code || 'CODE'})
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          {activeTab !== 'history' && (
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input-field"
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.84rem',
              }}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="adaptive">Adaptive</option>
            </select>
          )}

          {(selectedSubject || selectedDifficulty || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSubject('');
                setSelectedDifficulty('');
                setSearchQuery('');
              }}
              className="btn btn-ghost"
              style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Quiz Cards Grid or Attempt History Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div
            className="animate-spin"
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #E7C6FF',
              borderTopColor: 'var(--brand-primary)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading quizzes...</p>
        </div>
      ) : activeTab === 'history' ? (
        /* Attempt History View */
        attempts.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: 'var(--text-muted)',
            }}
          >
            <Award size={42} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
              No Quiz Attempts Yet
            </h3>
            <p style={{ fontSize: '0.86rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Take practice or class quizzes to test your understanding, track scores, and view detailed explanations.
            </p>
            <button
              onClick={() => handleTabChange('practice')}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.86rem' }}
            >
              Browse Available Quizzes
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {attempts.map((att) => (
              <div
                key={att._id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  borderLeft: `5px solid ${att.passed ? '#16A34A' : '#DC2626'}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      {att.quiz?.title || 'Academic Quiz Attempt'}
                    </h3>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: att.passed ? '#DCFCE7' : '#FEE2E2',
                        color: att.passed ? '#166534' : '#991B1B',
                        fontWeight: 800,
                        fontSize: '0.74rem',
                      }}
                    >
                      {att.passed ? 'PASSED' : 'NEEDS REVISION'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {att.subject?.title && (
                      <span>Course: <strong>{att.subject.title}</strong></span>
                    )}
                    <span>Completed: {new Date(att.completedAt).toLocaleDateString()}</span>
                    <span>Time: {Math.round(att.timeTakenSeconds / 60)} min {att.timeTakenSeconds % 60}s</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: att.passed ? '#16A34A' : '#DC2626' }}>
                      {att.score}%
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {att.correctCount} / {att.totalQuestions} Correct
                    </div>
                  </div>

                  <Link
                    to={`/quizzes/${att.quiz?._id || att.quiz}/results/${att._id}`}
                    className="btn btn-outline"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>View Review</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Quizzes Grid View (Practice or Class) */
        quizzes.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: 'var(--text-muted)',
            }}
          >
            <Sparkles size={42} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
              {activeTab === 'class' ? 'No Class Quizzes Found' : 'No Practice Quizzes Found'}
            </h3>
            <p style={{ fontSize: '0.86rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
              {activeTab === 'class'
                ? 'Your instructors have not published quizzes for this subject yet.'
                : 'Generate your first personalized quiz with Gemini AI based on your notes or course syllabus!'}
            </p>
            <Link
              to="/quizzes/new"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.35rem', fontSize: '0.88rem' }}
            >
              Generate AI Quiz
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {quizzes.map((quiz) => {
              const diffStyle = DIFFICULTY_COLORS[quiz.difficulty] || DIFFICULTY_COLORS.medium;

              return (
                <div
                  key={quiz._id}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    borderTop: `4px solid ${diffStyle.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                  }}
                >
                  <div>
                    {/* Top Badges */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.65rem',
                      }}
                    >
                      <span
                        className="badge"
                        style={{
                          backgroundColor: diffStyle.bg,
                          color: diffStyle.text,
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {quiz.difficulty}
                      </span>

                      {quiz.creatorRole === 'teacher' ? (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'var(--pastel-sky-subtle)',
                            color: '#1E4D8A',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        >
                          Educator Assigned
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'var(--pastel-lavender-subtle)',
                            color: 'var(--brand-primary)',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        >
                          Self-Practice
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        margin: '0 0 0.4rem',
                        lineHeight: 1.35,
                      }}
                    >
                      {quiz.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        margin: '0 0 1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {quiz.description || 'AI curriculum knowledge check.'}
                    </p>

                    {/* Metadata Strip */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <HelpCircle size={13} />
                        <span>{quiz.totalQuestions} Questions</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} />
                        <span>{quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : 'Untimed'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Take Quiz Action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '0.85rem',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {quiz.subject?.code || quiz.subject?.title || 'Course'}
                    </span>

                    <Link
                      to={`/quizzes/${quiz._id}/take`}
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        borderRadius: '8px',
                      }}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Take Quiz</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default QuizList;
