import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Shield,
  CheckCircle2,
  Clock,
  Award,
  ChevronDown,
  Layers,
  BrainCircuit,
  Calendar,
  Check,
  Zap,
  Star,
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated, user, getDashboardPath } = useAuth();
  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'What is StudyGenie and how does it help my learning?',
      a: 'StudyGenie is an AI-powered study planner and smart learning assistant built on a clean MERN stack. It breaks course syllabi down into manageable topics, tracks your completion progress, and integrates personalized study goals so you retain more information without feeling overwhelmed.',
    },
    {
      q: 'How does Role-Based Access Control (RBAC) work on the platform?',
      a: 'StudyGenie provides three tailored experiences: Students manage their enrolled subjects, complete milestones, and set study habits; Educators oversee curriculum topics and inspect cohort rosters; Administrators manage subject catalogs and assign teachers. Admin accounts are provisioned securely by the system.',
    },
    {
      q: 'Can I customize my study goals and learning preferences?',
      a: 'Yes! Through the Settings page, students can configure daily study hour targets (1–12 hours), preferred study times (morning, afternoon, evening, night), and learning modalities (visual, auditory, kinesthetic, reading/writing, or balanced).',
    },
    {
      q: 'What is the "Soft Pastels" design philosophy?',
      a: 'StudyGenie uses a carefully curated aesthetic palette (#FFD6FF, #E7C6FF, #C8B6FF, #B8C0FF, #BBD0FF) with plenty of whitespace and subtle light borders to provide a calm, uncluttered, and friendly environment optimized for deep academic concentration.',
    },
  ];

  return (
    <div className="animate-fade-in" style={{ overflowX: 'hidden' }}>
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '4rem 1.5rem 3rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Pill Highlight */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--pastel-lavender-subtle)',
            border: '1px solid #D8C7FF',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#4B2E80',
          }}
        >
          <Sparkles size={14} color="#6B3FB8" />
          <span>Intelligent Learning & Academic Pacing Platform</span>
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'var(--text-main)',
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            maxWidth: '880px',
            margin: '0 auto 1.25rem',
          }}
        >
          Study Smarter, Retain Longer, and Master Coursework with{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #5A5FDB 0%, #7E57C2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            StudyGenie
          </span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 2.25rem',
            lineHeight: 1.65,
          }}
        >
          Personalized revision schedules, structured atomic topic milestones, and educator supervision—crafted in a tranquil, distraction-free pastel workspace.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '3rem',
          }}
        >
          {isAuthenticated && user ? (
            <Link
              to={getDashboardPath(user.role)}
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.85rem', fontSize: '1rem' }}
            >
              Go to Your Dashboard ({user.name.split(' ')[0]}) <ArrowRight size={17} />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.85rem', fontSize: '1rem' }}
              >
                Get Started Free <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.85rem', fontSize: '1rem' }}
              >
                Sign In / Demo Accounts
              </Link>
            </>
          )}
        </div>

        {/* Social Proof Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.75rem',
            flexWrap: 'wrap',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            marginBottom: '3.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="var(--brand-primary)" />
            <span>Role-Based Access for Students, Teachers & Admins</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="var(--brand-primary)" />
            <span>MongoDB Atlas Secured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="var(--brand-primary)" />
            <span>Soft Pastel Minimal UI</span>
          </div>
        </div>

        {/* =========================================================================
            INTERACTIVE HERO MOCKUP CARD
            ========================================================================= */}
        <div
          className="card animate-fade-in"
          style={{
            maxWidth: '920px',
            margin: '0 auto',
            padding: '2rem 2.25rem',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'left',
            position: 'relative',
          }}
        >
          {/* Card Window Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#FFD6FF' }} />
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#C8B6FF' }} />
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#BBD0FF' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 600 }}>
                StudyGenie Workspace • Student Session
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-student">Active Cohort</span>
              <span className="badge badge-active">3 Day Streak 🔥</span>
            </div>
          </div>

          {/* Inner Grid Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Left Col: Course Summary */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-subtle)',
                borderLeft: '4px solid var(--pastel-sky)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2C4985' }}>CS-201</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stanford University</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Data Structures & Algorithms
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                Algorithmic asymptotic analysis, binary tree balancing, and graph search.
              </p>

              {/* Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Syllabus Mastery</span>
                  <span style={{ color: 'var(--brand-primary)' }}>60%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E0E7F5', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', backgroundColor: 'var(--brand-primary)' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  3 of 5 topics completed
                </div>
              </div>
            </div>

            {/* Right Col: Topic Checklist Sample */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                Topic Milestones Checklist
              </div>

              {[
                { title: 'Array Operations & Memory Models', completed: true, difficulty: 'beginner', hours: '2h' },
                { title: 'Linked Lists & Pointer Manipulation', completed: true, difficulty: 'intermediate', hours: '3h' },
                { title: 'Binary Search Trees & AVL Rotations', completed: false, difficulty: 'intermediate', hours: '3h' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: item.completed ? 'var(--pastel-sky-subtle)' : '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: item.completed ? 'var(--brand-primary)' : 'transparent',
                        border: item.completed ? 'none' : '2px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.7rem',
                      }}
                    >
                      {item.completed && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: item.completed ? 'var(--text-secondary)' : 'var(--text-main)',
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}
                    >
                      {item.title}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOUR PILLARS OF STUDYGENIE
          ========================================================================= */}
      <section
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '4.5rem 1.5rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="badge badge-student" style={{ marginBottom: '0.6rem' }}>Core Capabilities</span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Built for High-Impact Academic Retention
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '620px', margin: '0 auto' }}>
            A unified system connecting student daily habits with institutional curriculum structure.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Card 1 */}
          <div className="card card-pastel-sky" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--pastel-sky)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <BrainCircuit size={22} color="#1E3260" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Adaptive Study Goals
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Set customized daily study hour limits, preferred study windows (morning to night), and personalized learning styles.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card card-pastel-lavender" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--pastel-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Layers size={22} color="#452778" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Atomic Topic Hierarchy
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Coursework is broken down into ordered topics with estimated study times and difficulty ratings (beginner, intermediate, advanced).
            </p>
          </div>

          {/* Card 3 */}
          <div className="card card-pastel-mauve" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--pastel-mauve)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <GraduationCap size={22} color="#5D267A" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Educator Cohort Tools
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Faculty members publish course syllabi, manage topic outlines, and inspect enrolled student rosters in real time.
            </p>
          </div>

          {/* Card 4 */}
          <div className="card card-pastel-pink" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--pastel-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Shield size={22} color="#851D68" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Protected Security & RBAC
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Strict token verification, encrypted passwords, duplicate prevention, and zero unauthorized administrative elevation.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROLE SHOWCASE (STUDENT / TEACHER / ADMIN TABS)
          ========================================================================= */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
          padding: '5rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="badge badge-teacher" style={{ marginBottom: '0.6rem' }}>Role-Tailored Workspaces</span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Tailored Exactly for Your Academic Responsibility
            </h2>
          </div>

          {/* Role Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '2.5rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'student', label: '👨‍🎓 For Students', color: 'var(--pastel-sky)', activeColor: '#1E3260' },
              { id: 'teacher', label: '👩‍🏫 For Educators', color: 'var(--pastel-mauve)', activeColor: '#4E2178' },
              { id: 'admin', label: '👑 For Administrators', color: 'var(--pastel-pink)', activeColor: '#781A65' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRoleTab(tab.id)}
                style={{
                  padding: '0.7rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: activeRoleTab === tab.id ? '2px solid var(--border-light)' : '1px solid var(--border-light)',
                  backgroundColor: activeRoleTab === tab.id ? tab.color : 'var(--bg-subtle)',
                  color: activeRoleTab === tab.id ? tab.activeColor : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: activeRoleTab === tab.id ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Role Tab Content */}
          <div
            className="card"
            style={{
              padding: '2.5rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
            }}
          >
            {activeRoleTab === 'student' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-student" style={{ marginBottom: '0.75rem' }}>Student Experience</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    Turn Overwhelming Syllabi into Daily Wins
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Browse courses in the subject catalog, enroll with one click, and check off topics as you study. Your progress bar and streak meters update instantly.
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: 0 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      <CheckCircle2 size={16} color="var(--brand-primary)" /> Enrolled Subject Dashboard with live completion bars
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      <CheckCircle2 size={16} color="var(--brand-primary)" /> Interactive Topic Checklist with difficulty & time estimates
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--brand-primary)' }}>
                      <CheckCircle2 size={16} color="var(--brand-primary)" /> Study rhythm configuration (Daily hours, preferred study time)
                    </li>
                  </ul>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E3260', marginBottom: '0.75rem' }}>
                    Student Quick Actions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>📚 Data Structures & Algorithms</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>60% Syllabus Finished • 2 Topics Remaining</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🤖 Artificial Intelligence & Neural Systems</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>33% Syllabus Finished • 2 Topics Remaining</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'teacher' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-teacher" style={{ marginBottom: '0.75rem' }}>Educator Experience</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    Organize Curriculum Topics & Supervise Student Cohorts
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Educators can design structured class topics, specify estimated study hours, adjust difficulty labels, and view all enrolled student rosters.
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: 0 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      <CheckCircle2 size={16} color="#5D267A" /> Create & publish custom coursework subjects
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#5D267A' }}>
                      <CheckCircle2 size={16} color="#5D267A" /> Topic curriculum builder with ordering & time targets
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#5D267A' }}>
                      <CheckCircle2 size={16} color="#5D267A" /> Enrolled Student Roster tab for cohort supervision
                    </li>
                  </ul>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4E2178', marginBottom: '0.75rem' }}>
                    Assigned Classes Overview
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>👩‍🏫 CS-201 Data Structures</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>5 Syllabus Topics • 1 Enrolled Student</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>👩‍🏫 CS-320 Artificial Intelligence</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>3 Syllabus Topics • 1 Enrolled Student</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'admin' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-admin" style={{ marginBottom: '0.75rem' }}>Administrator Experience</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    Central Directory Management & Role Security
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Maintain the institution-wide catalog, assign faculty educators, oversee enrollment totals, and ensure public registration stays role-safe.
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: 0 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      <CheckCircle2 size={16} color="#781A65" /> Full Subject Directory CRUD & cascade topic management
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#781A65' }}>
                      <CheckCircle2 size={16} color="#781A65" /> Assign and reassign verified teachers to classes
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#781A65' }}>
                      <CheckCircle2 size={16} color="#781A65" /> System seeding scripts for secure admin credential management
                    </li>
                  </ul>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#781A65', marginBottom: '0.75rem' }}>
                    Directory Metrics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>3</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Subjects Active</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>8</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Published Topics</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS (3 SIMPLE STEPS)
          ========================================================================= */}
      <section
        style={{
          maxWidth: '1060px',
          margin: '0 auto',
          padding: '4.5rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <span className="badge badge-student" style={{ marginBottom: '0.6rem' }}>Simple Workflow</span>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Get Started in 3 Straightforward Steps
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '3rem' }}>
          No complicated setup. Join and begin checking off topics immediately.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div className="card card-pastel-sky" style={{ borderRadius: 'var(--radius-xl)', textAlign: 'left' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--pastel-sky)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#1E3260',
                marginBottom: '1rem',
              }}
            >
              1
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Create Account & Profile
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Sign up as a Student or Educator in seconds. Configure your school affiliation and bio.
            </p>
          </div>

          <div className="card card-pastel-lavender" style={{ borderRadius: 'var(--radius-xl)', textAlign: 'left' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--pastel-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#432675',
                marginBottom: '1rem',
              }}
            >
              2
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Enroll in Subjects
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Browse the catalog of published subjects or create your own custom classes with pastel accents.
            </p>
          </div>

          <div className="card card-pastel-periwinkle" style={{ borderRadius: 'var(--radius-xl)', textAlign: 'left' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--pastel-periwinkle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#28316E',
                marginBottom: '1rem',
              }}
            >
              3
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Track Topic Progress
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Check off completed concepts, monitor weekly study hours, and get ready for intelligent AI revision.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ ACCORDION SECTION
          ========================================================================= */}
      <section
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          padding: '3rem 1.5rem 5rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-student" style={{ marginBottom: '0.6rem' }}>Frequently Asked Questions</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Got Questions? We’ve Got Answers
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="card"
              onClick={() => toggleFaq(i)}
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                backgroundColor: openFaq === i ? 'var(--pastel-sky-subtle)' : '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {faq.q}
                </h3>
                <ChevronDown
                  size={18}
                  style={{
                    transform: openFaq === i ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                />
              </div>

              {openFaq === i && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          BOTTOM CALL TO ACTION BANNER
          ========================================================================= */}
      <section
        style={{
          maxWidth: '1060px',
          margin: '0 auto 5rem',
          padding: '0 1.5rem',
        }}
      >
        <div
          className="card"
          style={{
            padding: '3.5rem 2.5rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(231, 198, 255, 0.35) 0%, rgba(187, 208, 255, 0.45) 100%)',
            border: '1px solid #D7C6FF',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Transform How You Study Starting Today
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Join StudyGenie, organize your academic syllabus, and unlock structured learning built for your pace.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '0.98rem' }}>
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '0.98rem' }}>
              Explore With Demo Accounts
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          backgroundColor: '#FFFFFF',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'var(--pastel-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={15} color="#342852" />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Study<span style={{ color: 'var(--brand-primary)' }}>Genie</span>
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} StudyGenie – AI Study Planner & Smart Learning Assistant. Designed with Soft Pastels.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
