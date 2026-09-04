import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  TrendingUp,
  X,
  Sparkles,
  ArrowUpDown,
  GraduationCap,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import teacherService from '../../services/teacherService';
import { PageHeader, StatCard } from '../../components/UI';

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

const TeacherStudents = () => {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('studyHours_desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        search: search.trim(),
        status: statusFilter,
        sort,
      };
      if (selectedSubject !== 'all') {
        params.subjectId = selectedSubject;
      }

      const res = await teacherService.getStudents(params);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError('Failed to load students monitoring data.');
      }
    } catch (err) {
      console.error('Error fetching teacher students:', err);
      setError(err.message || 'Could not retrieve student monitoring data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSubject, statusFilter, sort]);

  // Debounced search on enter or button click
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleClearSearch = () => {
    setSearch('');
    setTimeout(() => {
      fetchStudents();
    }, 0);
  };

  const cohortSummary = data?.cohortSummary || {};
  const assignedSubjects = data?.assignedSubjects || [];
  const students = data?.students || [];

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* 1. Header */}
      <PageHeader
        title="Student Monitoring & Performance Hub 👥"
        subtitle="Inspect student syllabus mastery, assignment submissions, quiz performance, and weak concepts across your classes in real time."
        badge={
          <span className="badge badge-purple">
            <Users size={12} className="mr-1" />
            {assignedSubjects.length} Active Courses
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/teacher/dashboard"
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              Dashboard
            </Link>
            <Link
              to="/teacher/subjects"
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem' }}
            >
              <BookOpen size={14} className="mr-1.5" />
              Manage Subjects
            </Link>
          </div>
        }
      />

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Students"
          value={cohortSummary.totalStudents || 0}
          icon={Users}
          pastelVariant="purple"
        />
        <StatCard
          title="Average Topic Mastery"
          value={`${cohortSummary.averageTopicCompletion || 0}%`}
          icon={TrendingUp}
          pastelVariant="blue"
        />
        <StatCard
          title="Class Quiz Average"
          value={`${cohortSummary.averageQuizScore || 0}%`}
          icon={Award}
          pastelVariant="periwinkle"
        />
        <StatCard
          title="Total Study Hours"
          value={`${cohortSummary.totalStudyHoursLogged || 0}h`}
          icon={Clock}
          pastelVariant="lilac"
        />
      </div>

      {/* 3. Interactive Filters & Search Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or email..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Subject Filter & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Subject Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Course:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="all">All Enrolled Courses ({assignedSubjects.length})</option>
                {assignedSubjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title} ({s.code || 'Gen'})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center space-x-2">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="studyHours_desc">Most Study Hours</option>
                <option value="studyHours_asc">Least Study Hours</option>
                <option value="mastery_asc">Lowest Topic Mastery (Urgent)</option>
                <option value="mastery_desc">Highest Topic Mastery</option>
                <option value="quizScore_desc">Highest Quiz Score</option>
                <option value="quizScore_asc">Lowest Quiz Score</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'all', label: 'All Students' },
            { id: 'on_track', label: 'On Track' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'needs_support', label: 'Needs Support' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
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

      {/* 4. Student List / Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded"></div>
                  <div className="h-3 w-48 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-24 bg-slate-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-8 border border-red-200 text-center space-y-3">
          <ShieldAlert size={32} className="text-red-500 mx-auto" />
          <h3 className="font-bold text-slate-800">Could Not Load Student Monitoring Data</h3>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchStudents}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
            style={{ backgroundColor: 'var(--brand-primary, #5A5FDB)' }}
          >
            Retry
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <Users size={40} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Students Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? `No students matching "${search}" in your enrolled courses.`
              : 'No students are currently enrolled in your assigned active courses.'}
          </p>
          {search && (
            <button
              onClick={handleClearSearch}
              className="text-xs font-semibold text-purple-700 hover:underline cursor-pointer"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const statusConfig = STATUS_CONFIG[student.status] || STATUS_CONFIG.in_progress;

            return (
              <div
                key={student._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Student Identity & Badges */}
                <div className="flex items-center space-x-3.5 min-w-[240px]">
                  {student.avatar ? (
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-11 h-11 rounded-full object-cover border border-purple-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-900 font-bold flex items-center justify-center border border-purple-200 text-sm">
                      {student.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'ST'}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{student.name}</h4>
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
                    <p className="text-xs text-slate-500">{student.email}</p>
                    <span className="inline-block text-[11px] font-medium text-slate-400">
                      Enrolled in {student.enrolledSubjectsCount || 1} of your course(s)
                    </span>
                  </div>
                </div>

                {/* Middle: Key Academic Progress Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 max-w-xl text-center md:text-left">
                  {/* Topic Progress */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Topic Mastery
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-sm font-bold text-slate-800">
                        {student.topicCompletionRate}%
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({student.completedTopics}/{student.totalTopics})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${student.topicCompletionRate}%`,
                          backgroundColor:
                            student.topicCompletionRate >= 75
                              ? '#10B981'
                              : student.topicCompletionRate >= 50
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      />
                    </div>
                  </div>

                  {/* Study Hours */}
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Study Hours
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {student.studyHours}h
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {student.sessionsCount} session(s)
                    </span>
                  </div>

                  {/* Quiz Average */}
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Quiz Average
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {student.averageQuizScore !== null ? `${student.averageQuizScore}%` : 'N/A'}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {student.quizAttemptsCount} attempt(s)
                    </span>
                  </div>

                  {/* Assignments */}
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Assignments
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {student.assignmentsSubmitted}/{student.totalAssignments}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {student.totalAssignments > 0
                        ? `${Math.round((student.assignmentsSubmitted / student.totalAssignments) * 100)}% done`
                        : 'None assigned'}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Link
                    to={`/recommendations?studentId=${student._id}`}
                    className="p-2 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                    title="View Student's AI Study Recommendations"
                  >
                    <Sparkles size={16} />
                  </Link>

                  <Link
                    to={`/teacher/students/${student._id}`}
                    className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: 'var(--brand-primary, #5A5FDB)' }}
                  >
                    Inspect Performance
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

export default TeacherStudents;
