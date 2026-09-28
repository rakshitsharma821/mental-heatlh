import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Storage } from '../../services/storage';
import { SanctuaryCompanion } from '../../services/companionEngine';
import { Link } from 'react-router-dom';

export default function CompanionDrawer() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize companion engine
  const companion = new SanctuaryCompanion(user);

  useEffect(() => {
    // Load persisted chat history across sessions
    const stored = Storage.getCompanionMessages();
    if (stored && stored.length > 0) {
      setMessages(stored);
    } else {
      // Proactive milestone acknowledgment greeting on first launch
      const greeting = companion.getProactiveMilestoneGreeting();
      const initial = [{
        id: 'msg-init',
        sender: 'aria',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    Storage.saveCompanionMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    // Natural soothing response delay
    setTimeout(() => {
      const response = companion.respond(userMsg.text);
      if (response) {
        const botMsg = {
          id: `aria-${Date.now()}`,
          sender: 'aria',
          text: response.text,
          isCrisis: response.isCrisis,
          actionLink: response.actionLink,
          actionText: response.actionText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedWithBot = [...newMessages, botMsg];
        setMessages(updatedWithBot);
        Storage.saveCompanionMessages(updatedWithBot);
      }
      setIsTyping(false);
    }, 700);
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
        <span className="companion-btn-icon">✦</span>
        <span className="companion-btn-label">Aria</span>
      </button>

      {/* Slide-out Companion Window */}
      {isOpen && (
        <div className="companion-window-overlay">
          <div className="companion-card">
            {/* Header */}
            <div className="companion-header">
              <div className="companion-title-group">
                <div className="companion-avatar">✦</div>
                <div>
                  <h4>Aria • AI Wellness Companion</h4>
                  <p className="companion-status">Remembering your progress • Confidential</p>
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
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Safety banner inside companion */}
            <div className="companion-safety-bar">
              <span>Need immediate urgent care?</span>
              <Link to="/crisis" onClick={() => setIsOpen(false)}>Get Crisis Support 🛡️</Link>
            </div>

            {/* Messages Body */}
            <div className="companion-body">
              {messages.map(msg => (
                <div key={msg.id} className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'aria-row'}`}>
                  {msg.sender === 'aria' && <div className="chat-avatar-mini">✦</div>}
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
                    <span className="chat-timestamp">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="chat-bubble-row aria-row">
                  <div className="chat-avatar-mini">✦</div>
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
                placeholder="Share how you are feeling or ask for a calming breath..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={400}
              />
              <button type="submit" disabled={!inputText.trim()} aria-label="Send message">
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
