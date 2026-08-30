import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import noteService from '../../services/noteService';
import { subjectService } from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import materialService from '../../services/materialService';
import {
  ArrowLeft,
  Save,
  Trash2,
  Pin,
  Tag,
  BookOpen,
  Layers,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  PenTool,
  HelpCircle,
  Palette,
} from 'lucide-react';

const PASTEL_PALETTE = [
  { color: '#FFD6FF', name: 'Pastel Pink' },
  { color: '#E7C6FF', name: 'Pastel Mauve' },
  { color: '#C8B6FF', name: 'Pastel Lavender' },
  { color: '#B8C0FF', name: 'Pastel Periwinkle' },
  { color: '#BBD0FF', name: 'Pastel Sky' },
];

const NoteDetails = () => {
  const { noteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isNewNote = !noteId || noteId === 'new';

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(!isNewNote);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [color, setColor] = useState('#E7C6FF');
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Toast
  const [notification, setNotification] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3500);
  };

  // Load subject list and existing note if editing
  useEffect(() => {
    const init = async () => {
      try {
        // Load student subjects
        const subjectsRes = await subjectService.getSubjects(true);
        setSubjects(subjectsRes.subjects || []);

        if (isNewNote) {
          // Check query parameters for pre-filling
          const querySubj = searchParams.get('subjectId');
          const queryTopic = searchParams.get('topicId');
          const queryMat = searchParams.get('materialId');
          const queryTitle = searchParams.get('title');
          const queryContent = searchParams.get('content');

          if (querySubj) setSelectedSubject(querySubj);
          if (queryTopic) setSelectedTopic(queryTopic);
          if (queryTitle) setTitle(queryTitle);
          if (queryContent) setContent(queryContent);
          if (queryMat) setSelectedMaterial(queryMat);

          if (querySubj) {
            const [topicsRes, matsRes] = await Promise.all([
              topicService.getTopicsBySubject(querySubj),
              materialService.getMaterials({ subject: querySubj }),
            ]);
            setTopics(topicsRes.topics || []);
            setMaterials(matsRes.data || []);
            if (queryTopic) setSelectedTopic(queryTopic);
          }
        } else {
          // Fetch existing note
          const noteRes = await noteService.getNote(noteId);
          const note = noteRes.data;

          setTitle(note.title);
          setContent(note.content || '');
          setColor(note.color || '#E7C6FF');
          setIsPinned(note.isPinned || false);
          setTags(note.tags || []);

          const subjId = note.subject?._id || note.subject?.id || note.subject || '';
          setSelectedSubject(subjId);

          const topicId = note.topic?._id || note.topic?.id || note.topic || '';
          const matId = note.material?._id || note.material?.id || note.material || '';
          setSelectedMaterial(matId);

          if (subjId) {
            const [topicsRes, matsRes] = await Promise.all([
              topicService.getTopicsBySubject(subjId),
              materialService.getMaterials({ subject: subjId }),
            ]);
            setTopics(topicsRes.topics || []);
            setMaterials(matsRes.data || []);
            setSelectedTopic(topicId);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        showToast('error', 'Failed to load note data.');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [noteId, isNewNote, searchParams]);

  // Handle cascading subject selection
  const handleSubjectChange = async (subjId) => {
    setSelectedSubject(subjId);
    setSelectedTopic('');
    setSelectedMaterial('');
    if (!subjId) {
      setTopics([]);
      setMaterials([]);
      return;
    }
    try {
      const [topicsRes, matsRes] = await Promise.all([
        topicService.getTopicsBySubject(subjId),
        materialService.getMaterials({ subject: subjId }),
      ]);
      setTopics(topicsRes.topics || []);
      setMaterials(matsRes.data || []);
    } catch (err) {
      console.error('Failed to load cascading data:', err);
      setTopics([]);
      setMaterials([]);
    }
  };

  // Tag Management
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, '').toLowerCase();
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Save Note
  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      showToast('error', 'Please provide a title for your note.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content,
        subject: selectedSubject || null,
        topic: selectedTopic || null,
        material: selectedMaterial || null,
        tags,
        color,
        isPinned,
      };

      if (isNewNote) {
        const res = await noteService.createNote(payload);
        showToast('success', 'Note created successfully!');
        setTimeout(() => navigate(`/notes/${res.data._id}`), 800);
      } else {
        await noteService.updateNote(noteId, payload);
        showToast('success', 'Note saved successfully!');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      showToast('error', err.message || 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Note
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this note?')) return;
    try {
      await noteService.deleteNote(noteId);
      navigate('/notes');
    } catch (err) {
      console.error('Error deleting note:', err);
      showToast('error', 'Could not delete note.');
    }
  };

  // Word count & reading time
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  if (isLoading) {
    return (
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Opening notebook...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {notification.message && (
        <div
          className={`card ${notification.type === 'error' ? 'card-pastel-pink' : 'card-pastel-sky'}`}
          style={{
            position: 'fixed',
            top: '5rem',
            right: '2rem',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.25rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {notification.type === 'error' ? (
            <AlertCircle size={18} color="#9E2242" />
          ) : (
            <CheckCircle2 size={18} color="#255580" />
          )}
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {notification.message}
          </span>
        </div>
      )}

      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link
          to="/notes"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to My Notes
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Mode Switcher */}
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem' }}
          >
            {previewMode ? <PenTool size={14} /> : <Eye size={14} />}
            {previewMode ? 'Edit Mode' : 'Preview Note'}
          </button>

          {/* Pin Toggle */}
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={`btn ${isPinned ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem' }}
            title="Toggle pinned status"
          >
            <Pin size={14} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
            {isPinned ? 'Pinned' : 'Pin to Top'}
          </button>

          {/* Summarize with AI (if existing note) */}
          {!isNewNote && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/summarizer?noteId=${noteId}`)}
                className="btn btn-outline"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  gap: '0.35rem',
                  borderColor: 'var(--pastel-mauve)',
                  backgroundColor: 'var(--pastel-mauve-subtle)',
                  color: 'var(--brand-primary)',
                }}
                title="Generate AI summary, key points, and revision notes"
              >
                <Sparkles size={14} /> Summarize with AI
              </button>

              <button
                type="button"
                onClick={() => navigate(`/quizzes/new?sourceType=note&sourceId=${noteId}&subjectId=${selectedSubject || ''}&topicId=${selectedTopic || ''}`)}
                className="btn btn-outline"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  gap: '0.35rem',
                  borderColor: 'var(--pastel-lavender)',
                  backgroundColor: 'var(--pastel-lavender-subtle)',
                  color: '#342852',
                }}
                title="Generate AI practice quiz from this note"
              >
                <HelpCircle size={14} color="var(--brand-primary)" /> Generate Quiz
              </button>
            </>
          )}

          {/* Delete (if existing) */}
          {!isNewNote && (
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-ghost"
              style={{ padding: '0.45rem', color: '#B8324A', borderRadius: '6px' }}
              title="Delete Note"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.86rem', gap: '0.4rem' }}
          >
            <Save size={15} />
            {isSaving ? 'Saving...' : isNewNote ? 'Create Note' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main Notebook Container */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          borderTop: `6px solid ${color}`,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Title Input */}
        <input
          type="text"
          placeholder="Note Title (e.g., Master Theorem Recurrence Relations)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            marginBottom: '1.25rem',
            letterSpacing: '-0.02em',
            padding: 0,
          }}
        />

        {/* Metadata Controls Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            backgroundColor: 'var(--bg-subtle)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.75rem',
            border: '1px solid var(--border-light)',
          }}
        >
          {/* Subject Dropdown */}
          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              Subject
            </label>
            <select
              className="input"
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              style={{ fontSize: '0.84rem', padding: '0.45rem 0.75rem' }}
            >
              <option value="">General (No Subject)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code ? `${s.code} - ` : ''}
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Dropdown */}
          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              Topic
            </label>
            <select
              className="input"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={!selectedSubject || topics.length === 0}
              style={{ fontSize: '0.84rem', padding: '0.45rem 0.75rem' }}
            >
              <option value="">None / General Topic</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  Unit {t.order}: {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Linked Study Material */}
          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              Linked Study Material
            </label>
            <select
              className="input"
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              disabled={!selectedSubject || materials.length === 0}
              style={{ fontSize: '0.84rem', padding: '0.45rem 0.75rem' }}
            >
              <option value="">No Linked Material</option>
              {materials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Pastel Color Swatches */}
          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              Pastel Accent
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
              {PASTEL_PALETTE.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setColor(p.color)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    border: color === p.color ? '2px solid #2B214A' : '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transform: color === p.color ? 'scale(1.2)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                  title={p.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tags Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Tag size={15} color="var(--text-muted)" />
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--brand-primary)',
                backgroundColor: 'var(--pastel-lavender-subtle)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Add tag and press Enter..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '0.82rem',
              color: 'var(--text-main)',
              backgroundColor: 'transparent',
              padding: '0.2rem 0.5rem',
              minWidth: '160px',
            }}
          />
        </div>

        {/* Content Area: Editor vs Preview */}
        {previewMode ? (
          <div
            style={{
              minHeight: '400px',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: '0.96rem',
              lineHeight: 1.7,
              color: 'var(--text-main)',
              whiteSpace: 'pre-line',
            }}
          >
            {content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Note is empty. Switch back to Edit Mode to write content.</span>}
          </div>
        ) : (
          <textarea
            className="input"
            rows="18"
            placeholder="Start typing your study notes here... Use Markdown for headers (#), bullet points (-), bold text (**word**), or equations."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              fontSize: '0.95rem',
              lineHeight: 1.65,
              fontFamily: 'inherit',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              resize: 'vertical',
            }}
          />
        )}

        {/* Note Footer: Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.25rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1rem',
          }}
        >
          <div>
            {wordCount} words • ~{readingTimeMinutes} min read
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={13} color="var(--brand-primary)" />
            <span>Structured for future Phase 4 AI Flashcard generation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetails;
