import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Edit2,
  Check,
  Copy,
  BookOpen,
  Layers,
  ArrowRight,
  Bot,
  User as UserIcon,
  Search,
  ChevronDown,
  X,
  FileText,
  HelpCircle,
  Lightbulb,
  Zap,
  Target,
  MessageSquare,
  AlertCircle,
  Clock,
  Menu,
} from 'lucide-react';
import chatService from '../../services/chatService';
import subjectService from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import { useAuth } from '../../context/AuthContext';

const STARTER_PROMPTS = [
  {
    icon: Lightbulb,
    category: 'Concept Intuition',
    color: '#FFD6FF',
    title: 'Explain with an Analogy',
    prompt: 'Can you explain the core intuition behind this concept using a simple real-world analogy and key takeaways?',
  },
  {
    icon: Zap,
    category: 'Step-by-Step Walkthrough',
    color: '#E7C6FF',
    title: 'Worked Example Problem',
    prompt: 'Can you provide a concrete step-by-step example problem with full calculations and explanations?',
  },
  {
    icon: FileText,
    category: 'Exam Revision',
    color: '#C8B6FF',
    title: 'High-Yield Summary',
    prompt: 'Give me a high-yield exam revision sheet: key definitions, essential formulas, and common pitfalls to avoid.',
  },
  {
    icon: Target,
    category: 'Self-Testing',
    color: '#B8C0FF',
    title: 'Challenge My Understanding',
    prompt: 'Test my comprehension with 2 challenging conceptual questions and give me feedback on my answers.',
  },
];

const AIAssistant = () => {
  const { conversationId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Subject & Topic Context State
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subjectId') || '');
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get('topicId') || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Chat Input State
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll smoothly to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Load initial subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await subjectService.getSubjects(true);
        setSubjects(res.subjects || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch topics whenever selectedSubject changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) {
        setTopics([]);
        setSelectedTopic('');
        return;
      }
      try {
        const res = await topicService.getTopicsBySubject(selectedSubject);
        setTopics(res.topics || []);
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    };
    fetchTopics();
  }, [selectedSubject]);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success) {
        setConversations(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load specific conversation if URL param is set
  useEffect(() => {
    const loadActiveChat = async () => {
      if (!conversationId || conversationId === 'new') {
        setActiveConversation(null);
        setMessages([]);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const res = await chatService.getConversationById(conversationId);
        if (res.success && res.data) {
          setActiveConversation(res.data);
          setMessages(res.data.messages || []);
          if (res.data.subject?._id) {
            setSelectedSubject(res.data.subject._id);
          }
          if (res.data.topic?._id) {
            setSelectedTopic(res.data.topic._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversation:', err);
        setErrorMsg('Could not load selected conversation.');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadActiveChat();
  }, [conversationId]);

  // Handle Sending a Message
  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isSending) return;

    // Optimistically append user message
    const tempUserMsg = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setIsSending(true);
    setErrorMsg('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const payload = {
        message: query,
        conversationId: activeConversation?._id || conversationId || 'new',
        subjectId: selectedSubject || undefined,
        topicId: selectedTopic || undefined,
      };

      const res = await chatService.sendMessage(payload);

      if (res.success && res.data) {
        const aiMsg = {
          role: 'model',
          content: res.data.reply,
          suggestedFollowUps: res.data.suggestedFollowUps || [],
          contextUsed: {
            subjectTitle: res.data.subject?.title || '',
            topicTitle: res.data.topic?.title || '',
          },
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMsg]);

        // If newly created conversation, redirect to its permalink
        if (!activeConversation || !conversationId || conversationId === 'new') {
          setActiveConversation({
            _id: res.data.conversationId,
            title: res.data.title,
            subject: res.data.subject,
            topic: res.data.topic,
          });
          navigate(`/assistant/${res.data.conversationId}`, { replace: true });
        }

        // Refresh conversation sidebar
        loadConversations();
      }
    } catch (err) {
      console.error('Send message error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to get response from AI Assistant. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Quick Start a New Chat
  const handleStartNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setMobileSidebarOpen(false);
    navigate('/assistant');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Pin/Unpin Conversation
  const handleTogglePin = async (e, conv) => {
    e.stopPropagation();
    try {
      const updated = await chatService.updateConversation(conv._id, {
        pinned: !conv.pinned,
      });
      if (updated.success) {
        loadConversations();
        if (activeConversation?._id === conv._id) {
          setActiveConversation((prev) => ({ ...prev, pinned: !conv.pinned }));
        }
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Rename Conversation
  const handleSaveRename = async (convId) => {
    if (!editTitleValue.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      const res = await chatService.updateConversation(convId, {
        title: editTitleValue.trim(),
      });
      if (res.success) {
        setEditingTitleId(null);
        loadConversations();
        if (activeConversation?._id === convId) {
          setActiveConversation((prev) => ({ ...prev, title: editTitleValue.trim() }));
        }
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this study discussion?')) return;

    try {
      const res = await chatService.deleteConversation(convId);
      if (res.success) {
        loadConversations();
        if (activeConversation?._id === convId) {
          handleStartNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Copy response text
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Save Assistant Reply directly to My Notes
  const handleSaveAsNote = (content, contextUsed) => {
    const title = activeConversation?.title
      ? `AI Notes: ${activeConversation.title}`
      : 'AI Study Assistant Notes';

    const params = new URLSearchParams();
    params.set('title', title);
    params.set('content', content);
    if (selectedSubject) params.set('subjectId', selectedSubject);
    if (selectedTopic) params.set('topicId', selectedTopic);

    navigate(`/notes/new?${params.toString()}`);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    return c.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const pinnedList = filteredConversations.filter((c) => c.pinned);
  const recentList = filteredConversations.filter((c) => !c.pinned);

  // Active Subject & Topic Objects
  const activeSubjectObj = subjects.find((s) => s._id === selectedSubject);
  const activeTopicObj = topics.find((t) => t._id === selectedTopic);

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-studio-container animate-fade-in">
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="ai-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR: Conversation History & Filters                          */}
      {/* ========================================================================= */}
      <aside className={`ai-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header & New Chat Button */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>
          <button
            onClick={handleStartNewChat}
            className="btn btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.75rem',
              borderRadius: '12px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(200, 182, 255, 0.35)',
            }}
          >
            <Plus size={18} />
            <span>New Academic Chat</span>
          </button>

          {/* Search Chats */}
          <div
            style={{
              marginTop: '0.75rem',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '10px' }}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{
                paddingLeft: '32px',
                paddingTop: '0.45rem',
                paddingBottom: '0.45rem',
                fontSize: '0.84rem',
                borderRadius: '8px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {/* Pinned Section */}
          {pinnedList.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '0.4rem 0.5rem',
                }}
              >
                <Pin size={12} /> Pinned Discussions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {pinnedList.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Recent Section */}
          <div>
            {pinnedList.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '0.6rem 0.5rem 0.3rem',
                }}
              >
                <Clock size={12} /> Recent
              </div>
            )}
            {recentList.length === 0 && pinnedList.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.86rem',
                }}
              >
                <Bot size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No conversations yet.</p>
                <p style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Ask a question to begin!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {recentList.map((conv) => renderConversationItem(conv))}
              </div>
            )}
          </div>
        </div>

        {/* User Identity & Info Bar */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFAFD',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: 'var(--pastel-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: '#342852',
              }}
            >
              <Sparkles size={14} />
            </div>
            <span style={{ fontWeight: 600 }}>Gemini Pedagogical Engine</span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              backgroundColor: 'var(--pastel-periwinkle-subtle)',
              color: 'var(--brand-primary)',
              fontWeight: 700,
            }}
          >
            v1.5
          </span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CHAT CANVAS                                                      */}
      {/* ========================================================================= */}
      <main className="ai-chat-canvas">
        {/* Context Control Bar */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Active Chat Title & Grounding Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="btn btn-ghost mobile-chat-toggle"
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.4rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
              }}
              title="Toggle Conversations History"
            >
              <Menu size={18} />
            </button>

            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #FFD6FF, #C8B6FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(200, 182, 255, 0.4)',
                flexShrink: 0,
              }}
            >
              <Bot size={20} color="#342852" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    margin: 0,
                  }}
                >
                  {activeConversation?.title || 'Academic Discussion'}
                </h2>
                {activeConversation?.pinned && (
                  <Pin size={13} color="var(--brand-primary)" style={{ fill: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                {activeSubjectObj
                  ? `Active Syllabus: ${activeSubjectObj.title}${activeTopicObj ? ` • ${activeTopicObj.title}` : ''}`
                  : 'General Academic Knowledge (Select subject below for syllabus grounding)'}
              </p>
            </div>
          </div>

          {/* Context Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Subject Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BookOpen size={14} color="var(--brand-primary)" />
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic('');
                }}
                className="input-field"
                style={{
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  minWidth: '170px',
                }}
              >
                <option value="">-- All Subjects --</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.title} ({sub.code || 'CODE'})
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Layers size={14} color="var(--brand-primary)" />
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedSubject || topics.length === 0}
                className="input-field"
                style={{
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  backgroundColor: !selectedSubject ? '#F3F4F6' : '#FFFFFF',
                  minWidth: '150px',
                  cursor: !selectedSubject ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="">-- All Topics --</option>
                {topics.map((top) => (
                  <option key={top._id} value={top._id}>
                    {top.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Context Chip */}
            {(selectedSubject || selectedTopic) && (
              <button
                onClick={() => {
                  setSelectedSubject('');
                  setSelectedTopic('');
                }}
                className="btn btn-ghost"
                style={{
                  padding: '0.35rem 0.5rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  borderRadius: '6px',
                }}
                title="Clear syllabus context"
              >
                <X size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {errorMsg && (
          <div
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: '#FFF0F0',
              borderBottom: '1px solid #FFD0D0',
              color: '#D32F2F',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D32F2F' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Message Stream Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {messages.length === 0 ? (
            /* Empty State: Welcome Hero & Starter Prompt Cards */
            <div
              style={{
                maxWidth: '820px',
                margin: 'auto',
                width: '100%',
                padding: '2rem 1rem',
                textAlign: 'center',
              }}
            >
              {/* Genie Glow Icon */}
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '22px',
                  background: 'linear-gradient(135deg, #FFD6FF 0%, #C8B6FF 50%, #BBD0FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 8px 24px rgba(200, 182, 255, 0.45)',
                }}
              >
                <Sparkles size={34} color="#342852" />
              </div>

              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                }}
              >
                StudyGenie AI Learning Assistant
              </h1>

              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  maxWidth: '560px',
                  margin: '0 auto 2rem',
                  lineHeight: 1.6,
                }}
              >
                Ask academic questions, request simplified concept analogies, work through
                step-by-step problems, and test your understanding with guided self-check challenges.
              </p>

              {/* Starter Prompt Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  textAlign: 'left',
                }}
              >
                {STARTER_PROMPTS.map((card, idx) => {
                  const CardIcon = card.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(card.prompt)}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        cursor: 'pointer',
                        border: '1px solid var(--border-light)',
                        borderTop: `4px solid ${card.color}`,
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
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
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {card.category}
                          </span>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              backgroundColor: card.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CardIcon size={14} color="#342852" />
                          </div>
                        </div>
                        <h4
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            margin: '0 0 0.35rem',
                          }}
                        >
                          {card.title}
                        </h4>
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45,
                            margin: 0,
                          }}
                        >
                          {card.prompt}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--brand-primary)',
                        }}
                      >
                        <span>Ask Genie</span>
                        <ArrowRight size={13} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Render Message History */
            <div
              style={{
                maxWidth: '860px',
                margin: '0 auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isLatestAssistant = !isUser && idx === messages.length - 1;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    {/* Message Bubble Container */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        maxWidth: isUser ? '80%' : '100%',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          backgroundColor: isUser ? '#E8EEFF' : '#E7C6FF',
                          color: '#342852',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        {isUser ? (
                          user?.name ? (
                            user.name[0].toUpperCase()
                          ) : (
                            <UserIcon size={16} />
                          )
                        ) : (
                          <Sparkles size={16} />
                        )}
                      </div>

                      {/* Content Card */}
                      <div
                        style={{
                          backgroundColor: isUser ? '#E8EEFF' : '#FFFFFF',
                          border: isUser
                            ? '1px solid #D0DBFF'
                            : '1px solid var(--border-light)',
                          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          padding: '1.1rem 1.25rem',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                          color: 'var(--text-main)',
                          fontSize: '0.92rem',
                          lineHeight: 1.65,
                          position: 'relative',
                        }}
                      >
                        {/* Assistant Header Metadata */}
                        {!isUser && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              borderBottom: '1px solid #F0EDF6',
                              paddingBottom: '0.5rem',
                              marginBottom: '0.75rem',
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>
                                Genie AI
                              </span>
                              <span
                                style={{
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--pastel-lavender-subtle)',
                                  color: '#5C3C92',
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                }}
                              >
                                Gemini 1.5
                              </span>
                              {msg.contextUsed?.subjectTitle && (
                                <span
                                  style={{
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--pastel-sky-subtle)',
                                    color: '#1E4D8A',
                                    fontWeight: 600,
                                    fontSize: '0.68rem',
                                  }}
                                >
                                  {msg.contextUsed.subjectTitle}
                                </span>
                              )}
                            </div>

                            {/* Toolbar Buttons: Copy & Save as Note */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleCopy(msg.content, idx)}
                                className="btn btn-ghost"
                                style={{
                                  padding: '0.2rem 0.45rem',
                                  fontSize: '0.72rem',
                                  color: 'var(--text-secondary)',
                                  borderRadius: '6px',
                                }}
                                title="Copy explanation"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check size={12} color="#16A34A" />
                                    <span style={{ color: '#16A34A' }}>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleSaveAsNote(msg.content, msg.contextUsed)}
                                className="btn btn-ghost"
                                style={{
                                  padding: '0.2rem 0.45rem',
                                  fontSize: '0.72rem',
                                  color: 'var(--brand-primary)',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--pastel-lavender-subtle)',
                                }}
                                title="Save to My Notes"
                              >
                                <FileText size={12} />
                                <span>Save Note</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Render Body with Markdown Stylings */}
                        <div
                          style={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: isUser ? 'inherit' : 'inherit',
                          }}
                        >
                          {renderFormattedText(msg.content)}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Follow-up Suggestion Chips (rendered under latest assistant message) */}
                    {isLatestAssistant && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          marginLeft: '42px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          💡 Suggested Next Questions:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {msg.suggestedFollowUps.map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => handleSendMessage(chip)}
                              disabled={isSending}
                              style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px',
                                border: '1px solid #D8CFF7',
                                backgroundColor: '#F8F6FF',
                                color: '#4B367C',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#EFEAFF';
                                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#F8F6FF';
                                e.currentTarget.style.borderColor = '#D8CFF7';
                              }}
                            >
                              <span>{chip}</span>
                              <ArrowRight size={12} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pulsing Assistant Thinking State */}
              {isSending && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginLeft: '2px',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      backgroundColor: '#E7C6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <Sparkles size={16} color="#342852" />
                  </div>
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px 16px 16px 16px',
                      padding: '0.85rem 1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.3rem',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        className="pulse-dot"
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#C8B6FF',
                          animation: 'pulse 1.4s infinite ease-in-out',
                        }}
                      />
                      <span
                        className="pulse-dot"
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#B8C0FF',
                          animation: 'pulse 1.4s infinite ease-in-out 0.2s',
                        }}
                      />
                      <span
                        className="pulse-dot"
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#BBD0FF',
                          animation: 'pulse 1.4s infinite ease-in-out 0.4s',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Genie is formulating an intuitive explanation...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM INPUT DOCK                                                     */}
        {/* ========================================================================= */}
        <div
          style={{
            padding: '0.75rem 1.5rem 1.25rem',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid var(--border-light)',
            position: 'relative',
          }}
        >
          <div
            style={{
              maxWidth: '860px',
              margin: '0 auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {/* Grounding Context Preview Tag */}
            {(activeSubjectObj || activeTopicObj) && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.74rem',
                  color: '#4B367C',
                  backgroundColor: 'var(--pastel-lavender-subtle)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  alignSelf: 'flex-start',
                }}
              >
                <Target size={12} />
                <span>
                  Query Context: <strong>{activeSubjectObj?.title}</strong>
                  {activeTopicObj ? ` > ${activeTopicObj?.title}` : ''}
                </span>
              </div>
            )}

            {/* Input Bar Container */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.75rem',
                backgroundColor: '#FBFBFE',
                border: '1.5px solid #E2DCF0',
                borderRadius: '16px',
                padding: '0.65rem 0.85rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E2DCF0')}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  activeTopicObj
                    ? `Ask anything about ${activeTopicObj.title}... (e.g. explain step-by-step, give an example)`
                    : activeSubjectObj
                    ? `Ask anything about ${activeSubjectObj.title}...`
                    : 'Ask any academic question, request an analogy, or paste a problem...'
                }
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.92rem',
                  resize: 'none',
                  maxHeight: '160px',
                  color: 'var(--text-main)',
                  lineHeight: 1.45,
                  padding: '0.2rem 0',
                }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isSending}
                className="btn btn-primary"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: inputMessage.trim()
                    ? '0 3px 10px rgba(200, 182, 255, 0.4)'
                    : 'none',
                  opacity: !inputMessage.trim() || isSending ? 0.4 : 1,
                  cursor: !inputMessage.trim() || isSending ? 'not-allowed' : 'pointer',
                }}
                title="Send Question (Enter)"
              >
                <Send size={16} />
              </button>
            </div>

            {/* Bottom Keyboard Hint */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                padding: '0 0.35rem',
              }}
            >
              <span>Shift + Enter for new line • Enter to send</span>
              <span>StudyGenie AI Assistant uses verified course curriculum</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // Helper to render conversation list item in sidebar
  function renderConversationItem(conv) {
    const isActive = activeConversation?._id === conv._id;
    const isEditing = editingTitleId === conv._id;

    return (
      <div
        key={conv._id}
        onClick={() => {
          if (!isEditing) {
            setMobileSidebarOpen(false);
            navigate(`/assistant/${conv._id}`);
          }
        }}
        style={{
          padding: '0.65rem 0.75rem',
          borderRadius: '10px',
          cursor: 'pointer',
          backgroundColor: isActive ? 'var(--pastel-lavender-subtle)' : 'transparent',
          border: isActive ? '1px solid #D8CFF7' : '1px solid transparent',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = '#F6F5FB';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isEditing ? (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(conv._id);
                  if (e.key === 'Escape') setEditingTitleId(null);
                }}
                className="input-field"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '4px',
                }}
                autoFocus
              />
              <button
                onClick={() => handleSaveRename(conv._id)}
                className="btn btn-ghost"
                style={{ padding: '0.2rem' }}
              >
                <Check size={12} color="#16A34A" />
              </button>
            </div>
          ) : (
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--brand-primary)' : 'var(--text-main)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '180px',
              }}
            >
              {conv.title}
            </span>
          )}

          {/* Quick Actions (Pin, Rename, Delete) */}
          {!isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <button
                onClick={(e) => handleTogglePin(e, conv)}
                className="btn btn-ghost"
                style={{
                  padding: '0.2rem',
                  color: conv.pinned ? 'var(--brand-primary)' : 'var(--text-muted)',
                }}
                title={conv.pinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin size={12} style={{ fill: conv.pinned ? 'var(--brand-primary)' : 'none' }} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTitleId(conv._id);
                  setEditTitleValue(conv.title);
                }}
                className="btn btn-ghost"
                style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                title="Rename discussion"
              >
                <Edit2 size={12} />
              </button>

              <button
                onClick={(e) => handleDeleteConversation(e, conv._id)}
                className="btn btn-ghost"
                style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                title="Delete discussion"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
          {conv.subject?.title && (
            <span
              style={{
                padding: '0.05rem 0.35rem',
                borderRadius: '4px',
                backgroundColor: 'var(--pastel-sky-subtle)',
                color: '#1E4D8A',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '110px',
              }}
            >
              {conv.subject.title}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>
            {conv.messageCount} msg{conv.messageCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  }

  // Simple Markdown & Code Formatter
  function renderFormattedText(text) {
    if (!text) return '';

    // Split text by markdown code blocks ```code```
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].trim().match(/^[a-zA-Z0-9_-]+$/) ? lines[0].trim() : '';
        const codeContent = language ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div
            key={index}
            style={{
              margin: '0.75rem 0',
              backgroundColor: '#1E1E2E',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.75rem',
                backgroundColor: '#2A2A3C',
                color: '#A6ADC8',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
              }}
            >
              <span>{language || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeContent)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A6ADC8',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Copy size={11} /> Copy
              </button>
            </div>
            <pre
              style={{
                padding: '0.85rem',
                margin: 0,
                color: '#CDD6F4',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.84rem',
                overflowX: 'auto',
                lineHeight: 1.5,
              }}
            >
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Normal markdown styling for headings and bold
      return <span key={index}>{parseMarkdownInline(part)}</span>;
    });
  }

  function parseMarkdownInline(raw) {
    // Process headers and bold
    const lines = raw.split('\n');
    return lines.map((line, lIdx) => {
      if (line.startsWith('### ')) {
        return (
          <h3
            key={lIdx}
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: 'var(--brand-primary)',
              margin: '0.75rem 0 0.35rem',
            }}
          >
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2
            key={lIdx}
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--brand-primary)',
              margin: '0.85rem 0 0.4rem',
            }}
          >
            {line.replace('## ', '')}
          </h2>
        );
      }

      // Format bold (**text**)
      const boldParts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <React.Fragment key={lIdx}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              return (
                <strong key={bIdx} style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            return bPart;
          })}
          {lIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  }
};

export default AIAssistant;
