import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import materialService from '../../services/materialService';
import { subjectService } from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import PageHeader from '../../components/UI/PageHeader';
import {
  FileText,
  Download,
  Eye,
  Search,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  User,
  Clock,
  PenTool,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const StudentMaterials = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const [downloadingId, setDownloadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subjectsRes, materialsRes] = await Promise.all([
        subjectService.getSubjects(true), // browse=true to see enrolled & available
        materialService.getMaterials(),
      ]);

      setSubjects(subjectsRes.subjects || []);
      setMaterials(materialsRes.data || []);
    } catch (err) {
      console.error('Failed to load study materials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When subject filter changes, fetch topics for that subject
  const handleSubjectFilterChange = async (subjId) => {
    setSelectedSubject(subjId);
    setSelectedTopic('');
    if (!subjId) {
      setTopics([]);
      return;
    }
    try {
      const res = await topicService.getTopicsBySubject(subjId);
      setTopics(res.topics || []);
    } catch (err) {
      console.error('Error loading topics for filter:', err);
      setTopics([]);
    }
  };

  const handleDownload = async (e, material) => {
    e.stopPropagation();
    setDownloadingId(material._id);
    try {
      await materialService.downloadMaterial(
        material._id,
        material.fileName || `${material.title}.pdf`
      );
      setMaterials((prev) =>
        prev.map((m) =>
          m._id === material._id ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m
        )
      );
      setToastMessage(`Downloaded "${material.title}"`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeStyle = (type) => {
    switch (type) {
      case 'pdf':
        return { bg: 'var(--pastel-pink-subtle)', color: '#962A5A', label: 'PDF' };
      case 'docx':
        return { bg: 'var(--pastel-sky-subtle)', color: '#1B4D8A', label: 'DOCX' };
      case 'pptx':
        return { bg: 'var(--pastel-mauve-subtle)', color: '#682982', label: 'SLIDES' };
      case 'image':
        return { bg: 'var(--pastel-periwinkle-subtle)', color: '#2C3A8C', label: 'IMAGE' };
      default:
        return { bg: 'var(--pastel-lavender-subtle)', color: '#4D2A8A', label: 'DOC' };
    }
  };

  const filteredMaterials = materials.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const itemSubjectId = item.subject?._id || item.subject?.id || item.subject;
    const matchesSubject = selectedSubject === '' || itemSubjectId === selectedSubject;

    const itemTopicId = item.topic?._id || item.topic?.id || item.topic;
    const matchesTopic = selectedTopic === '' || itemTopicId === selectedTopic;

    const matchesType = selectedType === '' || item.fileType === selectedType;

    return matchesSearch && matchesSubject && matchesTopic && matchesType;
  });

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
            padding: '0.85rem 1.25rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <CheckCircle2 size={18} color="#2A5A88" />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {toastMessage}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <PageHeader
        badge="Curriculum Resources"
        title="Study Materials Repository"
        description="Access verified lecture notes, reading packs, and slides provided by your educators. Preview documents, download for offline revision, or summarize with AI."
      />

      {/* Search & Filter Bar */}
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
        {/* Search */}
        <div style={{ display: 'flex', flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search resources by title, topic, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="input"
            value={selectedSubject}
            onChange={(e) => handleSubjectFilterChange(e.target.value)}
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

          {selectedSubject && topics.length > 0 && (
            <select
              className="input"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              style={{ minWidth: '160px', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  Unit {t.order}: {t.title}
                </option>
              ))}
            </select>
          )}

          <select
            className="input"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ minWidth: '130px', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="">All Formats</option>
            <option value="pdf">PDF Docs</option>
            <option value="docx">Word (.docx)</option>
            <option value="pptx">Slides (.pptx)</option>
            <option value="txt">Text Notes</option>
            <option value="image">Images</option>
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Loading study materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
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
              background: 'var(--pastel-sky)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <BookOpen size={26} color="#1E3E6E" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            No matching study materials found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
            {searchQuery || selectedSubject || selectedType
              ? 'Try modifying or clearing your search filters to discover more curriculum resources.'
              : 'Your educators have not uploaded any study materials yet for this semester.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredMaterials.map((mat) => {
            const typeStyle = getFileTypeStyle(mat.fileType);
            const subjColor = mat.subject?.color || 'var(--pastel-sky)';

            return (
              <div
                key={mat._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                  borderTop: `4px solid ${subjColor}`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/materials/${mat._id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                <div>
                  {/* Top Bar: Subject Badge & File Type */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${subjColor}33`,
                        color: 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                      }}
                    >
                      {mat.subject?.code ? `${mat.subject.code}` : mat.subject?.title || 'Subject'}
                    </span>

                    <span
                      className="badge"
                      style={{
                        backgroundColor: typeStyle.bg,
                        color: typeStyle.color,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      {typeStyle.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.45rem',
                      lineHeight: 1.35,
                    }}
                  >
                    {mat.title}
                  </h3>

                  {/* Description */}
                  {mat.description && (
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        marginBottom: '0.85rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {mat.description}
                    </p>
                  )}

                  {/* Topic Pill if assigned */}
                  {mat.topic && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <Layers size={12} color="var(--brand-primary)" />
                      <span>{mat.topic.title}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {mat.tags && mat.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                      {mat.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-subtle)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Metadata & Actions */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={13} />
                      <span>{mat.uploadedBy?.name || 'Educator'}</span>
                    </div>
                    <span>{formatFileSize(mat.fileSize)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/materials/${mat._id}`);
                      }}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem', gap: '0.35rem' }}
                    >
                      <Eye size={14} /> View
                    </button>

                    <button
                      onClick={(e) => handleDownload(e, mat)}
                      className="btn btn-ghost"
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.82rem',
                        backgroundColor: 'var(--pastel-sky-subtle)',
                        color: 'var(--brand-primary)',
                        gap: '0.35rem',
                      }}
                      title="Download file"
                    >
                      <Download size={14} /> {mat.downloadCount || 0}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/notes/new?materialId=${mat._id}&subjectId=${
                            mat.subject?._id || mat.subject?.id || ''
                          }&topicId=${mat.topic?._id || mat.topic?.id || ''}&title=${encodeURIComponent(
                            `Notes: ${mat.title}`
                          )}`
                        );
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.82rem',
                        backgroundColor: 'var(--pastel-lavender-subtle)',
                        color: 'var(--brand-primary)',
                        gap: '0.35rem',
                      }}
                      title="Take structured note on this material"
                    >
                      <PenTool size={14} /> Note
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentMaterials;
