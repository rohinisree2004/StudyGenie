import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import {
  User,
  Mail,
  School,
  BookMarked,
  Phone,
  AlignLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';

const Profile = () => {
  const { user: authUser, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    gradeLevel: '',
    phone: '',
    bio: '',
    avatar: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        if (data.user) {
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            institution: data.user.institution || '',
            gradeLevel: data.user.gradeLevel || '',
            phone: data.user.phone || '',
            bio: data.user.bio || '',
            avatar: data.user.avatar || '',
          });
        }
      } catch (err) {
        setErrorMessage('Failed to load profile details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAvatarChange = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploadingAvatar(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await userService.uploadAvatar(file);
      setFormData((prev) => ({ ...prev, avatar: res.avatar }));
      if (updateUser) {
        updateUser({ avatar: res.avatar });
      }
      setSuccessMessage('Profile photo updated successfully via Cloudinary! 🌟');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMessage(err.message || 'Failed to upload profile photo to Cloudinary.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    setIsUploadingAvatar(true);
    try {
      await userService.removeAvatar();
      setFormData((prev) => ({ ...prev, avatar: '' }));
      if (updateUser) {
        updateUser({ avatar: '' });
      }
      setSuccessMessage('Profile photo removed.');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      setErrorMessage(err.message || 'Could not remove profile photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setIsSaving(true);

    try {
      await userService.updateProfile({
        name: formData.name,
        institution: formData.institution,
        gradeLevel: formData.gradeLevel,
        phone: formData.phone,
        bio: formData.bio,
      });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      {/* Header Profile Summary */}
      <div
        className="card"
        style={{
          padding: '2rem 2.25rem',
          marginBottom: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          borderTop: '4px solid var(--pastel-lavender)',
        }}
      >
        {/* Avatar with Cloudinary Upload Overlay */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {formData.avatar ? (
            <img
              src={formData.avatar}
              alt={formData.name || 'User Avatar'}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--pastel-lavender)',
                boxShadow: '0 4px 12px rgba(200, 182, 255, 0.45)',
              }}
            />
          ) : (
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'var(--pastel-periwinkle)',
                color: '#222E58',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(184, 192, 255, 0.45)',
              }}
            >
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          {/* Upload Button Badge Overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-primary)',
              color: '#fff',
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
            title="Upload photo to Cloudinary"
          >
            {isUploadingAvatar ? (
              <div className="spinner-small" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
            ) : (
              <Camera size={14} />
            )}
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {formData.name || 'User Profile'}
            </h1>
            <span
              className={`badge badge-${authUser?.role === 'admin' ? 'admin' : authUser?.role === 'teacher' ? 'teacher' : 'student'}`}
            >
              {authUser?.role}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
            {formData.email} • {formData.institution || 'No institution listed'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem', color: 'var(--brand-primary)' }}
            >
              <Upload size={13} /> {formData.avatar ? 'Change Photo' : 'Upload Photo'}
            </button>

            {formData.avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="btn btn-ghost"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem', color: '#B8324A' }}
              >
                <Trash2 size={13} /> Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card" style={{ padding: '2.25rem', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <User size={19} color="var(--brand-primary)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Personal Information</h2>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            <CheckCircle2 size={17} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <AlertCircle size={17} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon-left" size={17} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email Address (Read Only) */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(Primary account identifier)</span>
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon-left" size={17} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  value={formData.email}
                  disabled
                />
              </div>
            </div>

            {/* Institution / College */}
            <div className="form-group">
              <label className="form-label" htmlFor="institution">Institution / University</label>
              <div className="input-wrapper">
                <School className="input-icon-left" size={17} />
                <input
                  id="institution"
                  name="institution"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Stanford University"
                  value={formData.institution}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Grade Level / Academic Year */}
            <div className="form-group">
              <label className="form-label" htmlFor="gradeLevel">Grade Level / Academic Year</label>
              <div className="input-wrapper">
                <BookMarked className="input-icon-left" size={17} />
                <input
                  id="gradeLevel"
                  name="gradeLevel"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Undergraduate, Year 2"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="phone">Phone Number <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(Optional)</span></label>
              <div className="input-wrapper">
                <Phone className="input-icon-left" size={17} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="bio">Bio & Academic Interests</label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className="form-input no-icon"
                placeholder="Tell educators and peers about your academic focus or goals..."
                value={formData.bio}
                onChange={handleChange}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ minWidth: '150px' }}
            >
              {isSaving ? (
                <>
                  <div className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
