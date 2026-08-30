import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import materialService from '../../services/materialService';
import { subjectService } from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Edit3,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Eye,
  Tag,
  BookOpen,
  Layers,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

const TeacherMaterials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    tags: '',
    isPublic: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  // Load teacher subjects and materials
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [subjectsRes, materialsRes] = await Promise.all([
        subjectService.getSubjects(false),
        materialService.getMaterials(),
      ]);

      setSubjects(subjectsRes.subjects || []);
      setMaterials(materialsRes.data || []);
    } catch (err) {
      console.error('Error loading teacher materials:', err);
      showToast('error', 'Failed to load study materials. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When subject changes in modal, load topics for that subject
  const handleSubjectChange = async (subjectId) => {
    setFormData((prev) => ({ ...prev, subject: subjectId, topic: '' }));
    if (!subjectId) {
      setTopics([]);
      return;
    }
    try {
      const res = await topicService.getTopicsBySubject(subjectId);
      setTopics(res.topics || []);
    } catch (err) {
      console.error('Error loading topics for subject:', err);
      setTopics([]);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingMaterialId(null);
    setFormData({
      title: '',
      description: '',
      subject: subjects.length > 0 ? subjects[0].id : '',
      topic: '',
      tags: '',
      isPublic: true,
    });
    setSelectedFile(null);
    if (subjects.length > 0) {
      handleSubjectChange(subjects[0].id);
    }
    setShowModal(true);
  };

  const handleOpenEditModal = async (material) => {
    setIsEditing(true);
    setEditingMaterialId(material._id);
    setFormData({
      title: material.title,
      description: material.description || '',
      subject: material.subject?._id || material.subject?.id || material.subject || '',
      topic: material.topic?._id || material.topic?.id || material.topic || '',
      tags: Array.isArray(material.tags) ? material.tags.join(', ') : '',
      isPublic: material.isPublic !== undefined ? material.isPublic : true,
    });
    setSelectedFile(null);

    const subjId = material.subject?._id || material.subject?.id || material.subject;
    if (subjId) {
      try {
        const res = await topicService.getTopicsBySubject(subjId);
        setTopics(res.topics || []);
      } catch (err) {
        console.error('Failed to load topics for editing material:', err);
      }
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('error', 'Please provide a title for the study material.');
      return;
    }

    if (!formData.subject) {
      showToast('error', 'Please assign this material to a subject.');
      return;
    }

    if (!isEditing && !selectedFile) {
      showToast('error', 'Please choose a file to upload.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataPayload = new FormData();
      dataPayload.append('title', formData.title.trim());
      dataPayload.append('description', formData.description.trim());
      dataPayload.append('subject', formData.subject);
      if (formData.topic) dataPayload.append('topic', formData.topic);
      dataPayload.append('tags', formData.tags);
      dataPayload.append('isPublic', formData.isPublic);

      if (selectedFile) {
        dataPayload.append('file', selectedFile);
      }

      if (isEditing) {
        await materialService.updateMaterial(editingMaterialId, dataPayload);
        showToast('success', 'Study material updated successfully!');
      } else {
        await materialService.createMaterial(dataPayload);
        showToast('success', 'Study material uploaded and published!');
      }

      setShowModal(false);
      // Refresh list
      const res = await materialService.getMaterials();
      setMaterials(res.data || []);
    } catch (err) {
      console.error('Error submitting material:', err);
      showToast('error', err.message || 'Failed to save study material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await materialService.deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m._id !== id));
      setDeleteConfirmId(null);
      showToast('success', 'Material deleted successfully.');
    } catch (err) {
      console.error('Failed to delete material:', err);
      showToast('error', err.message || 'Failed to delete material.');
    }
  };

  const handleDownload = async (material) => {
    try {
      await materialService.downloadMaterial(material._id, material.fileName || `${material.title}.pdf`);
      // Update local download count
      setMaterials((prev) =>
        prev.map((m) => (m._id === material._id ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m))
      );
    } catch (err) {
      console.error('Download failed:', err);
      showToast('error', 'Could not download file.');
    }
  };

  // Helper formatting
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeBadge = (type) => {
    switch (type) {
      case 'pdf':
        return <span className="badge badge-accent" style={{ background: 'var(--pastel-pink-subtle)', color: '#8A2B68' }}>PDF</span>;
      case 'docx':
        return <span className="badge badge-accent" style={{ background: 'var(--pastel-sky-subtle)', color: '#1E4A8A' }}>DOCX</span>;
      case 'pptx':
        return <span className="badge badge-accent" style={{ background: 'var(--pastel-mauve-subtle)', color: '#6A2A85' }}>SLIDES</span>;
      case 'image':
        return <span className="badge badge-accent" style={{ background: 'var(--pastel-periwinkle-subtle)', color: '#2B388A' }}>IMAGE</span>;
      default:
        return <span className="badge badge-accent" style={{ background: 'var(--pastel-lavender-subtle)', color: '#4F2B8A' }}>FILE</span>;
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const itemSubjectId = item.subject?._id || item.subject?.id || item.subject;
    const matchesSubject = selectedSubjectFilter === '' || itemSubjectId === selectedSubjectFilter;

    const matchesType = selectedTypeFilter === '' || item.fileType === selectedTypeFilter;

    return matchesSearch && matchesSubject && matchesType;
  });

  // Calculate quick metrics
  const totalUploads = materials.length;
  const totalDownloads = materials.reduce((acc, m) => acc + (m.downloadCount || 0), 0);
  const distinctSubjects = new Set(
    materials.map((m) => m.subject?._id || m.subject?.id || m.subject).filter(Boolean)
  ).size;

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
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
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            boxShadow: 'var(--shadow-md)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {notification.type === 'error' ? (
            <AlertCircle size={18} color="#A82845" />
          ) : (
            <CheckCircle2 size={18} color="#255580" />
          )}
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {notification.message}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <PageHeader
        badge="Educator Courseware"
        title="Study Materials Management"
        description="Upload lecture notes, assignment sheets, and reference slides. Assigned topics enable automated AI summaries and quiz generation."
        action={
          <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Upload size={16} /> Upload New Material
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
        <StatCard
          icon={FileText}
          value={totalUploads}
          label="Total Uploads"
          sublabel="Curriculum assets published"
          accent="mauve"
        />
        <StatCard
          icon={Download}
          value={totalDownloads}
          label="Student Downloads"
          sublabel="Total student engagements"
          accent="sky"
        />
        <StatCard
          icon={Layers}
          value={distinctSubjects}
          label="Subjects Covered"
          sublabel="Active course repositories"
          accent="periwinkle"
        />
      </div>

      {/* Search & Filter Controls */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
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
            placeholder="Search materials by title, topic, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Subject Filter */}
          <select
            className="input"
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
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

          {/* Type Filter */}
          <select
            className="input"
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            style={{ minWidth: '130px', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="">All File Types</option>
            <option value="pdf">PDF Docs</option>
            <option value="docx">Word (.docx)</option>
            <option value="pptx">Slides (.pptx)</option>
            <option value="txt">Text Notes</option>
            <option value="image">Images</option>
          </select>
        </div>
      </div>

      {/* Materials Table / List */}
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
              background: 'var(--pastel-mauve)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <FileText size={26} color="#4F266A" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No study materials found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {searchQuery || selectedSubjectFilter || selectedTypeFilter
              ? 'No materials match your current search criteria. Try resetting filters.'
              : 'You have not uploaded any study materials yet. Share curriculum resources with your students!'}
          </p>
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Upload size={15} /> Upload First Material
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border-light)',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '1rem 1.25rem' }}>Material & File</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Subject & Topic</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Type & Size</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Downloads</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Date Added</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem' }}>
                {filteredMaterials.map((mat) => (
                  <tr
                    key={mat._id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Material Title & Description */}
                    <td style={{ padding: '1rem 1.25rem', maxWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div
                          style={{
                            marginTop: '2px',
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--pastel-lavender-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={17} color="var(--brand-primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                            {mat.title}
                          </div>
                          {mat.description && (
                            <div
                              style={{
                                fontSize: '0.78rem',
                                color: 'var(--text-secondary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '240px',
                              }}
                            >
                              {mat.description}
                            </div>
                          )}
                          {mat.tags && mat.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                              {mat.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.68rem',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-subtle)',
                                    padding: '0.1rem 0.4rem',
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
                      </div>
                    </td>

                    {/* Subject & Topic */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: mat.subject?.color ? `${mat.subject.color}33` : 'var(--pastel-sky-subtle)',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                            marginBottom: '0.25rem',
                          }}
                        >
                          {mat.subject?.code ? `${mat.subject.code}: ` : ''}
                          {mat.subject?.title || 'Unassigned'}
                        </span>
                        {mat.topic && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Layers size={11} /> {mat.topic.title}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Type & Size */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div>{getFileTypeBadge(mat.fileType)}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatFileSize(mat.fileSize)}
                        </span>
                      </div>
                    </td>

                    {/* Downloads */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          fontSize: '0.9rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Download size={13} color="var(--text-muted)" />
                        {mat.downloadCount || 0}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(mat.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleDownload(mat)}
                          className="btn btn-ghost"
                          style={{ padding: '0.4rem', borderRadius: '6px' }}
                          title="Download file"
                        >
                          <Download size={15} color="var(--text-secondary)" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(mat)}
                          className="btn btn-ghost"
                          style={{ padding: '0.4rem', borderRadius: '6px' }}
                          title="Edit details"
                        >
                          <Edit3 size={15} color="var(--text-secondary)" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(mat._id)}
                          className="btn btn-ghost"
                          style={{ padding: '0.4rem', borderRadius: '6px', color: '#B8324A' }}
                          title="Delete material"
                        >
                          <Trash2 size={15} />
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Delete Study Material?</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              This will permanently delete this document and remove the physical file from the StudyGenie server. Any student notes linked to this material will remain preserved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-outline">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn btn-primary"
                style={{ background: '#D94D6A', borderColor: '#D94D6A', color: '#fff' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload / Edit Material Modal */}
      {showModal && (
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
            padding: '1.5rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '580px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {isEditing ? 'Edit Study Material' : 'Upload Study Material'}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Assign resources to your curriculum structure for student learning.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Subject Selection */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Subject Assignment <span style={{ color: '#D94D6A' }}>*</span>
                </label>
                <select
                  className="input"
                  value={formData.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a subject you teach...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `${s.code} - ` : ''}
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Selection */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Associated Topic (Optional)
                </label>
                <select
                  className="input"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  disabled={!formData.subject || topics.length === 0}
                >
                  <option value="">
                    {topics.length === 0 ? 'No topics available for this subject' : 'Select a topic (optional)...'}
                  </option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      Unit {t.order}: {t.title}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Linking to a topic facilitates targeted AI quizzes and smart timetable suggestions in future phases.
                </span>
              </div>

              {/* Material Title */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Material Title <span style={{ color: '#D94D6A' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Asymptotic Analysis & Master Method Lecture Slides"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Description & Instructions
                </label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="Brief summary of concepts covered in this document..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* File Dropzone */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Attachment File {!isEditing && <span style={{ color: '#D94D6A' }}>*</span>}
                </label>
                <div
                  style={{
                    border: '2px dashed var(--pastel-lavender)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-subtle)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => document.getElementById('file-upload-input').click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        // Auto populate title if empty
                        if (!formData.title) {
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                          }));
                        }
                      }
                    }}
                  />
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'var(--pastel-sky)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.5rem',
                    }}
                  >
                    <Upload size={20} color="#1E3865" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {selectedFile.name}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--brand-primary)', fontSize: '0.88rem' }}>
                        {isEditing ? 'Click to replace current file (optional)' : 'Click to browse or drop file'}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        PDF, Word, Slides, Text, or Images (Max 25MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Search Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. algorithms, trees, exam-review"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ gap: '0.4rem' }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner-small" /> Saving...
                    </>
                  ) : (
                    <>
                      <Upload size={15} /> {isEditing ? 'Save Changes' : 'Upload Material'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMaterials;
