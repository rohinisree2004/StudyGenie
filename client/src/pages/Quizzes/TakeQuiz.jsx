import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import quizService from '../../services/quizService';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Exam state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [flagged, setFlagged] = useState({}); // { [questionId]: boolean }
  const [startedAt, setStartedAt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const timerRef = useRef(null);

  // Load quiz in exam mode ('take')
  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        const res = await quizService.getQuizById(quizId, 'take');
        if (res.success && res.data) {
          const qData = res.data;
          setQuiz(qData);
          setStartedAt(new Date().toISOString());

          if (qData.timeLimit && qData.timeLimit > 0) {
            setSecondsRemaining(qData.timeLimit * 60);
          }
        }
      } catch (err) {
        console.error('Failed to load quiz:', err);
        setError(err.response?.data?.message || 'Could not load quiz.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Countdown timer effect
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [secondsRemaining]);

  const handleAutoSubmit = () => {
    alert('Time limit reached! Submitting your answers now.');
    handleSubmitExam();
  };

  const handleSelectOption = (questionId, optionIdx) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleToggleFlag = (questionId) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitExam = async () => {
    if (isSubmitting || !quiz) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const questions = quiz.questions || [];
    const formattedAnswers = questions.map((q) => ({
      questionId: q._id,
      selectedOptionIndex: userAnswers[q._id] !== undefined ? userAnswers[q._id] : null,
      timeSpentSeconds: 0,
    }));

    const timeSpentTotal = quiz.timeLimit && quiz.timeLimit > 0 && secondsRemaining !== null
      ? quiz.timeLimit * 60 - secondsRemaining
      : Math.round((Date.now() - new Date(startedAt || Date.now()).getTime()) / 1000);

    try {
      const res = await quizService.submitAttempt(quizId, {
        answers: formattedAnswers,
        timeTakenSeconds: Math.max(timeSpentTotal, 1),
        startedAt,
      });

      if (res.success && res.data) {
        navigate(`/quizzes/${quizId}/results/${res.data.attemptId}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      alert('Failed to submit quiz. Please try again.');
      setIsSubmitting(false);
      setSubmitModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div
          className="animate-spin"
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #E7C6FF',
            borderTopColor: 'var(--brand-primary)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Preparing your examination canvas...
        </p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={48} color="#DC2626" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Quiz Not Available
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '1.5rem' }}>
          {error || 'This quiz could not be loaded or has been deleted.'}
        </p>
        <Link to="/quizzes" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
          Return to Quizzes
        </Link>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentIndex] || {};
  const currentQId = currentQ._id;
  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[k] !== null && userAnswers[k] !== undefined
  ).length;

  const formatTimer = (secs) => {
    if (secs === null) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
      }}
      className="animate-fade-in"
    >
      {/* Top Test Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid var(--border-light)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span
              className="badge"
              style={{
                backgroundColor: 'var(--pastel-lavender-subtle)',
                color: 'var(--brand-primary)',
                fontWeight: 800,
                fontSize: '0.72rem',
              }}
            >
              {quiz.subject?.code || 'ACADEMIC'}
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {quiz.title}
            </h2>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Question {currentIndex + 1} of {questions.length} • {answeredCount} Answered
          </span>
        </div>

        {/* Timer & Submit CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {secondsRemaining !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                backgroundColor: secondsRemaining < 60 ? '#FEE2E2' : 'var(--pastel-pink-subtle)',
                color: secondsRemaining < 60 ? '#991B1B' : '#68245D',
                fontWeight: 800,
                fontSize: '0.88rem',
              }}
            >
              <Clock size={16} />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          )}

          <button
            onClick={() => setSubmitModalOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.86rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: '10px',
            }}
          >
            <Send size={14} />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Question Canvas (Left) + Question Palette (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left: Active Question Card */}
        <div
          className="card"
          style={{
            padding: '2rem',
            borderTop: '4px solid var(--brand-primary)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Question Metadata Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--pastel-lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#342852',
                }}
              >
                {currentIndex + 1}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                of {questions.length} Questions
              </span>
            </div>

            {/* Flag for Review Button */}
            <button
              onClick={() => handleToggleFlag(currentQId)}
              className="btn btn-ghost"
              style={{
                fontSize: '0.78rem',
                color: flagged[currentQId] ? '#D97706' : 'var(--text-muted)',
                gap: '0.35rem',
                padding: '0.3rem 0.6rem',
              }}
            >
              <Flag size={14} style={{ fill: flagged[currentQId] ? '#D97706' : 'none' }} />
              <span>{flagged[currentQId] ? 'Flagged for Review' : 'Flag Question'}</span>
            </button>
          </div>

          {/* Question Text */}
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
            }}
          >
            {currentQ.questionText}
          </h3>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
            {currentQ.options?.map((optText, optIdx) => {
              const isSelected = userAnswers[currentQId] === optIdx;
              const optionLetter = String.fromCharCode(65 + optIdx); // 'A', 'B', 'C', 'D'

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQId, optIdx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    backgroundColor: isSelected ? 'var(--pastel-lavender-subtle)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(200, 182, 255, 0.3)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#FBF9FE';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--brand-primary)' : 'var(--pastel-periwinkle-subtle)',
                      color: isSelected ? '#FFFFFF' : '#342852',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {optionLetter}
                  </div>

                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--brand-primary)' : 'var(--text-main)',
                      lineHeight: 1.45,
                    }}
                  >
                    {optText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '1.25rem',
            }}
          >
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="btn btn-outline"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.84rem',
                gap: '0.35rem',
                opacity: currentIndex === 0 ? 0.4 : 1,
              }}
            >
              <ArrowLeft size={15} />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.15rem', fontSize: '0.84rem', gap: '0.35rem' }}
              >
                <span>Next Question</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => setSubmitModalOpen(true)}
                className="btn btn-primary"
                style={{
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.84rem',
                  gap: '0.35rem',
                  backgroundColor: '#16A34A',
                  borderColor: '#16A34A',
                }}
              >
                <span>Review & Finish</span>
                <CheckCircle2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Question Palette Drawer */}
        <aside
          className="card"
          style={{
            padding: '1.25rem',
            borderTop: '4px solid var(--pastel-mauve)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 0.85rem',
            }}
          >
            Question Palette
          </h4>

          {/* Palette Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            {questions.map((q, idx) => {
              const isAnswered = userAnswers[q._id] !== undefined && userAnswers[q._id] !== null;
              const isFlag = flagged[q._id];
              const isCurrent = currentIndex === idx;

              let bgColor = '#F3F4F6';
              let borderColor = 'transparent';
              let textColor = '#4B5563';

              if (isAnswered) {
                bgColor = 'var(--pastel-lavender-subtle)';
                borderColor = 'var(--brand-primary)';
                textColor = 'var(--brand-primary)';
              }

              if (isFlag) {
                bgColor = '#FEF3C7';
                borderColor = '#D97706';
                textColor = '#92400E';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    height: '36px',
                    borderRadius: '8px',
                    border: isCurrent ? '2px solid #342852' : `1px solid ${borderColor}`,
                    backgroundColor: bgColor,
                    color: textColor,
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    position: 'relative',
                  }}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                  {isFlag && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#D97706',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--pastel-lavender-subtle)', border: '1px solid var(--brand-primary)' }} />
              <span>Answered ({answeredCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FEF3C7', border: '1px solid #D97706' }} />
              <span>Flagged ({Object.values(flagged).filter(Boolean).length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F3F4F6', border: '1px solid transparent' }} />
              <span>Unanswered ({questions.length - answeredCount})</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {submitModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card animate-scale-up"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--pastel-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Send size={24} color="#342852" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Submit Examination?
            </h3>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              {questions.length - answeredCount > 0 && (
                <span style={{ display: 'block', color: '#B91C1C', marginTop: '0.4rem', fontWeight: 600 }}>
                  ⚠️ You still have {questions.length - answeredCount} unanswered question(s)!
                </span>
              )}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="btn btn-outline"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.86rem' }}
                disabled={isSubmitting}
              >
                Back to Exam
              </button>

              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.4rem', fontSize: '0.86rem', fontWeight: 700 }}
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeQuiz;
