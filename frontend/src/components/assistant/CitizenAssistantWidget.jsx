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
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { grievanceService } from '../../services/api';
import PriorityBadge from '../common/PriorityBadge';
import StatusBadge from '../common/StatusBadge';

const STARTER_PROMPTS = [
  '🗑️ Garbage piling up near street',
  '🕳️ Dangerous road pothole',
  '💡 Streetlight not working at night',
  '🚰 Water pipe bursting on main road',
  '🌊 Blocked drain causing sewage overflow',
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "Hello! I am your **CivicAI Citizen Guide**. I can help you understand how to report a civic issue in your area, suggest the right municipal department, and summarize your details into a ready grievance draft.\n\nWhat issue would you like to report today?",
  suggestedCategory: null,
  draftGrievance: null,
  readyToDraft: false,
};

const CitizenAssistantWidget = () => {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [latestDraft, setLatestDraft] = useState(null);

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

      if (response.success && response.data) {
        const aiData = response.data;
        const assistantMsg = {
          role: 'assistant',
          content: aiData.reply || 'I understand. Let me help you prepare this report.',
          suggestedCategory: aiData.suggestedCategory,
          draftGrievance: aiData.draftGrievance,
          readyToDraft: aiData.readyToDraft,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (aiData.draftGrievance) {
          setLatestDraft(aiData.draftGrievance);
        }
      } else {
        setError('Could not get a response from the assistant. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Assistant service is temporarily unavailable. Please try again.'
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
    setError('');
    setInputMessage('');
  };

  const handleCreateGrievanceFromChat = (draft) => {
    const payload = draft || latestDraft;
    if (!payload) return;

    setIsOpen(false);
    navigate('/grievances/new', {
      state: {
        prefill: {
          title: payload.title || '',
          description: payload.description || '',
          category: payload.category || 'Other',
        },
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
              AI Citizen Guide
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Help reporting issues
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
            width: 'min(420px, calc(100vw - 32px))',
            height: 'min(620px, calc(100vh - 40px))',
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
              Guidance only. Not a govt authority. You will review and submit your grievance manually.
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
                    gap: '0.35rem',
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

                  {/* If assistant returned a draft grievance object */}
                  {!isUser && msg.draftGrievance && (
                    <div
                      style={{
                        marginLeft: '2rem',
                        marginTop: '0.25rem',
                        padding: '0.75rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 'var(--radius-md)',
                        maxWidth: '88%',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          marginBottom: '0.3rem',
                        }}
                      >
                        <FileText size={13} />
                        <span>Ready Grievance Summary</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#14532d', marginBottom: '0.25rem' }}>
                        <strong>Title:</strong> {msg.draftGrievance.title}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.6rem' }}>
                        <strong>Category:</strong> {msg.draftGrievance.category}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCreateGrievanceFromChat(msg.draftGrievance)}
                        className="btn btn-sm"
                        style={{
                          width: '100%',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.775rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>Create grievance from this conversation</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>AI Guide is preparing advice...</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: '#991b1b',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
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
                  onClick={() => handleSendMessage(promptText.replace(/^.+?\s/, ''))}
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
    </>
  );
};

export default CitizenAssistantWidget;
