import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  HelpCircle,
  BookOpen,
  Layers,
  FileText,
  PenTool,
  Clock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Bookmark,
} from 'lucide-react';
import quizService from '../../services/quizService';
import subjectService from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import noteService from '../../services/noteService';
import materialService from '../../services/materialService';
import summaryService from '../../services/summaryService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/UI/PageHeader';

const QUESTION_COUNTS = [3, 5, 10, 15, 20];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', badge: 'Recall', desc: 'Direct definitions and fundamental concepts' },
  { id: 'medium', label: 'Medium', badge: 'Application', desc: 'Standard exam problems and derivations' },
  { id: 'hard', label: 'Hard', badge: 'Synthesis', desc: 'Multi-step edge cases and rigorous proofs' },
  { id: 'adaptive', label: 'Adaptive', badge: 'Mixed', desc: 'Blend of foundational and advanced items' },
];

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Multiple Choice', desc: '4 options with 1 verified correct answer' },
  { id: 'true_false', label: 'True / False', desc: 'Binary verification testing conceptual accuracy' },
  { id: 'mixed', label: 'Mixed Format', desc: 'Combined multiple choice and true/false problems' },
];

const TIME_LIMITS = [
  { value: 0, label: 'Untimed (Self-Paced)' },
  { value: 5, label: '5 Minutes (Speed Check)' },
  { value: 10, label: '10 Minutes (Standard)' },
  { value: 15, label: '15 Minutes (Comprehensive)' },
  { value: 20, label: '20 Minutes (Deep Exam)' },
];

const QuizGenerator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Source Type: 'subject_topic' | 'note' | 'material' | 'summary' | 'custom'
  const [sourceType, setSourceType] = useState('subject_topic');

  // Source options data
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [notes, setNotes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [summaries, setSummaries] = useState([]);

  // Form selections
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedSummaryId, setSelectedSummaryId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');

  // Quiz parameters
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [timeLimit, setTimeLimit] = useState(10);
  const [isPublished, setIsPublished] = useState(true);

  // Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load subjects, notes, materials, summaries
  useEffect(() => {
    const init = async () => {
      try {
        const [subsRes, notesRes, matsRes, sumsRes] = await Promise.all([
          subjectService.getSubjects(true),
          noteService.getNotes(),
          materialService.getMaterials(),
          summaryService.getSummaries(),
        ]);

        const loadedSubjects = subsRes.subjects || [];
        setSubjects(loadedSubjects);
        setNotes(notesRes.notes || notesRes.data || []);
        setMaterials(matsRes.data || matsRes.materials || []);
        setSummaries(sumsRes.data || []);

        // Check query parameters
        const noteParam = searchParams.get('noteId');
        const materialParam = searchParams.get('materialId');
        const summaryParam = searchParams.get('summaryId');
        const subjectParam = searchParams.get('subjectId');

        if (noteParam) {
          setSourceType('note');
          setSelectedNoteId(noteParam);
          const matchedNote = (notesRes.notes || notesRes.data || []).find((n) => n._id === noteParam);
          if (matchedNote?.subject) setSelectedSubject(matchedNote.subject._id || matchedNote.subject);
        } else if (materialParam) {
          setSourceType('material');
          setSelectedMaterialId(materialParam);
          const matchedMat = (matsRes.data || matsRes.materials || []).find((m) => m._id === materialParam);
          if (matchedMat?.subject) setSelectedSubject(matchedMat.subject._id || matchedMat.subject);
        } else if (summaryParam) {
          setSourceType('summary');
          setSelectedSummaryId(summaryParam);
          const matchedSum = (sumsRes.data || []).find((s) => s._id === summaryParam);
          if (matchedSum?.subject) setSelectedSubject(matchedSum.subject._id || matchedSum.subject);
        } else if (subjectParam) {
          setSelectedSubject(subjectParam);
        } else if (loadedSubjects.length > 0) {
          setSelectedSubject(loadedSubjects[0]._id);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };

    init();
  }, [searchParams]);

  // Load topics whenever selectedSubject changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) {
        setTopics([]);
        setSelectedTopic('');
        return;
      }
      try {
        const res = await topicService.getTopicsBySubject(selectedSubject);
        setTopics(res.topics || []);
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    };
    fetchTopics();
  }, [selectedSubject]);

  const handleGenerate = async () => {
    setErrorMessage('');

    if (!selectedSubject) {
      setErrorMessage('Please select a course/subject for the quiz.');
      return;
    }

    if (sourceType === 'note' && !selectedNoteId) {
      setErrorMessage('Please select a personal note to generate questions from.');
      return;
    }

    if (sourceType === 'material' && !selectedMaterialId) {
      setErrorMessage('Please select a study material document.');
      return;
    }

    if (sourceType === 'summary' && !selectedSummaryId) {
      setErrorMessage('Please select a saved AI summary.');
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        title: customTitle.trim() || undefined,
        subjectId: selectedSubject,
        topicId: selectedTopic || undefined,
        sourceType,
        sourceId:
          sourceType === 'note'
            ? selectedNoteId
            : sourceType === 'material'
            ? selectedMaterialId
            : sourceType === 'summary'
            ? selectedSummaryId
            : undefined,
        customText: sourceType === 'custom' ? customText : undefined,
        totalQuestions,
        difficulty,
        questionType,
        timeLimit,
        isPublished: user?.role === 'teacher' ? isPublished : true,
      };

      const res = await quizService.generateQuiz(payload);

      if (res.success && res.data) {
        // Direct jump to Take Quiz canvas
        navigate(`/quizzes/${res.data._id}/take`);
      }
    } catch (err) {
      console.error('Generate quiz error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back Button */}
      <Link
        to="/quizzes"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.86rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        <ArrowLeft size={16} /> Back to Quizzes
      </Link>

      {/* Header */}
      <PageHeader
        badge="Gemini Pedagogical Engine"
        title="AI Quiz Generator"
        description="Configure your practice check: choose your source, question format, difficulty, and timer."
      />

      {/* Error Alert */}
      {errorMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Configurator Card */}
      <div
        className="card"
        style={{
          padding: '2rem',
          borderTop: '4px solid var(--pastel-lavender)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {/* Step 1: Source Selection */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
            }}
          >
            1. Quiz Source Content
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.65rem',
              marginBottom: '1.25rem',
            }}
          >
            {[
              { id: 'subject_topic', label: 'Subject Syllabus', icon: BookOpen },
              { id: 'note', label: 'My Notes', icon: PenTool },
              { id: 'material', label: 'Course Materials', icon: FileText },
              { id: 'summary', label: 'AI Summary', icon: Bookmark },
            ].map((s) => {
              const SIcon = s.icon;
              const isSelected = sourceType === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSourceType(s.id)}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    backgroundColor: isSelected ? 'var(--pastel-lavender-subtle)' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.84rem',
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-main)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <SIcon size={16} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cascading Subject & Topic Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Course / Subject <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', fontSize: '0.86rem' }}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.title} ({sub.code || 'CODE'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Specific Topic (Optional)
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedSubject || topics.length === 0}
                className="input-field"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  backgroundColor: !selectedSubject ? '#F3F4F6' : '#FFFFFF',
                }}
              >
                <option value="">-- All Subject Topics (Comprehensive) --</option>
                {topics.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-selectors for Notes, Materials, or Summaries */}
          {sourceType === 'note' && (
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Select Personal Note:
              </label>
              <select
                value={selectedNoteId}
                onChange={(e) => setSelectedNoteId(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', fontSize: '0.86rem' }}
              >
                <option value="">-- Select Note to Base Quiz On --</option>
                {notes.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {sourceType === 'material' && (
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Select Study Material:
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', fontSize: '0.86rem' }}
              >
                <option value="">-- Select Study Material Document --</option>
                {materials.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} [{m.fileType.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {sourceType === 'summary' && (
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Select AI Summary:
              </label>
              <select
                value={selectedSummaryId}
                onChange={(e) => setSelectedSummaryId(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', fontSize: '0.86rem' }}
              >
                <option value="">-- Select Saved AI Summary --</option>
                {summaries.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title} ({new Date(s.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 2: Question Count & Difficulty */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
            }}
          >
            2. Question Count & Difficulty
          </label>

          {/* Question Count Pills */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Number of Questions:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {QUESTION_COUNTS.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setTotalQuestions(cnt)}
                  className={`btn ${totalQuestions === cnt ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                  }}
                >
                  {cnt} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {DIFFICULTIES.map((d) => (
              <div
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border:
                    difficulty === d.id
                      ? '2px solid var(--brand-primary)'
                      : '1px solid var(--border-light)',
                  backgroundColor:
                    difficulty === d.id ? 'var(--pastel-lavender-subtle)' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {d.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--pastel-mauve)',
                      color: '#342852',
                    }}
                  >
                    {d.badge}
                  </span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Question Format & Timer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Question Format:
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', fontSize: '0.86rem' }}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Time Limit:
            </label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="input-field"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', fontSize: '0.86rem' }}
            >
              {TIME_LIMITS.map((tl) => (
                <option key={tl.value} value={tl.value}>
                  {tl.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Custom Quiz Title */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Custom Quiz Title (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g. Midterm Linear Algebra Self-Test"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="input-field"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', fontSize: '0.86rem' }}
          />
        </div>

        {/* Teacher Class Publishing Checkbox */}
        {user?.role === 'teacher' && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: 'var(--pastel-sky-subtle)',
              border: '1px solid #D0DCFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <input
              type="checkbox"
              id="publishToggle"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="publishToggle" style={{ fontSize: '0.84rem', color: '#16315E', cursor: 'pointer', fontWeight: 600 }}>
              Publish this quiz to the enrolled class roster (visible to all students in this course)
            </label>
          </div>
        )}

        {/* Generate Action Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn btn-primary"
          style={{
            padding: '1rem',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 16px rgba(200, 182, 255, 0.4)',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
          }}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Gemini is generating validated exam questions...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate AI Quiz & Begin Exam</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizGenerator;
