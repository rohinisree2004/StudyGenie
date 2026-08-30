import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import materialService from '../../services/materialService';
import {
  FileText,
  Download,
  ArrowLeft,
  BookOpen,
  Layers,
  User,
  Clock,
  Tag,
  PenTool,
  Sparkles,
  Share2,
  CheckCircle2,
  ExternalLink,
  BrainCircuit,
  GraduationCap,
} from 'lucide-react';

const MaterialDetails = () => {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await materialService.getMaterial(materialId);
        setMaterial(res.data);
      } catch (err) {
        console.error('Failed to fetch material details:', err);
        setError(err.message || 'Could not load material details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [materialId]);

  const handleDownload = async () => {
    if (!material) return;
    setIsDownloading(true);
    try {
      await materialService.downloadMaterial(
        material._id,
        material.fileName || `${material.title}.pdf`
      );
      setMaterial((prev) => ({
        ...prev,
        downloadCount: (prev.downloadCount || 0) + 1,
      }));
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading study material...</p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div style={{ maxWidth: '720px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div className="card card-pastel-pink" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Resource Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {error || 'This study material does not exist or has been removed.'}
          </p>
          <Link to="/materials" className="btn btn-primary">
            <ArrowLeft size={16} /> Back to Study Materials
          </Link>
        </div>
      </div>
    );
  }

  const subjColor = material.subject?.color || 'var(--pastel-sky)';
  const fileUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${material.fileUrl}`;

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1120px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {copiedToast && (
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
          <CheckCircle2 size={16} color="#255580" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Link copied to clipboard!
          </span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.84rem',
          color: 'var(--text-muted)',
          marginBottom: '1.5rem',
        }}
      >
        <Link
          to="/materials"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} /> Materials
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
          {material.subject?.code || material.subject?.title || 'Subject'}
        </span>
        <span>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
          {material.title}
        </span>
      </div>

      {/* Main Material Card */}
      <div
        className="card"
        style={{
          padding: '2.25rem',
          marginBottom: '2rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          borderTop: `4px solid ${subjColor}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="badge"
              style={{
                backgroundColor: `${subjColor}33`,
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              {material.subject?.code ? `${material.subject.code}: ` : ''}
              {material.subject?.title}
            </span>

            {material.topic && (
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--pastel-lavender-subtle)',
                  color: 'var(--brand-primary)',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Layers size={12} /> Unit {material.topic.order}: {material.topic.title}
              </span>
            )}

            <span className="badge badge-accent" style={{ textTransform: 'uppercase' }}>
              {material.fileType}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button onClick={handleShare} className="btn btn-outline" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem' }}>
              <Share2 size={14} /> Share
            </button>

            <button
              onClick={() =>
                navigate(
                  `/notes/new?materialId=${material._id}&subjectId=${
                    material.subject?._id || ''
                  }&topicId=${material.topic?._id || ''}&title=${encodeURIComponent(`Notes: ${material.title}`)}`
                )
              }
              className="btn btn-outline"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                gap: '0.35rem',
                borderColor: 'var(--pastel-lavender)',
                backgroundColor: 'var(--pastel-lavender-subtle)',
                color: 'var(--brand-primary)',
              }}
            >
              <PenTool size={14} /> Take Notes
            </button>

            <button
              onClick={() => navigate(`/summarizer?materialId=${material._id}`)}
              className="btn btn-outline"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                gap: '0.35rem',
                borderColor: 'var(--pastel-mauve)',
                backgroundColor: 'var(--pastel-mauve-subtle)',
                color: 'var(--brand-primary)',
              }}
              title="Generate summary with Gemini AI"
            >
              <Sparkles size={14} /> Summarize with AI
            </button>

            <button
              onClick={handleDownload}
              className="btn btn-primary"
              disabled={isDownloading}
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.85rem', gap: '0.4rem' }}
            >
              <Download size={15} /> {isDownloading ? 'Downloading...' : 'Download File'}
            </button>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
            marginBottom: '0.85rem',
          }}
        >
          {material.title}
        </h1>

        {/* Metadata Strip */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={14} />
            <span>Uploaded by <strong>{material.uploadedBy?.name || 'Educator'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} />
            <span>
              {new Date(material.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div>Size: <strong>{formatFileSize(material.fileSize)}</strong></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Download size={13} />
            <span><strong>{material.downloadCount || 0}</strong> downloads</span>
          </div>
        </div>

        {/* Description Section */}
        {material.description && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
              Resource Description & Instructions
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {material.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {material.tags && material.tags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <Tag size={14} color="var(--text-muted)" />
            {material.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: 'var(--brand-primary)',
                  backgroundColor: 'var(--pastel-sky-subtle)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* File Preview Frame or Direct Access Banner */}
        <div
          style={{
            marginTop: '1rem',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--brand-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {material.fileName || material.title}
              </span>
            </div>

            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', gap: '0.3rem' }}
            >
              <ExternalLink size={13} /> Open in New Tab
            </a>
          </div>

          {/* Embedded Preview for Images or PDF fallback */}
          {material.fileType === 'image' ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <img
                src={fileUrl}
                alt={material.title}
                style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'var(--pastel-lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <FileText size={24} color="#38216A" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Document Attached ({material.fileType.toUpperCase()})
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                Click below to download or view this resource in full resolution.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ gap: '0.4rem' }}
                >
                  <ExternalLink size={15} /> View Raw File
                </a>
                <button onClick={handleDownload} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                  <Download size={15} /> Download Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Bottom Modules */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Educator Information Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <GraduationCap size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Course Instructor
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--pastel-periwinkle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
                color: '#26346A',
              }}
            >
              {material.uploadedBy?.name?.charAt(0) || 'E'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {material.uploadedBy?.name || 'Educator'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {material.uploadedBy?.institution || 'StudyGenie Academic Faculty'}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {material.uploadedBy?.bio || 'Verified academic educator in computer science and mathematical engineering.'}
          </p>
        </div>

        {/* Phase 4 AI Capability Preview Card */}
        <div
          className="card card-pastel-lavender"
          style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <BrainCircuit size={18} color="#5B2EA6" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Gemini AI Learning Hub
              </h3>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              This material is indexed and structured for our upcoming intelligent learning engine.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div
                onClick={() => navigate(`/summarizer?materialId=${material._id}`)}
                style={{
                  padding: '0.6rem 0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid #E8D9FA',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} color="var(--brand-primary)" />
                  <strong>AI Executive Summary & Revision Notes</strong>
                </span>
                <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: 'var(--pastel-pink)', color: '#68245D' }}>
                  Launch Now
                </span>
              </div>

              <div
                onClick={() => navigate(`/quizzes/new?sourceType=material&sourceId=${material._id}&subjectId=${material.subject?._id || ''}&topicId=${material.topic?._id || ''}`)}
                style={{
                  padding: '0.6rem 0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid #C8B6FF',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🎯</span>
                  <strong>AI Adaptive Practice Quiz</strong>
                </span>
                <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: 'var(--pastel-lavender)', color: '#342852' }}>
                  Generate Quiz
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            💡 Tip: Take personal notes today to build your active recall database!
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetails;
