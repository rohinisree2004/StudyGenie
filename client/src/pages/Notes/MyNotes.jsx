import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService';
import { subjectService } from '../../services/subjectService';
import PageHeader from '../../components/UI/PageHeader';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  BookOpen,
  Layers,
  Sparkles,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const MyNotes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Notifications & Confirmation
  const [toastMessage, setToastMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [notesRes, subjectsRes] = await Promise.all([
        noteService.getNotes(),
        subjectService.getSubjects(true),
      ]);

      setNotes(notesRes.data || []);
      setSubjects(subjectsRes.subjects || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePin = async (e, noteId) => {
    e.stopPropagation();
    try {
      const res = await noteService.togglePin(noteId);
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, isPinned: res.data.isPinned } : n))
      );
      showToast(res.message);
    } catch (err) {
      console.error('Failed to pin note:', err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await noteService.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      setDeleteConfirmId(null);
      showToast('Note deleted successfully.');
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      searchQuery === '' ||
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const noteSubjId = n.subject?._id || n.subject?.id || n.subject;
    const matchesSubject = selectedSubject === '' || noteSubjId === selectedSubject;

    const matchesPinned = !onlyPinned || n.isPinned;

    return matchesSearch && matchesSubject && matchesPinned;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  // Metrics
  const totalNotesCount = notes.length;
  const pinnedCount = notes.filter((n) => n.isPinned).length;

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          className="card card-pastel-sky"
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
          <CheckCircle2 size={17} color="#245585" />
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {toastMessage}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <PageHeader
        badge="Personal Knowledge Base"
        title="My Study Notes"
        description="Create structured Markdown notes, organize them by subjects and topics, pin critical exam formulas, and link directly to study materials."
        action={
          <button
            onClick={() => navigate('/notes/new')}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={16} /> Create New Note
          </button>
        }
      />

      {/* Search & Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search notes by title, content, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="input"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{ minWidth: '180px', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code ? `${s.code} - ` : ''}
                {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOnlyPinned(!onlyPinned)}
            className={`btn ${onlyPinned ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.84rem', gap: '0.4rem' }}
          >
            <Pin size={14} style={{ transform: onlyPinned ? 'rotate(45deg)' : 'none' }} />
            {onlyPinned ? 'Pinned Only' : 'Show All'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Loading personal notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderStyle: 'dashed',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--pastel-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <FileText size={26} color="#452572" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No study notes found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {searchQuery || selectedSubject || onlyPinned
              ? 'No notes match your current search or filter. Try clearing filters.'
              : 'You have not written any personal notes yet. Capture key lecture concepts to prepare for revision!'}
          </p>
          <button onClick={() => navigate('/notes/new')} className="btn btn-primary">
            <Plus size={15} /> Write Your First Note
          </button>
        </div>
      ) : (
        <div>
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Pin size={16} color="var(--brand-primary)" style={{ transform: 'rotate(45deg)' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Pinned Study Notes ({pinnedNotes.length})
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {pinnedNotes.map((note) => renderNoteCard(note))}
              </div>
            </div>
          )}

          {/* All Other Notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <FileText size={16} color="var(--text-muted)" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    All Notes ({unpinnedNotes.length})
                  </h2>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {unpinnedNotes.map((note) => renderNoteCard(note))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(30, 25, 45, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '1.75rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--pastel-pink-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} color="#9E2242" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Delete Study Note?</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete this study note? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-outline">
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNote(deleteConfirmId)}
                className="btn btn-primary"
                style={{ background: '#D94D6A', borderColor: '#D94D6A', color: '#fff' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper card renderer
  function renderNoteCard(note) {
    const accentColor = note.color || '#E7C6FF';

    return (
      <div
        key={note._id}
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderTop: `5px solid ${accentColor}`,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: note.isPinned ? '0 4px 12px rgba(200, 182, 255, 0.25)' : 'var(--shadow-xs)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => navigate(`/notes/${note._id}`)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = note.isPinned
            ? '0 4px 12px rgba(200, 182, 255, 0.25)'
            : 'var(--shadow-xs)';
        }}
      >
        <div>
          {/* Card Top: Subject Pill & Pin Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {note.subject ? (
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${note.subject.color || 'var(--pastel-lavender)'}33`,
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                  }}
                >
                  {note.subject.code || note.subject.title}
                </span>
              ) : (
                <span className="badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  General
                </span>
              )}

              {note.topic && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Layers size={11} /> {note.topic.title}
                </span>
              )}
            </div>

            <button
              onClick={(e) => handleTogglePin(e, note._id)}
              className="btn btn-ghost"
              style={{
                padding: '0.3rem',
                borderRadius: '50%',
                color: note.isPinned ? 'var(--brand-primary)' : 'var(--text-muted)',
              }}
              title={note.isPinned ? 'Unpin from top' : 'Pin note to top'}
            >
              <Pin size={15} style={{ transform: note.isPinned ? 'rotate(45deg)' : 'none' }} />
            </button>
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: '1.08rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '0.5rem',
              lineHeight: 1.35,
            }}
          >
            {note.title}
          </h3>

          {/* Content Excerpt (Strips markdown symbols for clean snippet) */}
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '0.85rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {note.content.replace(/[#*`$\-\\]/g, '')}
          </p>

          {/* Linked Material Indicator if available */}
          {note.material && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.74rem',
                color: 'var(--brand-primary)',
                backgroundColor: 'var(--pastel-lavender-subtle)',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.75rem',
                width: 'fit-content',
              }}
            >
              <FileText size={12} />
              <span>Ref: {note.material.title}</span>
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
              {note.tags.map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-subtle)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer: Timestamp & Quick Actions */}
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '0.75rem',
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} />
            <span>
              {new Date(note.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/notes/${note._id}`);
              }}
              className="btn btn-ghost"
              style={{ padding: '0.3rem', borderRadius: '6px' }}
              title="Edit note"
            >
              <Edit3 size={14} color="var(--text-secondary)" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(note._id);
              }}
              className="btn btn-ghost"
              style={{ padding: '0.3rem', borderRadius: '6px', color: '#B8324A' }}
              title="Delete note"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default MyNotes;
