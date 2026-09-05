import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { Sliders, Clock, Compass, Bell, Cpu, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [preferences, setPreferences] = useState({
    dailyStudyGoalHours: 4,
    learningStyle: 'balanced',
    preferredStudyTime: 'morning',
    reminderFrequency: 'daily',
    emailNotifications: true,
    aiAssistanceLevel: 'standard',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await userService.getProfile();
        if (data.user?.preferences) {
          setPreferences({
            dailyStudyGoalHours: data.user.preferences.dailyStudyGoalHours || 4,
            learningStyle: data.user.preferences.learningStyle || 'balanced',
            preferredStudyTime: data.user.preferences.preferredStudyTime || 'morning',
            reminderFrequency: data.user.preferences.reminderFrequency || 'daily',
            emailNotifications: data.user.preferences.emailNotifications !== false,
            aiAssistanceLevel: data.user.preferences.aiAssistanceLevel || 'standard',
          });
        }
      } catch (err) {
        setErrorMessage('Failed to load study preferences.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setIsSaving(true);

    try {
      await userService.updatePreferences(preferences);
      setSuccessMessage('Study preferences saved successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update preferences.');
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
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '2.5rem 1.5rem' }} className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          Study & Learning Preferences
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Customize your daily study rhythms, learning methods, and notification habits.
        </p>
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

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Daily Study Goal */}
        <div className="card card-pastel-sky" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
            <Clock size={19} color="#254382" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Daily Target Hours</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            How many hours would you like to dedicate to focused revision each day?
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={preferences.dailyStudyGoalHours}
              onChange={(e) => setPreferences({ ...preferences, dailyStudyGoalHours: Number(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
            />
            <span
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--brand-primary)',
                background: 'var(--pastel-sky-subtle)',
                padding: '0.35rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                minWidth: '75px',
                textAlign: 'center',
              }}
            >
              {preferences.dailyStudyGoalHours} hrs
            </span>
          </div>
        </div>

        {/* Learning Style */}
        <div className="card card-pastel-lavender" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
            <Compass size={19} color="#522C91" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Preferred Learning Style</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Used to tailor upcoming AI explanation depth, flashcards, and summary structures.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
            {[
              { id: 'visual', label: 'Visual', desc: 'Diagrams & Mindmaps' },
              { id: 'auditory', label: 'Auditory', desc: 'Verbal explanations' },
              { id: 'reading/writing', label: 'Reading', desc: 'Structured texts' },
              { id: 'kinesthetic', label: 'Interactive', desc: 'Quizzes & Exercises' },
              { id: 'balanced', label: 'Balanced', desc: 'Mixed approach' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setPreferences({ ...preferences, learningStyle: style.id })}
                style={{
                  padding: '0.85rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: preferences.learningStyle === style.id ? '2px solid var(--pastel-lavender)' : '1px solid var(--border-light)',
                  background: preferences.learningStyle === style.id ? 'var(--pastel-lavender-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{style.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Study Time */}
        <div className="card card-pastel-periwinkle" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
            <Clock size={19} color="#352F7A" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Optimal Study Time Window</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
            {[
              { id: 'morning', label: '🌅 Morning', range: '6 AM – 12 PM' },
              { id: 'afternoon', label: '☀️ Afternoon', range: '12 PM – 5 PM' },
              { id: 'evening', label: '🌆 Evening', range: '5 PM – 9 PM' },
              { id: 'night', label: '🌙 Night', range: '9 PM – 2 AM' },
            ].map((time) => (
              <button
                key={time.id}
                type="button"
                onClick={() => setPreferences({ ...preferences, preferredStudyTime: time.id })}
                style={{
                  padding: '0.85rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: preferences.preferredStudyTime === time.id ? '2px solid var(--pastel-periwinkle)' : '1px solid var(--border-light)',
                  background: preferences.preferredStudyTime === time.id ? 'var(--pastel-periwinkle-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{time.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{time.range}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications & AI Level */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Bell size={19} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Notifications & AI Assistance</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
              />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Email Study Reminders</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive periodic digests and deadline notifications</div>
              </div>
            </label>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" htmlFor="aiAssistance">AI Study Planner Assistance Level</label>
              <select
                id="aiAssistance"
                className="form-input no-icon"
                value={preferences.aiAssistanceLevel}
                onChange={(e) => setPreferences({ ...preferences, aiAssistanceLevel: e.target.value })}
              >
                <option value="guided">Guided (Step-by-step breakdown & extra encouragement)</option>
                <option value="standard">Standard (Balanced pacing & revision checkpoints)</option>
                <option value="advanced">Advanced (Accelerated mastery & high density)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving}
            style={{ minWidth: '160px' }}
          >
            {isSaving ? (
              <>
                <div className="spinner" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
