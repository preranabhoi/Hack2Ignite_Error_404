import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Loader2,
  FileText,
  ArrowRight,
  RotateCcw,
  Bot,
  User,
  AlertCircle,
  ShieldAlert,
  Edit3,
  Check,
  Building,
  Tag,
  Clock,
  MapPin,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { grievanceService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PriorityBadge from '../common/PriorityBadge';

const STARTER_PROMPTS = [
  'Broken pipeline',
  'Garbage piling up',
  'Dangerous pothole',
  'Street light not working',
  'Blocked drainage',
  'Water supply problem',
  'Damaged road',
  'Electric pole issue',
  'Illegal dumping',
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "Hello! I am your **CivicAI Citizen Guide**. I can help you understand how to report a civic issue in your area, suggest the right municipal department, and summarize your details into a ready grievance draft.\n\nTell me what issue you are facing.",
  category: null,
  department: null,
  priority: null,
  priorityReason: null,
  location: null,
  suggestedAction: null,
  draft: null,
  readyForDraft: false,
};

const CitizenAssistantWidget = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isAuthenticated = Boolean(user && token);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [latestDraft, setLatestDraft] = useState(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editedDraft, setEditedDraft] = useState({ title: '', description: '', location: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend = null) => {
    const text = typeof textToSend === 'string' ? textToSend : inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInputMessage('');
    setError('');
    setIsLoading(true);

    try {
      // Send conversation to backend assistant endpoint
      const response = await grievanceService.chatAssistant(
        newMessages.map((m) => ({ role: m.role, content: m.content }))
      );

      if (response && (response.success || response.data)) {
        const aiData = response.data || response;
        const currentDraft = aiData.draft || aiData.draftGrievance || null;

        const assistantMsg = {
          role: 'assistant',
          content: aiData.reply || 'I understand. Let me help you prepare this report.',
          category: aiData.category || aiData.suggestedCategory || null,
          department: aiData.department || null,
          priority: aiData.priority || null,
          priorityReason: aiData.priorityReason || null,
          location: aiData.location || null,
          suggestedTitle: aiData.suggestedTitle || null,
          suggestedAction: aiData.suggestedAction || null,
          draft: currentDraft,
          readyForDraft: Boolean(aiData.readyForDraft || aiData.readyToDraft || currentDraft),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (currentDraft) {
          setLatestDraft(currentDraft);
          setEditedDraft({
            title: currentDraft.title || '',
            description: currentDraft.description || '',
            location: currentDraft.location || '',
          });
        }
      } else {
        setError('The AI assistant is temporarily unavailable. You can still submit your grievance using the standard grievance form.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'The AI assistant is temporarily unavailable. You can still submit your grievance using the standard grievance form.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setLatestDraft(null);
    setIsEditingDraft(false);
    setError('');
    setInputMessage('');
  };

  const handleCreateGrievanceFromChat = (draftToUse = null) => {
    const activeDraft = draftToUse || latestDraft;
    if (!activeDraft) return;

    const finalDraft = isEditingDraft
      ? {
          ...activeDraft,
          title: editedDraft.title || activeDraft.title,
          description: editedDraft.description || activeDraft.description,
          location: editedDraft.location || activeDraft.location,
        }
      : activeDraft;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsOpen(false);
    navigate('/grievances/new', {
      state: {
        prefill: {
          title: finalDraft.title || '',
          description: finalDraft.description || '',
          category: finalDraft.category || 'Roads',
          priority: finalDraft.priority || 'Medium',
          location: finalDraft.location || '',
          department: finalDraft.department || '',
        },
      },
    });
  };

  const handleManualSubmitRedirect = () => {
    setIsOpen(false);
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/grievances/new' } });
    } else {
      navigate('/grievances/new');
    }
  };

  const handleProceedToLogin = () => {
    setIsOpen(false);
    setShowAuthModal(false);
    navigate('/login', {
      state: {
        from: '/grievances/new',
        prefill: latestDraft,
      },
    });
  };

  const handleProceedToRegister = () => {
    setIsOpen(false);
    setShowAuthModal(false);
    navigate('/register', {
      state: {
        from: '/grievances/new',
        prefill: latestDraft,
      },
    });
  };

  return (
    <>
      {/* Floating Action Bubble */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn-assistant-floating"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            backgroundColor: '#0f172a',
            color: 'white',
            border: '1.5px solid #38bdf8',
            borderRadius: 'var(--radius-full)',
            padding: '0.75rem 1.25rem',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.35)',
            cursor: 'pointer',
            transition: 'all var(--transition-normal)',
          }}
          title="Open AI Citizen Guide"
        >
          <div
            style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} color="#fbbf24" />
          </div>
          <div style={{ textAlign: 'left', lineHeight: '1.15' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>
              CivicAI Citizen Guide
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Advisory issue reporting assistant
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal Box */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: 'min(440px, calc(100vw - 32px))',
            height: 'min(640px, calc(100vh - 40px))',
            zIndex: 1600,
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'modal-appear 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.9rem 1.15rem',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#0284c7',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                    CivicAI Citizen Guide
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: '#0369a1',
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      color: '#e0f2fe',
                    }}
                  >
                    AI
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Advisory issue reporting assistant
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={handleReset}
                title="Reset conversation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Guardrail Disclaimer Banner */}
          <div
            style={{
              padding: '0.45rem 0.85rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.725rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldAlert size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>
              Guidance only. Not a government authority. You will review and submit your grievance manually.
            </span>
          </div>

          {/* Message Thread Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'var(--bg-main)',
            }}
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.4rem',
                      flexDirection: isUser ? 'row-reverse' : 'row',
                      maxWidth: '92%',
                    }}
                  >
                    <div
                      style={{
                        width: '1.6rem',
                        height: '1.6rem',
                        borderRadius: '50%',
                        backgroundColor: isUser ? 'var(--primary)' : '#0284c7',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isUser ? <User size={12} /> : <Bot size={12} />}
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        lineHeight: '1.5',
                        backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-surface)',
                        color: isUser ? 'white' : 'var(--text-main)',
                        border: isUser ? 'none' : '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-sm)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>

                  {/* If assistant returned a structured draft grievance */}
                  {!isUser && msg.draft && (
                    <div
                      style={{
                        marginLeft: '2rem',
                        marginTop: '0.25rem',
                        padding: '0.85rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 'var(--radius-md)',
                        maxWidth: '92%',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: '#166534',
                            fontWeight: 700,
                            fontSize: '0.825rem',
                          }}
                        >
                          <FileText size={15} />
                          <span>Grievance Draft Ready</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingDraft(!isEditingDraft)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#15803d',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Edit3 size={12} />
                          <span>{isEditingDraft ? 'Done Editing' : 'Edit Draft'}</span>
                        </button>
                      </div>

                      {isEditingDraft ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534' }}>Title</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.775rem', padding: '0.3rem 0.5rem' }}
                              value={editedDraft.title}
                              onChange={(e) => setEditedDraft({ ...editedDraft, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534' }}>Location</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.775rem', padding: '0.3rem 0.5rem' }}
                              value={editedDraft.location}
                              onChange={(e) => setEditedDraft({ ...editedDraft, location: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534' }}>Description</label>
                            <textarea
                              rows={3}
                              className="form-input"
                              style={{ fontSize: '0.775rem', padding: '0.3rem 0.5rem' }}
                              value={editedDraft.description}
                              onChange={(e) => setEditedDraft({ ...editedDraft, description: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.825rem', color: '#14532d', marginBottom: '0.35rem', fontWeight: 700 }}>
                            {editedDraft.title || msg.draft.title}
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                              📁 {msg.draft.category}
                            </span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                              🏢 {msg.draft.department}
                            </span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                              ⚡ Suggested: {msg.draft.priority}
                            </span>
                            {msg.draft.location && (
                              <span style={{ fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                📍 {editedDraft.location || msg.draft.location}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            {editedDraft.description || msg.draft.description}
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleCreateGrievanceFromChat(msg.draft)}
                          className="btn btn-sm"
                          style={{
                            flex: 1,
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            padding: '0.45rem 0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                          }}
                        >
                          <span>Create Grievance</span>
                          <ArrowRight size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="btn btn-sm"
                          style={{
                            backgroundColor: 'transparent',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem',
                            padding: '0.45rem 0.6rem',
                          }}
                        >
                          Start Over
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Analyzing your issue...</span>
              </div>
            )}

            {/* Error Message & Fallback */}
            {error && (
              <div
                style={{
                  padding: '0.75rem 0.85rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: '#991b1b',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={handleManualSubmitRedirect}
                  className="btn btn-sm"
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.6rem',
                  }}
                >
                  Submit Grievance Manually
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick starter chips (if only 1 or 2 messages) */}
          {messages.length <= 2 && !isLoading && (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '0.4rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {STARTER_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.725rem',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                  }}
                >
                  {promptText}
                </button>
              ))}
            </div>
          )}

          {/* Form Input Footer */}
          <div
            style={{
              padding: '0.75rem 0.9rem',
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Describe your civic issue (e.g. Broken pipe in ward 4)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="form-input"
              style={{
                flex: 1,
                padding: '0.55rem 0.85rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
              }}
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: '50%',
                width: '2.2rem',
                height: '2.2rem',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal when unauthenticated citizen tries to create grievance */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1700,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '420px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <LogIn size={24} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Sign In to Submit Your Grievance
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your grievance draft has been saved. Please sign in or create a citizen account to officially submit and track your complaint.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={handleProceedToLogin}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <LogIn size={16} />
                <span>Sign In as Citizen</span>
              </button>
              <button
                type="button"
                onClick={handleProceedToRegister}
                className="btn btn-outline"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <UserPlus size={16} />
                <span>Register as Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  marginTop: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Cancel & Continue Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CitizenAssistantWidget;
