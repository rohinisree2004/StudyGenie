import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Clock,
  ArrowLeft,
  BookOpen,
  Layers,
  Filter,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  ChevronRight,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import quizService from '../../services/quizService';

const DIFFICULTY_BADGES = {
  easy: { bg: 'var(--pastel-sky-subtle)', border: '#BBD0FF', text: '#1E4D8A', label: 'Easy' },
  medium: { bg: 'var(--pastel-lavender-subtle)', border: '#C8B6FF', text: '#342852', label: 'Medium' },
  hard: { bg: 'var(--pastel-pink-subtle)', border: '#FFD6FF', text: '#68245D', label: 'Hard' },
  adaptive: { bg: 'var(--pastel-mauve-subtle)', border: '#E7C6FF', text: '#4A2A6B', label: 'Adaptive' },
};

const QuizResult = () => {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'incorrect' | 'correct'

  useEffect(() => {
    const fetchAttemptReview = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await quizService.getAttemptById(attemptId);
        if (res.success && res.data) {
          setAttemptData(res.data);
        } else {
          setError('Could not load examination results.');
        }
      } catch (err) {
        console.error('Error fetching quiz attempt result:', err);
        setError(err.response?.data?.message || 'Failed to load quiz results.');
      } finally {
        setIsLoading(false);
      }
    };

    if (attemptId) {
      fetchAttemptReview();
    }
  }, [attemptId]);

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
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Calculating Detailed Performance...
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Evaluating answer patterns and compiling comprehensive explanations
        </p>
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: '4rem auto',
          textAlign: 'center',
          padding: '2.5rem',
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Unable to Load Results
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {error || 'We could not locate this attempt record.'}
        </p>
        <Link
          to="/quizzes"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          Return to Quizzes
        </Link>
      </div>
    );
  }

  const {
    quizTitle,
    difficulty,
    subject,
    topic,
    score,
    correctCount,
    totalQuestions,
    passed,
    passingScore = 70,
    timeTakenSeconds = 0,
    feedback,
    questions = [],
  } = attemptData;

  const filteredQuestions = questions.filter((q) => {
    if (filterType === 'incorrect') return !q.isCorrect;
    if (filterType === 'correct') return q.isCorrect;
    return true;
  });

  const minutes = Math.floor(timeTakenSeconds / 60);
  const seconds = timeTakenSeconds % 60;
  const timeFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const diffBadge = DIFFICULTY_BADGES[difficulty] || DIFFICULTY_BADGES.medium;

  // Ask AI Assistant URL context
  const aiAssistantUrl = `/assistant?subjectId=${subject?._id || ''}&topicId=${topic?._id || ''}&prompt=${encodeURIComponent(
    `I just completed the quiz "${quizTitle}" and scored ${score}%. Can you explain the concepts I missed and test me on them?`
  )}`;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      {/* Back Navigation & Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <Link
          to="/quizzes"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={16} />
          Back to Quiz Hub
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              background: diffBadge.bg,
              border: `1px solid ${diffBadge.border}`,
              color: diffBadge.text,
            }}
          >
            {diffBadge.label}
          </span>
          {subject && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: 'var(--pastel-mauve-subtle)',
                border: '1px solid #E7C6FF',
                color: '#4A2A6B',
              }}
            >
              {subject.title}
            </span>
          )}
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF6FF 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid #E7C6FF',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: passed
              ? 'radial-gradient(circle, rgba(184, 192, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%)'
              : 'radial-gradient(circle, rgba(255, 214, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {/* Left: Score Circle & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: passed
                  ? 'linear-gradient(135deg, #E7C6FF 0%, #BBD0FF 100%)'
                  : 'linear-gradient(135deg, #FFD6FF 0%, #E7C6FF 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(200, 182, 255, 0.35)',
                border: '4px solid white',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: passed ? '#1E293B' : '#471441',
                  lineHeight: 1,
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {score}%
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'rgba(30, 41, 59, 0.75)',
                  marginTop: '0.2rem',
                }}
              >
                {passed ? 'Passed' : 'Needs Work'}
              </span>
            </div>

            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  marginBottom: '0.5rem',
                  background: passed ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${passed ? '#A7F3D0' : '#FECACA'}`,
                  color: passed ? '#065F46' : '#991B1B',
                }}
              >
                {passed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {passed ? `Mastered (Passing: ${passingScore}%)` : `Below Pass Target (${passingScore}%)`}
              </div>
              <h1
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  margin: '0 0 0.35rem',
                  lineHeight: 1.25,
                }}
              >
                {quizTitle}
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {topic?.title ? `Topic: ${topic.title}` : 'Adaptive Practice Assessment'}
              </p>
            </div>
          </div>

          {/* Right: Quick Stats Deck */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              background: 'white',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Correct
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10B981' }}>
                {correctCount}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  /{totalQuestions}
                </span>
              </span>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Time Taken
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {timeFormatted}
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Accuracy
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Qualitative AI Pedagogical Feedback */}
        {feedback && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(231, 198, 255, 0.25)',
              border: '1px solid #E7C6FF',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <Sparkles size={20} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                AI Learning Feedback
              </span>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                {feedback}
              </p>
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <Link
            to={`/quizzes/${quizId}/take`}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <RotateCcw size={16} />
            Retake Quiz
          </Link>

          <Link
            to={aiAssistantUrl}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: 'var(--pastel-lavender-subtle)',
              borderColor: '#C8B6FF',
              color: '#342852',
            }}
          >
            <MessageSquare size={16} color="var(--brand-primary)" />
            Review Concepts with AI Assistant
          </Link>

          <Link
            to="/quizzes/new"
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              marginLeft: 'auto',
            }}
          >
            <Sparkles size={16} color="var(--brand-primary)" />
            Generate New Quiz
          </Link>
        </div>
      </div>

      {/* Question Review Section Header & Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem' }}>
            Comprehensive Question Review
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Examine your selected choices alongside step-by-step AI rationale
          </p>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--surface-sunken)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => setFilterType('all')}
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              background: filterType === 'all' ? 'white' : 'transparent',
              color: filterType === 'all' ? 'var(--brand-primary)' : 'var(--text-muted)',
              boxShadow: filterType === 'all' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            All ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('incorrect')}
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              background: filterType === 'incorrect' ? 'white' : 'transparent',
              color: filterType === 'incorrect' ? '#DC2626' : 'var(--text-muted)',
              boxShadow: filterType === 'incorrect' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Incorrect ({totalQuestions - correctCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('correct')}
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              background: filterType === 'correct' ? 'white' : 'transparent',
              color: filterType === 'correct' ? '#10B981' : 'var(--text-muted)',
              boxShadow: filterType === 'correct' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Correct ({correctCount})
          </button>
        </div>
      </div>

      {/* Questions Deck */}
      {filteredQuestions.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-color)',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.75rem' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            No Questions Found Under This Filter
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            You got all questions right, or switched to an empty filter view!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredQuestions.map((q, idx) => {
            const questionNumber = questions.findIndex((orig) => orig._id === q._id) + 1;
            const isCorrect = q.isCorrect;
            const hasAnswered = q.selectedOptionIndex !== null && q.selectedOptionIndex !== undefined;

            return (
              <div
                key={q._id || idx}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: isCorrect ? '1.5px solid #A7F3D0' : '1.5px solid #FECACA',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                }}
              >
                {/* Question Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        background: isCorrect ? '#ECFDF5' : '#FEF2F2',
                        color: isCorrect ? '#065F46' : '#991B1B',
                        border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
                      }}
                    >
                      {questionNumber}
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        background: isCorrect ? '#ECFDF5' : '#FEF2F2',
                        color: isCorrect ? '#065F46' : '#991B1B',
                      }}
                    >
                      {isCorrect ? (
                        <>
                          <Check size={12} strokeWidth={3} /> Correct
                        </>
                      ) : (
                        <>
                          <X size={12} strokeWidth={3} />
                          {hasAnswered ? 'Incorrect' : 'Skipped'}
                        </>
                      )}
                    </span>

                    {q.difficulty && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                  }}
                >
                  {q.questionText}
                </h3>

                {/* Option Choices Deck */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  {q.options.map((option, optIdx) => {
                    const isOptionSelected = q.selectedOptionIndex === optIdx;
                    const isOptionCorrect = q.correctAnswerIndex === optIdx;

                    let optBg = 'var(--surface-sunken)';
                    let optBorder = 'var(--border-color)';
                    let optText = 'var(--text-main)';
                    let badgeNode = null;

                    if (isOptionSelected && isOptionCorrect) {
                      optBg = '#ECFDF5';
                      optBorder = '#10B981';
                      optText = '#065F46';
                      badgeNode = (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#065F46',
                            background: '#D1FAE5',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Check size={12} strokeWidth={3} /> Your Answer (Correct)
                        </span>
                      );
                    } else if (isOptionSelected && !isOptionCorrect) {
                      optBg = '#FEF2F2';
                      optBorder = '#EF4444';
                      optText = '#991B1B';
                      badgeNode = (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#991B1B',
                            background: '#FEE2E2',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <X size={12} strokeWidth={3} /> Your Answer (Incorrect)
                        </span>
                      );
                    } else if (isOptionCorrect) {
                      optBg = '#F0FDF4';
                      optBorder = '#34D399';
                      optText = '#065F46';
                      badgeNode = (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#065F46',
                            background: '#D1FAE5',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Check size={12} strokeWidth={3} /> Correct Answer
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: optBg,
                          border: `1.5px solid ${optBorder}`,
                          color: optText,
                          fontSize: '0.9rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: 'white',
                              border: `1px solid ${optBorder}`,
                              flexShrink: 0,
                            }}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span style={{ fontWeight: isOptionCorrect || isOptionSelected ? 600 : 400 }}>
                            {option}
                          </span>
                        </div>

                        {badgeNode}
                      </div>
                    );
                  })}
                </div>

                {/* AI Detailed Concept Explanation */}
                {q.explanation && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #FAF6FF 0%, #F5EFFF 100%)',
                      border: '1px solid #C8B6FF',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.15rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#342852',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <Lightbulb size={15} color="var(--brand-primary)" />
                      Pedagogical Explanation & Concept Note
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.86rem',
                        color: '#342852',
                        lineHeight: 1.5,
                      }}
                    >
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating or Bottom Navigation Footer */}
      <div
        style={{
          marginTop: '3rem',
          textAlign: 'center',
          padding: '2rem',
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Keep Practicing and Strengthening Your Mastery!
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Reinforce key theorems or generate another adaptive set to solidify your test readiness.
        </p>

        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          <Link
            to={`/quizzes/${quizId}/take`}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} />
            Retake This Quiz
          </Link>
          <Link
            to="/quizzes/new"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={16} color="var(--brand-primary)" />
            Create Another Quiz
          </Link>
          <Link
            to="/quizzes"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            View All Quizzes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
