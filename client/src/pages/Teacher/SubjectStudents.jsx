import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Search,
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import teacherService from '../../services/teacherService';

const STATUS_CONFIG = {
  on_track: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    label: 'On Track',
    icon: <CheckCircle2 size={13} className="mr-1" />,
  },
  in_progress: {
    bg: 'var(--pastel-sky-subtle, rgba(187, 208, 255, 0.38))',
    border: '#BBD0FF',
    text: '#1E4D8A',
    label: 'In Progress',
    icon: <Clock size={13} className="mr-1" />,
  },
  needs_support: {
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#991B1B',
    label: 'Needs Support',
    icon: <AlertTriangle size={13} className="mr-1" />,
  },
};

const SubjectStudents = () => {
  const { subjectId } = useParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjectRoster = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await teacherService.getSubjectStudents(subjectId);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError('Failed to load class roster.');
        }
      } catch (err) {
        console.error('Error fetching subject roster:', err);
        setError(err.message || 'Could not retrieve class roster.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjectRoster();
  }, [subjectId]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in animate-pulse" style={{ width: '100%' }}>
        <div className="h-6 w-36 bg-slate-200 rounded"></div>
        <div className="h-44 bg-white rounded-3xl border border-slate-100"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100"></div>
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
        <p className="text-sm text-slate-600">{error || 'Unable to access class roster.'}</p>
        <Link
          to="/teacher/subjects"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs"
          style={{ backgroundColor: 'var(--brand-primary, #5A5FDB)' }}
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to My Courses
        </Link>
      </div>
    );
  }

  const { subject, classSummary = {}, students = [] } = data;

  // Filter students in memory by search query and status
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      (s.name && s.name.toLowerCase().includes(search.trim().toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.trim().toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* 1. Header with Breadcrumb */}
      <div className="space-y-4">
        <Link
          to={`/teacher/subjects/${subject._id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Course Syllabus
        </Link>

        {/* Course Banner */}
        <div
          className="rounded-3xl p-6 md:p-8 bg-white border border-slate-200 shadow-xs relative overflow-hidden"
          style={{
            borderTop: `5px solid ${subject.color || '#C8B6FF'}`,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {subject.code || 'COURSE'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {subject.category || 'General'}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {subject.title} – Class Roster & Progress
              </h1>

              <p className="text-sm text-slate-600">
                Tracking {classSummary.totalStudents || 0} enrolled student(s) across {subject.totalTopics || 0} syllabus topic(s) and {subject.totalAssignments || 0} published assignment(s).
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <Link
                to="/teacher/students"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                All Students Hub
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Course KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {classSummary.totalStudents || 0}
            </div>
            <div className="text-xs font-medium text-slate-500">Enrolled Students</div>
          </div>
        </div>

        {/* Average Topic Completion */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {classSummary.averageTopicCompletion || 0}%
            </div>
            <div className="text-xs font-medium text-slate-500">Class Topic Mastery</div>
          </div>
        </div>

        {/* Average Quiz Score */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {classSummary.averageQuizScore || 0}%
            </div>
            <div className="text-xs font-medium text-slate-500">Course Quiz Average</div>
          </div>
        </div>

        {/* Study Hours */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {classSummary.totalStudyHoursLogged || 0}h
            </div>
            <div className="text-xs font-medium text-slate-500">Total Course Hours</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search class roster by name or email..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Students' },
            { id: 'on_track', label: 'On Track' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'needs_support', label: 'Needs Support' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === tab.id
                  ? 'bg-purple-100 text-purple-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Roster List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <Users size={36} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Students Found</h3>
          <p className="text-xs text-slate-500">
            {search
              ? `No students matching "${search}" in this course roster.`
              : 'No students have enrolled in this course yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((st) => {
            const statusConfig = STATUS_CONFIG[st.status] || STATUS_CONFIG.in_progress;

            return (
              <div
                key={st._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Student Identity */}
                <div className="flex items-center space-x-3.5 min-w-[240px]">
                  {st.avatar ? (
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-11 h-11 rounded-full object-cover border border-purple-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-900 font-bold flex items-center justify-center border border-purple-200 text-sm">
                      {st.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'ST'}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{st.name}</h4>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
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
                    <p className="text-xs text-slate-500">{st.email}</p>
                  </div>
                </div>

                {/* Course Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 max-w-xl text-center md:text-left">
                  {/* Topic Mastery */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Topic Mastery
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-sm font-bold text-slate-800">
                        {st.topicCompletionRate}%
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({st.completedTopics}/{st.totalTopics})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${st.topicCompletionRate}%`,
                          backgroundColor:
                            st.topicCompletionRate >= 75
                              ? '#10B981'
                              : st.topicCompletionRate >= 50
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      />
                    </div>
                  </div>

                  {/* Study Hours */}
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Course Hours
                    </div>
                    <div className="text-sm font-bold text-slate-800">{st.studyHours}h</div>
                    <span className="text-[11px] text-slate-400">
                      {st.sessionsCount} session(s)
                    </span>
                  </div>

                  {/* Quiz Average */}
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Quiz Score
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {st.averageQuizScore !== null ? `${st.averageQuizScore}%` : 'N/A'}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {st.quizAttemptsCount} attempt(s)
                    </span>
                  </div>

                  {/* Assignments */}
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Assignments
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {st.assignmentsSubmitted}/{st.totalAssignments}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {st.averageGrade !== null ? `Avg: ${st.averageGrade}%` : 'None graded'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Link
                    to={`/teacher/students/${st._id}`}
                    className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-xl text-white shadow-xs transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-primary, #5A5FDB)' }}
                  >
                    View Performance
                    <ChevronRight size={14} className="ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectStudents;
