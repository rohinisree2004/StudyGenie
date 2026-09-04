import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { subjectService } from '../../services/subjectService';
import { PageHeader } from '../../components/UI';
import {
  FileText,
  Search,
  Download,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HardDrive,
  Filter,
} from 'lucide-react';

const AdminMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [matRes, subjRes] = await Promise.all([
        adminService.getMaterials({
          search: searchTerm,
          subjectId: selectedSubject || undefined,
          fileType: selectedFileType !== 'all' ? selectedFileType : undefined,
        }),
        subjectService.getSubjects(true),
      ]);

      if (matRes.success) {
        setMaterials(matRes.materials || []);
      }
      if (subjRes.success) {
        setSubjects(subjRes.subjects || []);
      }
    } catch (err) {
      console.error('Failed to load materials:', err);
      setBannerMessage({ text: 'Could not load study materials.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSubject, selectedFileType]);

  const handleToggleVisibility = async (material) => {
    const nextPublic = !material.isPublic;
    try {
      await adminService.updateMaterialVisibility(material._id, nextPublic);
      setBannerMessage({
        text: `Visibility for "${material.title}" set to ${nextPublic ? 'Public' : 'Hidden'}.`,
        type: 'success',
      });
      await loadData();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to toggle material visibility');
    }
  };

  const handleDeleteMaterial = async (material) => {
    if (!window.confirm(`Are you sure you want to remove "${material.title}" from the platform?`)) {
      return;
    }

    try {
      await adminService.deleteMaterial(material._id);
      setBannerMessage({
        text: `Material "${material.title}" has been deleted.`,
        type: 'success',
      });
      await loadData();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete material');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalBytes = materials.reduce((acc, m) => acc + (m.fileSize || 0), 0);
  const publicCount = materials.filter((m) => m.isPublic).length;

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Study Material Moderation"
        subtitle="Review uploaded courseware files, monitor storage usage, manage public access permissions, and moderate content."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-admin">
              <Shield size={12} /> System Admin
            </span>
            <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
              Resource Moderation
            </span>
          </div>
        }
      />

      {bannerMessage.text && (
        <div className={`alert ${bannerMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1.5rem' }}>
          {bannerMessage.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card card-pastel-periwinkle" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Files</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {materials.length} Documents
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Across all course subjects
          </div>
        </div>

        <div className="card card-pastel-lavender" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Storage</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {formatFileSize(totalBytes)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Aggregated file payload
          </div>
        </div>

        <div className="card card-pastel-sky" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Public Visibility</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {publicCount} Public
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {materials.length - publicCount} restricted / hidden
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Search documents by title or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Subject Filter */}
          <select
            className="form-input no-icon"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          {/* File Type Filter */}
          <select
            className="form-input no-icon"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
          >
            <option value="all">All File Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="docx">Word (DOCX)</option>
            <option value="pptx">PowerPoint</option>
            <option value="txt">Text Files</option>
            <option value="image">Images</option>
          </select>
        </div>
      </div>

      {/* Materials Table */}
      {isLoading ? (
        <div style={{ minHeight: '35vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : materials.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: 'var(--radius-xl)' }}>
          <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No study materials found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Try clearing or adjusting your search filters.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Document Title</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Course Subject</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Uploaded By</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Size & Format</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Visibility</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr
                    key={m._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--pastel-lavender-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FileText size={16} color="var(--brand-primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {m.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {m.fileName || 'Uploaded Document'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      {m.subject ? (
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-light)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: m.subject.color || '#BBD0FF' }} />
                          {m.subject.title}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unlinked</span>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 600 }}>{m.uploadedBy?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {m.uploadedBy?.role || 'user'}
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.75rem' }}>
                        {m.fileType || 'PDF'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(m.fileSize)}
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: m.isPublic ? 'var(--status-success-bg)' : 'var(--status-info-bg)',
                          color: m.isPublic ? 'var(--status-success-text)' : 'var(--status-info-text)',
                          border: `1px solid ${m.isPublic ? 'var(--status-success-border)' : 'var(--status-info-border)'}`,
                        }}
                      >
                        {m.isPublic ? 'Public Access' : 'Private / Hidden'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {m.fileUrl && (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            title="Download or Preview File"
                          >
                            <Download size={13} />
                          </a>
                        )}

                        <button
                          onClick={() => handleToggleVisibility(m)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title={m.isPublic ? 'Hide from students' : 'Make Public'}
                        >
                          {m.isPublic ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>

                        <button
                          onClick={() => handleDeleteMaterial(m)}
                          className="btn btn-ghost"
                          style={{ padding: '0.35rem 0.6rem', color: 'var(--status-error-text)' }}
                          title="Delete File"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMaterials;
