import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Storage } from '../../services/storage';
import { SanctuaryCompanion } from '../../services/companionEngine';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/appConfig';
import { UI_STRINGS } from '../../config/strings';

export default function CompanionDrawer() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize companion engine for local safety fallback
  const companionRef = useRef(null);
  if (!companionRef.current) {
    companionRef.current = new SanctuaryCompanion(user);
  } else if (companionRef.current.user !== user) {
    companionRef.current.user = user;
  }
  const companion = companionRef.current;

  // Listen to external open events (e.g. from Recommendations page)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-companion-drawer', handleOpen);
    return () => window.removeEventListener('open-companion-drawer', handleOpen);
  }, []);

  useEffect(() => {
    // Load persisted chat history across sessions
    const stored = Storage.getCompanionMessages();
    if (stored && stored.length > 0) {
      setMessages(stored);
    } else {
      // Proactive milestone acknowledgment greeting on first launch (never echoes negative mood labels)
      const greeting = companion.getProactiveMilestoneGreeting();
      const initial = [{
        id: 'msg-init',
        sender: 'aria',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: [
          { label: ' Feeling tired today', action: 'chat' },
          { label: ' Guide me through a breath', action: 'breath' },
          { label: ' Lot on my mind', action: 'journal' },
          { label: ' Just want to chat', action: 'chat' }
        ]
      }];
      setMessages(initial);
      Storage.saveCompanionMessages(initial);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    Storage.saveCompanionMessages(newMessages);
    setIsTyping(true);

    try {
      const token = Storage.get('mindcare_auth_token') || localStorage.getItem('mindcare_auth_token');
      const response = await fetch(`${API_BASE_URL}/companion/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text) {
          const botMsg = {
            id: `aria-${Date.now()}`,
            sender: 'aria',
            text: data.text,
            isCrisis: data.isCrisis,
            quickReplies: data.quickReplies,
            actionLink: data.actionLink,
            actionText: data.actionText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const updatedWithBot = [...newMessages, botMsg];
          setMessages(updatedWithBot);
          Storage.saveCompanionMessages(updatedWithBot);
          setIsTyping(false);
          return;
        }
      }
      throw new Error('Fallback to local engine');
    } catch (_) {
      // Safe offline / error fallback to local engine
      const fallback = companion.respond(text);
      if (fallback) {
        const botMsg = {
          id: `aria-${Date.now()}`,
          sender: 'aria',
          text: fallback.text,
          isCrisis: fallback.isCrisis,
          actionLink: fallback.actionLink,
          actionText: fallback.actionText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedWithBot = [...newMessages, botMsg];
        setMessages(updatedWithBot);
        Storage.saveCompanionMessages(updatedWithBot);
      }
      setIsTyping(false);
    }
  };

  const handleQuickReply = async (action, label) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    Storage.saveCompanionMessages(newMessages);
    setIsTyping(true);

    try {
      const token = Storage.get('mindcare_auth_token') || localStorage.getItem('mindcare_auth_token');
      const response = await fetch(`${API_BASE_URL}/companion/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action,
          message: label,
          history: newMessages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text) {
          const botMsg = {
            id: `aria-${Date.now()}`,
            sender: 'aria',
            text: data.text,
            isCrisis: data.isCrisis,
            quickReplies: data.quickReplies,
            actionLink: data.actionLink,
            actionText: data.actionText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const updatedWithBot = [...newMessages, botMsg];
          setMessages(updatedWithBot);
          Storage.saveCompanionMessages(updatedWithBot);
          setIsTyping(false);
          return;
        }
      }
      throw new Error('Local fallback');
    } catch (_) {
      const fallback = companion.respond(label);
      if (fallback) {
        const botMsg = {
          id: `aria-${Date.now()}`,
          sender: 'aria',
          text: fallback.text,
          isCrisis: fallback.isCrisis,
          actionLink: fallback.actionLink,
          actionText: fallback.actionText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedWithBot = [...newMessages, botMsg];
        setMessages(updatedWithBot);
        Storage.saveCompanionMessages(updatedWithBot);
      }
      setIsTyping(false);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm('Clear your companion conversation history?')) {
      Storage.clearCompanionMessages();
      const greeting = companion.getProactiveMilestoneGreeting();
      const reset = [{
        id: 'msg-init-reset',
        sender: 'aria',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      setMessages(reset);
      Storage.saveCompanionMessages(reset);
    }
  };

  return (
    <>
      {/* Floating Sanctuary Companion Trigger */}
      <button 
        className="companion-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Mental Wellness Companion"
        title="Chat with Aria — MindCare Companion"
      >
        <span className="companion-glow-ring"></span>
        <span className="companion-btn-icon">{UI_STRINGS.brand.sparkle}</span>
        <span className="companion-btn-label">{UI_STRINGS.companion.title} AI</span>
      </button>

      {/* Slide-out Companion Window */}
      {isOpen && (
        <div className="companion-window-overlay">
          <div className="companion-card">
            {/* Header */}
            <div className="companion-header">
              <div className="companion-title-group">
                <div className="companion-avatar">{UI_STRINGS.brand.sparkle}</div>
                <div>
                  <h4>Aria • Care Companion</h4>
                  <p className="companion-status">Personal Sanctuary Companion</p>
                </div>
              </div>
              <div className="companion-header-actions">
                <button 
                  className="icon-btn-ghost" 
                  onClick={clearChatHistory}
                  title="Clear conversation memory"
                >
                  ↺
                </button>
                <button 
                  className="icon-btn-ghost" 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Companion Window"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Safety banner inside companion */}
            <div className="companion-safety-bar">
              <span>Need immediate urgent care?</span>
              <Link to="/crisis" onClick={() => setIsOpen(false)}>Get Crisis Support </Link>
            </div>

            {/* Messages Body */}
            <div className="companion-body">
              {messages.map(msg => (
                <div key={msg.id} className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'aria-row'}`}>
                  {msg.sender === 'aria' && <div className="chat-avatar-mini"></div>}
                  <div className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'aria-bubble'} ${msg.isCrisis ? 'crisis-highlight' : ''}`}>
                    <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                    {msg.actionLink && (
                      <Link 
                        to={msg.actionLink} 
                        className="chat-action-btn"
                        onClick={() => setIsOpen(false)}
                      >
                        {msg.actionText || 'Take Action'} →
                      </Link>
                    )}

                    {/* Quick Reply Pills */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {msg.quickReplies.map((qr, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleQuickReply(qr.action, qr.label)}
                            style={{
                              background: 'rgba(82, 183, 136, 0.2)',
                              border: '1px solid var(--primary)',
                              borderRadius: '100px',
                              padding: '5px 12px',
                              fontSize: '0.8rem',
                              color: 'var(--primary-dark)',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {qr.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="chat-timestamp">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="chat-bubble-row aria-row">
                  <div className="chat-avatar-mini"></div>
                  <div className="chat-bubble aria-bubble typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form className="companion-footer" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={UI_STRINGS.companion.inputPlaceholder}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={400}
              />
              <button 
                type="submit" 
                disabled={!inputText.trim()} 
                aria-label="Send message to Aria"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
