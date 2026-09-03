import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  BookOpen,
  Layers,
  Save,
  Copy,
  Check,
  Trash2,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  PenTool,
  Download,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Zap,
  Target,
  Brain,
  Bookmark,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Folder,
} from 'lucide-react';
import summaryService from '../../services/summaryService';
import noteService from '../../services/noteService';
import materialService from '../../services/materialService';
import subjectService from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import PageHeader from '../../components/UI/PageHeader';

const FOCUS_MODES = [
  {
    id: 'balanced',
    label: 'Balanced Synthesis',
    badge: 'Standard',
    description: 'Equal blend of conceptual intuition, core definitions, and key takeaways.',
    color: '#C8B6FF',
  },
  {
    id: 'exam',
    label: 'High-Yield Exam Cram',
    badge: 'Exam Prep',
    description: 'Prioritizes testable formulas, active recall questions, and common pitfalls.',
    color: '#FFD6FF',
  },
  {
    id: 'deep_dive',
    label: 'Theoretical Deep Dive',
    badge: 'In-Depth',
    description: 'Granular mathematical breakdowns, formal definitions, and edge cases.',
    color: '#B8C0FF',
  },
];

const AISummarizer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Source Tab: 'note' | 'material' | 'custom'
  const [sourceType, setSourceType] = useState('note');

  // Source options data
  const [notes, setNotes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Selected source items
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customSubjectId, setCustomSubjectId] = useState('');
  const [customTopicId, setCustomTopicId] = useState('');

  // Generation options
  const [focusMode, setFocusMode] = useState('balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [activeTab, setActiveTab] = useState('executive'); // 'executive' | 'key_points' | 'terms' | 'revision'
  const [summaryViewType, setSummaryViewType] = useState('short'); // 'short' | 'detailed'

  // Saved Library Drawer
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedSearch, setSavedSearch] = useState('');

  // UI States
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [copiedItem, setCopiedItem] = useState(null);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3500);
  };

  // Load initial notes, materials, subjects
  useEffect(() => {
    const loadSources = async () => {
      try {
        const [notesRes, matsRes, subsRes] = await Promise.all([
          noteService.getNotes(),
          materialService.getMaterials(),
          subjectService.getSubjects(true),
        ]);

        setNotes(notesRes.notes || notesRes.data || []);
        setMaterials(matsRes.data || matsRes.materials || []);
        setSubjects(subsRes.subjects || []);
      } catch (err) {
        console.error('Failed to load sources for summarizer:', err);
      }
    };
    loadSources();
  }, []);

  // Handle URL search params on initial load
  useEffect(() => {
    const noteIdParam = searchParams.get('noteId');
    const materialIdParam = searchParams.get('materialId');
    const summaryIdParam = searchParams.get('summaryId');

    if (noteIdParam) {
      setSourceType('note');
      setSelectedNoteId(noteIdParam);
    } else if (materialIdParam) {
      setSourceType('material');
      setSelectedMaterialId(materialIdParam);
    } else if (summaryIdParam) {
      loadSingleSummary(summaryIdParam);
    }
  }, [searchParams]);

  // Load topics when custom subject changes
  useEffect(() => {
    const loadTopics = async () => {
      if (!customSubjectId) {
        setTopics([]);
        setCustomTopicId('');
        return;
      }
      try {
        const res = await topicService.getTopicsBySubject(customSubjectId);
        setTopics(res.topics || []);
      } catch (err) {
        console.error('Failed to fetch topics:', err);
      }
    };
    loadTopics();
  }, [customSubjectId]);

  // Load saved summaries library
  const loadSavedSummaries = async () => {
    setIsLoadingSaved(true);
    try {
      const res = await summaryService.getSummaries();
      if (res.success) {
        setSavedSummaries(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load saved summaries:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    loadSavedSummaries();
  }, []);

  // Load a single summary from ID
  const loadSingleSummary = async (id) => {
    try {
      const res = await summaryService.getSummaryById(id);
      if (res.success && res.data) {
        const s = res.data;
        setSummaryData({
          summaryId: s._id,
          title: s.title,
          sourceType: s.sourceType,
          noteId: s.note?._id,
          materialId: s.material?._id,
          subject: s.subject,
          topic: s.topic,
          originalContentSnippet: s.originalContentSnippet,
          shortSummary: s.shortSummary,
          detailedSummary: s.detailedSummary,
          keyPoints: s.keyPoints,
          importantTerms: s.importantTerms,
          revisionNotes: s.revisionNotes,
          focusMode: s.focusMode,
          aiModel: s.aiModel,
          isSaved: true,
        });
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
      showToast('error', 'Could not load saved summary.');
    }
  };

  // Generate Summary Action
  const handleGenerateSummary = async () => {
    // Validate inputs
    if (sourceType === 'note' && !selectedNoteId) {
      showToast('error', 'Please select a note to summarize.');
      return;
    }
    if (sourceType === 'material' && !selectedMaterialId) {
      showToast('error', 'Please select a study material to summarize.');
      return;
    }
    if (sourceType === 'custom' && (!customContent || !customContent.trim())) {
      showToast('error', 'Please provide text content to summarize.');
      return;
    }

    setIsGenerating(true);
    setSummaryData(null);
    setRevealedAnswers({});

    try {
      const payload = {
        sourceType,
        focusMode,
        noteId: sourceType === 'note' ? selectedNoteId : undefined,
        materialId: sourceType === 'material' ? selectedMaterialId : undefined,
        title: sourceType === 'custom' ? customTitle || 'Custom Study Excerpt' : undefined,
        content: sourceType === 'custom' ? customContent : undefined,
        subjectId: sourceType === 'custom' ? customSubjectId || undefined : undefined,
        topicId: sourceType === 'custom' ? customTopicId || undefined : undefined,
        autoSave: false,
      };

      const res = await summaryService.generateSummary(payload);

      if (res.success && res.data) {
        setSummaryData(res.data);
        setActiveTab('executive');
        showToast('success', 'Summary generated successfully with Gemini AI! ✨');
      }
    } catch (err) {
      console.error('Summary generation error:', err);
      showToast('error', err.response?.data?.message || 'Failed to generate summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Generated Summary
  const handleSaveSummary = async () => {
    if (!summaryData || isSaving) return;
    setIsSaving(true);
    try {
      const res = await summaryService.saveSummary({
        title: summaryData.title,
        sourceType: summaryData.sourceType,
        noteId: summaryData.noteId,
        materialId: summaryData.materialId,
        subjectId: summaryData.subject?._id,
        topicId: summaryData.topic?._id,
        shortSummary: summaryData.shortSummary,
        detailedSummary: summaryData.detailedSummary,
        keyPoints: summaryData.keyPoints,
        importantTerms: summaryData.importantTerms,
        revisionNotes: summaryData.revisionNotes,
        focusMode: summaryData.focusMode,
        originalContentSnippet: summaryData.originalContentSnippet,
        aiModel: summaryData.aiModel,
      });

      if (res.success) {
        setSummaryData((prev) => ({ ...prev, summaryId: res.data._id, isSaved: true }));
        loadSavedSummaries();
        showToast('success', 'Summary saved to your study library! 💾');
      }
    } catch (err) {
      console.error('Failed to save summary:', err);
      showToast('error', 'Failed to save summary to library.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Note
  const handleExportToNote = async () => {
    if (!summaryData) return;

    // If summary is already saved, use endpoint, or navigate with query params
    if (summaryData.summaryId) {
      setIsExporting(true);
      try {
        const res = await summaryService.exportToNote(summaryData.summaryId);
        if (res.success) {
          showToast('success', 'Note created! Redirecting to Note editor...');
          setTimeout(() => navigate(`/notes/${res.data.noteId}`), 1200);
        }
      } catch (err) {
        console.error('Export failed:', err);
        showToast('error', 'Failed to export note.');
      } finally {
        setIsExporting(false);
      }
    } else {
      // Auto-save first then export
      await handleSaveSummary();
    }
  };

  // Delete a saved summary
  const handleDeleteSaved = async (e, summaryId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved summary?')) return;
    try {
      const res = await summaryService.deleteSummary(summaryId);
      if (res.success) {
        loadSavedSummaries();
        if (summaryData?.summaryId === summaryId) {
          setSummaryData((prev) => ({ ...prev, isSaved: false, summaryId: null }));
        }
        showToast('success', 'Summary deleted from library.');
      }
    } catch (err) {
      console.error('Failed to delete summary:', err);
      showToast('error', 'Failed to delete summary.');
    }
  };

  // Copy full summary
  const handleCopyAll = () => {
    if (!summaryData) return;
    let fullText = `# ${summaryData.title}\n\n`;
    fullText += `## Short Summary\n${summaryData.shortSummary}\n\n`;
    fullText += `## Detailed Summary\n${summaryData.detailedSummary}\n\n`;
    if (summaryData.keyPoints?.length) {
      fullText += `## Key Takeaways\n${summaryData.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`;
    }
    if (summaryData.importantTerms?.length) {
      fullText += `## Key Terms\n${summaryData.importantTerms.map((t) => `- **${t.term}**: ${t.definition}`).join('\n')}\n\n`;
    }
    if (summaryData.revisionNotes?.length) {
      fullText += `## Active Recall Questions\n${summaryData.revisionNotes
        .map((r, i) => `${i + 1}. Q: ${r.question}\n   A: ${r.answer}\n   Tip: ${r.tip}`)
        .join('\n\n')}`;
    }

    navigator.clipboard.writeText(fullText);
    setCopiedItem('all');
    setTimeout(() => setCopiedItem(null), 2000);
    showToast('success', 'Complete summary copied to clipboard! 📋');
  };

  // Toggle reveal answer in revision notes
  const toggleAnswer = (idx) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Filtered saved summaries
  const filteredSaved = savedSummaries.filter((s) => {
    if (!savedSearch) return true;
    return s.title.toLowerCase().includes(savedSearch.toLowerCase());
  });

  // Currently selected source objects for preview
  const currentNoteObj = notes.find((n) => n._id === selectedNoteId);
  const currentMaterialObj = materials.find((m) => m._id === selectedMaterialId);

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Toast Notification */}
      {notification.message && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: notification.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            border: notification.type === 'error' ? '1px solid #FECACA' : '1px solid #BBF7D0',
            color: notification.type === 'error' ? '#991B1B' : '#166534',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <PageHeader
        badge="Gemini Pedagogical Engine"
        title="AI Content Summarizer"
        description="Convert lecture notes and study materials into executive summaries, key takeaways, terms, and active recall revision flashcards."
        action={
          <button
            onClick={() => setSavedDrawerOpen(!savedDrawerOpen)}
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderColor: 'var(--pastel-lavender)',
              backgroundColor: savedDrawerOpen ? 'var(--pastel-lavender-subtle)' : '#FFFFFF',
            }}
          >
            <Bookmark size={16} color="var(--brand-primary)" />
            <span>My Saved Summaries ({savedSummaries.length})</span>
          </button>
        }
      />

      {/* Main Grid: Source Configurator & Results / Library */}
      <div className={`summarizer-layout ${savedDrawerOpen ? 'drawer-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* ========================================================================= */}
          {/* 1. SOURCE SELECTOR & CONFIGURATION CARD                                  */}
          {/* ========================================================================= */}
          <div
            className="card"
            style={{
              padding: '1.75rem',
              borderTop: '4px solid var(--pastel-lavender)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Step 1: Select Source Type Tabs */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.65rem',
                }}
              >
                1. Select Academic Source
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSourceType('note')}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border:
                      sourceType === 'note'
                        ? '2px solid var(--brand-primary)'
                        : '1px solid var(--border-light)',
                    backgroundColor:
                      sourceType === 'note' ? 'var(--pastel-lavender-subtle)' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <PenTool size={18} color="var(--brand-primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      From My Notes
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {notes.length} note{notes.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('material')}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border:
                      sourceType === 'material'
                        ? '2px solid var(--brand-primary)'
                        : '1px solid var(--border-light)',
                    backgroundColor:
                      sourceType === 'material' ? 'var(--pastel-lavender-subtle)' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <BookOpen size={18} color="var(--brand-primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      From Study Materials
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {materials.length} material{materials.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('custom')}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border:
                      sourceType === 'custom'
                        ? '2px solid var(--brand-primary)'
                        : '1px solid var(--border-light)',
                    backgroundColor:
                      sourceType === 'custom' ? 'var(--pastel-lavender-subtle)' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileText size={18} color="var(--brand-primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      Paste Custom Text
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Excerpts or syllabus
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Content Selection Form */}
            <div style={{ marginBottom: '1.5rem' }}>
              {sourceType === 'note' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Choose Note:
                  </label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                    }}
                  >
                    <option value="">-- Select a Personal Note --</option>
                    {notes.map((note) => (
                      <option key={note._id} value={note._id}>
                        {note.title} {note.subject ? `(${note.subject.title || 'Course'})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Note Preview Snippet */}
                  {currentNoteObj && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--pastel-mauve-subtle)',
                        border: '1px solid #E4DCF0',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Note Preview:</span>
                        {currentNoteObj.subject?.title && (
                          <span className="badge" style={{ backgroundColor: '#E7C6FF', color: '#342852' }}>
                            {currentNoteObj.subject.title}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>
                        "{currentNoteObj.content?.slice(0, 200)}..."
                      </p>
                    </div>
                  )}
                </div>
              )}

              {sourceType === 'material' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Choose Course Study Material:
                  </label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                    }}
                  >
                    <option value="">-- Select a Study Material Document --</option>
                    {materials.map((mat) => (
                      <option key={mat._id} value={mat._id}>
                        {mat.title} [{mat.fileType.toUpperCase()}] {mat.subject?.code ? `(${mat.subject.code})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Material Preview Snippet */}
                  {currentMaterialObj && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--pastel-sky-subtle)',
                        border: '1px solid #D5E1F7',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Material Details:</span>
                        <span className="badge" style={{ backgroundColor: '#BBD0FF', color: '#16315E' }}>
                          {currentMaterialObj.fileType.toUpperCase()}
                        </span>
                        {currentMaterialObj.subject?.title && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {currentMaterialObj.subject.title}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.45 }}>
                        {currentMaterialObj.description || 'Verified course curriculum document.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {sourceType === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Document or Excerpt Title (e.g. Chapter 4: Eigenvalues)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="input-field"
                    style={{ padding: '0.6rem', borderRadius: '8px', fontSize: '0.88rem' }}
                  />

                  <textarea
                    rows={6}
                    placeholder="Paste academic notes, textbook excerpt, or lecture transcript here..."
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    className="input-field"
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      resize: 'vertical',
                      lineHeight: 1.5,
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Character Count: {customContent.length} / 25,000</span>
                    <span>Supports LaTeX notation, code blocks, and outline text</span>
                  </div>

                  {/* Optional Subject Context */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <select
                      value={customSubjectId}
                      onChange={(e) => setCustomSubjectId(e.target.value)}
                      className="input-field"
                      style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.82rem' }}
                    >
                      <option value="">-- Optional: Assign Subject Context --</option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.title} ({s.code || 'CODE'})
                        </option>
                      ))}
                    </select>

                    <select
                      value={customTopicId}
                      onChange={(e) => setCustomTopicId(e.target.value)}
                      disabled={!customSubjectId || topics.length === 0}
                      className="input-field"
                      style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.82rem' }}
                    >
                      <option value="">-- Optional: Assign Topic --</option>
                      {topics.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Focus Mode Selector */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.65rem',
                }}
              >
                2. Summarization Focus Mode
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {FOCUS_MODES.map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setFocusMode(mode.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border:
                        focusMode === mode.id
                          ? '2px solid var(--brand-primary)'
                          : '1px solid var(--border-light)',
                      borderTop: `4px solid ${mode.color}`,
                      backgroundColor:
                        focusMode === mode.id ? 'var(--pastel-lavender-subtle)' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        {mode.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: mode.color,
                          color: '#342852',
                        }}
                      >
                        {mode.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {mode.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 14px rgba(200, 182, 255, 0.4)',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Genie is analyzing document & generating synthesis...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate AI Summary with Gemini</span>
                </>
              )}
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 2. RESULTS PRESENTATION DECK (5 SECTIONS)                                 */}
          {/* ========================================================================= */}
          {summaryData && (
            <div
              className="card"
              style={{
                padding: '1.75rem',
                borderTop: '4px solid var(--pastel-mauve)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Result Header & Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '1rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h2
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        margin: 0,
                      }}
                    >
                      {summaryData.title}
                    </h2>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'var(--pastel-lavender-subtle)',
                        color: 'var(--brand-primary)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      {summaryData.aiModel || 'Gemini'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Source: <strong style={{ textTransform: 'capitalize' }}>{summaryData.sourceType}</strong>
                    {summaryData.subject?.title ? ` • ${summaryData.subject.title}` : ''}
                    {summaryData.topic?.title ? ` > ${summaryData.topic.title}` : ''}
                  </div>
                </div>

                {/* Toolbar Buttons: Save, Export to Note, Copy All */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleCopyAll}
                    className="btn btn-outline"
                    style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', gap: '0.35rem' }}
                    title="Copy full markdown summary"
                  >
                    {copiedItem === 'all' ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                    <span>{copiedItem === 'all' ? 'Copied' : 'Copy All'}</span>
                  </button>

                  <button
                    onClick={handleExportToNote}
                    disabled={isExporting}
                    className="btn btn-outline"
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      gap: '0.35rem',
                      borderColor: 'var(--pastel-mauve)',
                      backgroundColor: 'var(--pastel-mauve-subtle)',
                      color: 'var(--brand-primary)',
                    }}
                    title="Export structured summary into personal Notes"
                  >
                    <PenTool size={14} />
                    <span>{isExporting ? 'Exporting...' : 'Export to Note'}</span>
                  </button>

                  <button
                    onClick={handleSaveSummary}
                    disabled={summaryData.isSaved || isSaving}
                    className={`btn ${summaryData.isSaved ? 'btn-ghost' : 'btn-primary'}`}
                    style={{
                      padding: '0.45rem 0.95rem',
                      fontSize: '0.8rem',
                      gap: '0.35rem',
                      cursor: summaryData.isSaved ? 'default' : 'pointer',
                    }}
                  >
                    {summaryData.isSaved ? (
                      <>
                        <Check size={14} color="#16A34A" />
                        <span style={{ color: '#16A34A', fontWeight: 700 }}>Saved in Library</span>
                      </>
                    ) : (
                      <>
                        <Bookmark size={14} />
                        <span>{isSaving ? 'Saving...' : 'Save to Library'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Navigation Tabs for the 4 Sections */}
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
                  onClick={() => setActiveTab('executive')}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor:
                      activeTab === 'executive' ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    color: activeTab === 'executive' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === 'executive' ? 700 : 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Zap size={15} />
                  <span>Executive Summary</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('key_points')}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor:
                      activeTab === 'key_points' ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    color: activeTab === 'key_points' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === 'key_points' ? 700 : 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Target size={15} />
                  <span>Key Points ({summaryData.keyPoints?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('terms')}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor:
                      activeTab === 'terms' ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    color: activeTab === 'terms' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === 'terms' ? 700 : 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <BookOpen size={15} />
                  <span>Important Terms ({summaryData.importantTerms?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('revision')}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor:
                      activeTab === 'revision' ? 'var(--pastel-lavender-subtle)' : 'transparent',
                    color: activeTab === 'revision' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === 'revision' ? 700 : 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <HelpCircle size={15} />
                  <span>Revision Cards ({summaryData.revisionNotes?.length || 0})</span>
                </button>
              </div>

              {/* Section 1: Executive Summary (Short vs Detailed Switch) */}
              {activeTab === 'executive' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => setSummaryViewType('short')}
                        className={`btn ${summaryViewType === 'short' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        ⚡ Short Executive (2-3 Sentences)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryViewType('detailed')}
                        className={`btn ${summaryViewType === 'detailed' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        📖 In-Depth Detailed Synthesis
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const text = summaryViewType === 'short' ? summaryData.shortSummary : summaryData.detailedSummary;
                        navigator.clipboard.writeText(text);
                        setCopiedItem('summary');
                        setTimeout(() => setCopiedItem(null), 2000);
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      {copiedItem === 'summary' ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                      <span>{copiedItem === 'summary' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div
                    style={{
                      padding: '1.5rem',
                      borderRadius: '12px',
                      backgroundColor: summaryViewType === 'short' ? '#FBF9FE' : '#FFFFFF',
                      border: '1px solid var(--border-light)',
                      borderLeft: '4px solid var(--brand-primary)',
                      lineHeight: 1.7,
                      fontSize: '0.94rem',
                      color: 'var(--text-main)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {summaryViewType === 'short' ? summaryData.shortSummary : summaryData.detailedSummary}
                  </div>
                </div>
              )}

              {/* Section 2: Key Points */}
              {activeTab === 'key_points' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {summaryData.keyPoints?.map((point, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem',
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--pastel-lavender)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#342852',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {pIdx + 1}
                      </div>

                      <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {point}
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(point);
                          setCopiedItem(`point-${pIdx}`);
                          setTimeout(() => setCopiedItem(null), 2000);
                        }}
                        className="btn btn-ghost"
                        style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                        title="Copy takeaway"
                      >
                        {copiedItem === `point-${pIdx}` ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Section 3: Important Terms Glossary */}
              {activeTab === 'terms' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {summaryData.importantTerms?.map((item, tIdx) => (
                    <div
                      key={tIdx}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border-light)',
                        borderTop: '3px solid var(--pastel-mauve)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 800,
                              color: 'var(--brand-primary)',
                            }}
                          >
                            {item.term}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${item.term}: ${item.definition}`);
                              setCopiedItem(`term-${tIdx}`);
                              setTimeout(() => setCopiedItem(null), 2000);
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                            title="Copy definition"
                          >
                            {copiedItem === `term-${tIdx}` ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          {item.definition}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section 4: Active Recall & Revision Cards */}
              {activeTab === 'revision' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {summaryData.revisionNotes?.map((card, rIdx) => {
                    const isRevealed = revealedAnswers[rIdx];
                    return (
                      <div
                        key={rIdx}
                        style={{
                          padding: '1.25rem',
                          borderRadius: '12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-light)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        }}
                      >
                        {/* Question Row */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '6px',
                                backgroundColor: 'var(--pastel-pink-subtle)',
                                color: '#68245D',
                                fontWeight: 800,
                                fontSize: '0.72rem',
                              }}
                            >
                              Q{rIdx + 1}
                            </span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {card.question}
                            </span>
                          </div>

                          <button
                            onClick={() => toggleAnswer(rIdx)}
                            className="btn btn-outline"
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              gap: '0.3rem',
                              borderRadius: '6px',
                            }}
                          >
                            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            <span>{isRevealed ? 'Hide Answer' : 'Reveal Answer'}</span>
                          </button>
                        </div>

                        {/* Revealed Answer Box */}
                        {isRevealed && (
                          <div
                            style={{
                              padding: '0.9rem 1.1rem',
                              borderRadius: '8px',
                              backgroundColor: 'var(--pastel-periwinkle-subtle)',
                              borderLeft: '3px solid #7586E8',
                              fontSize: '0.86rem',
                              color: 'var(--text-main)',
                              lineHeight: 1.5,
                              marginBottom: '0.5rem',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#2B397D', marginBottom: '0.2rem' }}>
                              Answer:
                            </div>
                            {card.answer}
                          </div>
                        )}

                        {/* Exam Tip Callout */}
                        {card.tip && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              fontSize: '0.78rem',
                              color: '#654321',
                              backgroundColor: '#FFF9E6',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              marginTop: '0.4rem',
                            }}
                          >
                            <span>💡</span>
                            <span><strong>Exam Tip:</strong> {card.tip}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. SAVED SUMMARIES LIBRARY SIDE DRAWER                                   */}
        {/* ========================================================================= */}
        {savedDrawerOpen && (
          <aside
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '800px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bookmark size={17} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Saved Library
                </h3>
              </div>
              <button
                onClick={() => setSavedDrawerOpen(false)}
                className="btn btn-ghost"
                style={{ padding: '0.2rem' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search filter */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search
                size={14}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '10px', top: '10px' }}
              />
              <input
                type="text"
                placeholder="Search summaries..."
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
                className="input-field"
                style={{
                  paddingLeft: '32px',
                  paddingTop: '0.4rem',
                  paddingBottom: '0.4rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                }}
              />
            </div>

            {/* List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              {filteredSaved.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  <Bookmark size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p>No saved summaries yet.</p>
                  <p style={{ fontSize: '0.75rem' }}>Generate and save summaries to review them anytime.</p>
                </div>
              ) : (
                filteredSaved.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => loadSingleSummary(s._id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: summaryData?.summaryId === s._id ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-light)',
                      backgroundColor: summaryData?.summaryId === s._id ? 'var(--pastel-lavender-subtle)' : '#FAFAFD',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          color: 'var(--text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '220px',
                        }}
                      >
                        {s.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteSaved(e, s._id)}
                        className="btn btn-ghost"
                        style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                        title="Delete from library"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                      <span
                        style={{
                          padding: '0.05rem 0.35rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--pastel-periwinkle-subtle)',
                          color: '#2B397D',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        {s.sourceType}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default AISummarizer;
