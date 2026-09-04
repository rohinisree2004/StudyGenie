import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Flame,
  HelpCircle,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Calendar,
  Layers,
  CheckSquare,
  Zap,
} from 'lucide-react';
import teacherService from '../../services/teacherService';

const STATUS_CONFIG = {
  on_track: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    label: 'On Track',
    icon: <CheckCircle2 size={14} className="mr-1" />,
  },
  in_progress: {
    bg: 'var(--pastel-sky-subtle, rgba(187, 208, 255, 0.38))',
    border: '#BBD0FF',
    text: '#1E4D8A',
    label: 'In Progress',
    icon: <Clock size={14} className="mr-1" />,
  },
  needs_support: {
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#991B1B',
    label: 'Needs Support',
    icon: <AlertTriangle size={14} className="mr-1" />,
  },
};

const TeacherStudentPerformance = () => {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'assignments' | 'quizzes' | 'trends'

  useEffect(() => {
    const fetchStudentDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await teacherService.getStudentPerformance(studentId);
        if (res.success && res.data) {
          setData(res.data);
          // Expand first subject by default
          if (res.data.subjectBreakdown?.length > 0) {
            setExpandedSubjects({ [res.data.subjectBreakdown[0].subjectId]: true });
          }
        } else {
          setError('Failed to load student performance data.');
        }
      } catch (err) {
        console.error('Error fetching student performance:', err);
        setError(err.message || 'Could not retrieve student details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentDetail();
  }, [studentId]);

  const toggleSubjectExpand = (subjId) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjId]: !prev[subjId],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
        <div className="h-6 w-36 bg-slate-200 rounded animate-pulse"></div>
        <div className="rounded-3xl p-8 bg-white border border-slate-100 shadow-sm animate-pulse h-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert size={40} className="text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Access Denied or Not Found</h2>
        <p className="text-sm text-slate-600">{error || 'Unable to access student performance details.'}</p>
        <Link
          to="/teacher/students"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs"
          style={{ backgroundColor: 'var(--brand-primary, #5A5FDB)' }}
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Students Roster
        </Link>
      </div>
    );
  }

  const { student, enrolledSubjects = [], status, overview = {}, subjectBreakdown = [], weakTopics = [], assignments = [], quizHistory = [], trendPoints = [] } = data;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.in_progress;

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* 1. Back Navigation & Top Header */}
      <div className="space-y-4">
        <Link
          to="/teacher/students"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Students Roster
        </Link>

        {/* Student Profile Card */}
        <div
          className="rounded-3xl p-6 md:p-8 bg-white border border-slate-200 shadow-xs relative overflow-hidden"
          style={{
            borderTop: '4px solid var(--pastel-lavender, #C8B6FF)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-200 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-900 font-extrabold flex items-center justify-center border-2 border-purple-200 text-xl shadow-xs">
                  {student.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'ST'}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900">{student.name}</h1>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    style={{
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.text,
                      borderColor: statusConfig.border,
                    }}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-slate-500">{student.email}</p>

                {student.institution && (
                  <p className="text-xs text-slate-400">🏛️ {student.institution}</p>
                )}

                {/* Enrolled Subjects in Teacher's Catalog */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                  <span className="text-xs font-semibold text-slate-500">Your Courses:</span>
                  {enrolledSubjects.map((s) => (
                    <span
                      key={s._id}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: s.color ? `${s.color}40` : 'rgba(200, 182, 255, 0.35)',
                        color: '#342852',
                      }}
                    >
                      {s.title} ({s.code || 'Gen'})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3 shrink-0">
              <Link
                to={`/recommendations?studentId=${student._id}`}
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-xs"
              >
                <Sparkles size={14} className="mr-1.5 text-purple-600" />
                View AI Advice
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Academic Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Study Hours */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Study Hours
            </span>
            <Clock size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {overview.totalStudyHours}h
          </div>
          <p className="text-xs text-slate-500">
            Across {overview.totalSessions} study session(s)
          </p>
        </div>

        {/* Topic Mastery */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Topic Mastery
            </span>
            <CheckCircle2 size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {overview.topicCompletionRate}%
          </div>
          <p className="text-xs text-slate-500">
            {overview.completedTopics} of {overview.totalTopics} topics done
          </p>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assignments
            </span>
            <FileText size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {overview.submittedAssignments}/{overview.totalAssignments}
          </div>
          <p className="text-xs text-slate-500">
            Avg Grade: {overview.averageGrade !== null ? `${overview.averageGrade}%` : 'N/A'}
          </p>
        </div>

        {/* Quizzes */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quiz Average
            </span>
            <Award size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {overview.averageQuizScore !== null ? `${overview.averageQuizScore}%` : 'N/A'}
          </div>
          <p className="text-xs text-slate-500">
            {overview.totalQuizAttempts} attempt(s) ({overview.quizPassRate}% pass)
          </p>
        </div>

        {/* Study Streak */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Study Streak
            </span>
            <Flame size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {overview.streak?.currentStreak || 0} days
          </div>
          <p className="text-xs text-slate-500">
            Longest: {overview.streak?.longestStreak || 0} days
          </p>
        </div>
      </div>

      {/* 3. Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'courses', label: 'Courses & Topic Breakdown', count: subjectBreakdown.length },
          { id: 'weak', label: 'Weak Concepts', count: weakTopics.length },
          { id: 'assignments', label: 'Assignment Submissions', count: assignments.length },
          { id: 'quizzes', label: 'Quiz History', count: quizHistory.length },
          { id: 'trends', label: 'Activity Timeline', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center ${
              activeTab === tab.id
                ? 'bg-purple-100 text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-purple-200 text-purple-900'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Tab Content: Courses & Topics */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <BookOpen size={20} className="mr-2 text-indigo-600" />
              Syllabus Units & Topics Progress
            </h3>
            <span className="text-xs text-slate-500">
              Click on a course to inspect its topic completion checklist
            </span>
          </div>

          {subjectBreakdown.map((subj) => {
            const isExpanded = !!expandedSubjects[subj.subjectId];

            return (
              <div
                key={subj.subjectId}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Course Header */}
                <div
                  onClick={() => toggleSubjectExpand(subj.subjectId)}
                  className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors flex items-center justify-between border-b border-slate-100"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {subj.code || 'COURSE'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{subj.title}</h4>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>{subj.completedTopics} of {subj.totalTopics} topics completed ({subj.completionRate}%)</span>
                      <span>•</span>
                      <span>{subj.studyHours}h study hours logged</span>
                      <span>•</span>
                      <span>Quiz Avg: {subj.averageQuizScore !== null ? `${subj.averageQuizScore}%` : 'None taken'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${subj.completionRate}%`,
                          backgroundColor: subj.color || '#C8B6FF',
                        }}
                      />
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </div>

                {/* Topics List Table */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/40 space-y-2">
                    {subj.topics.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        No syllabus topics have been added to this course yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {subj.topics.map((t, idx) => (
                          <div
                            key={t._id || idx}
                            className={`p-3 rounded-xl border flex items-center justify-between ${
                              t.isCompleted
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              {t.isCompleted ? (
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                              )}
                              <div>
                                <h5 className="text-xs font-bold leading-snug">{t.title}</h5>
                                <span className="text-[11px] text-slate-500">
                                  Est: {t.estimatedHours}h • {t.difficulty}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t.isCompleted ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Tab Content: Weak Concepts */}
      {activeTab === 'weak' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <AlertTriangle size={20} className="mr-2 text-rose-500" />
                Diagnosed Conceptual Gaps (&lt; 70% Quiz Average)
              </h3>
              <p className="text-xs text-slate-500">
                Topics where the student scored below benchmark. Target these areas during office hours or review sessions.
              </p>
            </div>
          </div>

          {weakTopics.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800">No Weak Conceptual Gaps!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This student has not scored below 70% in any of your course quizzes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weakTopics.map((wt, idx) => (
                <div
                  key={wt.topicId || idx}
                  className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {wt.subjectTitle}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        wt.urgency === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {wt.urgency === 'high' ? 'High Priority' : 'Moderate Priority'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{wt.topicTitle}</h4>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Quiz Mastery</span>
                      <span className="font-bold text-rose-600">{wt.averageScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${wt.averageScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                    <span className="font-semibold text-rose-900">Teacher Advisory: </span>
                    Recommend reviewing definitions and scheduling a targeted practice quiz in {wt.topicTitle}.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab Content: Assignment Submissions */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <FileText size={18} className="mr-2 text-indigo-600" />
              Coursework Submissions ({assignments.length})
            </h3>
            <span className="text-xs text-slate-500">
              {overview.submittedAssignments} of {overview.totalAssignments} completed
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No assignments published in your courses for this student yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((item) => (
                <div
                  key={item._id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span>Course: {item.subject?.title || 'Course'}</span>
                      <span>•</span>
                      <span>
                        Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No deadline'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-500">Grade</div>
                      <div className="text-sm font-bold text-slate-800">
                        {item.grade !== null ? `${item.grade}%` : 'Not Graded'}
                      </div>
                    </div>

                    <Link
                      to={`/assignments/${item._id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      View Assignment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Tab Content: Quiz History */}
      {activeTab === 'quizzes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <Award size={18} className="mr-2 text-emerald-600" />
              Practice Quiz Attempts ({quizHistory.length})
            </h3>
            <span className="text-xs text-slate-500">
              Overall Class Quiz Average: {overview.averageQuizScore !== null ? `${overview.averageQuizScore}%` : 'N/A'}
            </span>
          </div>

          {quizHistory.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No quiz attempts recorded in your courses for this student yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {quizHistory.map((q) => (
                <div
                  key={q._id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-800">
                        {q.quiz?.title || 'Practice Quiz'}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          q.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {q.passed ? 'Passed' : 'Needs Practice'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span>Course: {q.subject?.title || 'General'}</span>
                      {q.topic && (
                        <>
                          <span>•</span>
                          <span>Topic: {q.topic.title}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Date: {new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-500">Score</div>
                      <div
                        className={`text-base font-black ${
                          q.score >= 70 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {q.score}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. Tab Content: Activity Trends Timeline */}
      {activeTab === 'trends' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                <TrendingUp size={18} className="mr-2 text-purple-600" />
                14-Day Study Activity Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Daily study hours and quizzes logged by this student in your courses
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
              {trendPoints.map((pt, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center p-2 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 text-center"
                >
                  <span className="text-[10px] font-semibold text-slate-500 truncate w-full">
                    {pt.label}
                  </span>
                  <div
                    className="w-full bg-purple-200 rounded-lg transition-all"
                    style={{
                      height: `${Math.max(12, Math.min(60, pt.studyHours * 24))}px`,
                      backgroundColor: pt.studyHours > 0 ? 'var(--brand-primary, #5A5FDB)' : '#E2E8F0',
                    }}
                  />
                  <span className="text-[11px] font-bold text-slate-800">
                    {pt.studyHours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudentPerformance;
