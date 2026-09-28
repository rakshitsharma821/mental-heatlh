import React, { useState, useEffect } from 'react';
import { Storage } from '../services/storage';
import InnerWorldCanvas from '../components/three/InnerWorldCanvas';

const PROMPTS = [
  "What is one feeling you've been hesitant to acknowledge today?",
  "Write about a moment this week when you felt even 5% calmer.",
  "If your anxiety was a messenger, what fear is it trying to protect you from?",
  "List three things in your immediate surroundings that feel pleasant or soothing.",
  "What is one expectation you can release today to give yourself room to breathe?",
  "What would you tell a beloved friend who is carrying the exact doubts you feel right now?"
];

const TAGS = ['Self-Compassion', 'Anxiety Defusion', 'Gratitude', 'Daily Win', 'Rest & Sleep', 'Unfiltered Stream'];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState('Self-Compassion');
  const [currentPrompt, setCurrentPrompt] = useState(PROMPTS[0]);
  const [saveToast, setSaveToast] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [saveRipple, setSaveRipple] = useState(null);

  useEffect(() => {
    setEntries(Storage.getJournalEntries());
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleNextPrompt = () => {
    const next = PROMPTS[(PROMPTS.indexOf(currentPrompt) + 1) % PROMPTS.length];
    setCurrentPrompt(next);
  };

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newEntry = {
      id: Date.now(),
      title: title.trim() || 'Untitled Reflection',
      text: text.trim(),
      prompt: currentPrompt,
      tag: selectedTag,
      wordCount,
      date: new Date().toISOString()
    };

    const updated = Storage.addJournalEntry(newEntry);
    setEntries(updated);
    setTitle('');
    setText('');
    setSaveToast(true);
    setSaveRipple(Date.now()); // Trigger tranquil outward water ripple!
    setIsTyping(false);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm('Delete this reflection entry?')) {
      const updated = Storage.deleteJournalEntry(id);
      setEntries(updated);
    }
  };

  return (
    <div className="journal-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <InnerWorldCanvas mode="ambient" isTyping={isTyping} rippleTrigger={saveRipple} growthLevel={0.65} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: '#6ec6e6', fontWeight: 700 }}>
            Cognitive Expression
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px' }}>Reflective Journal Sanctuary</h1>
          <p style={{ color: '#8aa9c4', fontSize: '0.95rem' }}>
            Give words to unexpressed thoughts. 100% private and stored locally on your device.
          </p>
        </div>

        {saveToast && (
          <div style={{
            background: 'rgba(136, 216, 176, 0.15)',
            border: '1px solid rgba(136, 216, 176, 0.4)',
            color: '#88d8b0',
            padding: '14px 20px',
            borderRadius: '14px',
            textAlign: 'center',
            marginBottom: '24px',
            fontWeight: 600
          }}>
            ✓ Reflection preserved in your private client-side vault.
          </div>
        )}

        {/* Prompt Card */}
        <div className="glass-card" style={{
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderLeft: '4px solid var(--primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>💡</span>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                Today's Inquiry
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px' }}>
                "{currentPrompt}"
              </div>
            </div>
          </div>
          <button
            onClick={handleNextPrompt}
            className="btn-ghost"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            ↻ Another Prompt
          </button>
        </div>

        {/* Editor Form */}
        <div className="glass-card" style={{ marginBottom: '40px' }}>
          <form onSubmit={handleSaveEntry}>
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                placeholder="Give your reflection a name (optional)..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ fontSize: '1.1rem', fontWeight: 600 }}
              />
            </div>

            {/* Tag selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    background: selectedTag === tag ? 'rgba(82, 183, 136, 0.2)' : 'var(--bg-surface)',
                    border: `1px solid ${selectedTag === tag ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    color: selectedTag === tag ? 'var(--primary-dark)' : 'var(--text-secondary)',
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Main writing textarea */}
            <div className="input-group">
              <textarea
                className="input-field"
                rows="8"
                placeholder="Let your thoughts flow freely. There is no right or wrong way to write..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                onKeyDown={() => {
                  setIsTyping(true);
                  clearTimeout(window.__journalTypingTimeout);
                  window.__journalTypingTimeout = setTimeout(() => setIsTyping(false), 2200);
                }}
                required
                style={{
                  lineHeight: '1.7',
                  fontSize: '1rem',
                  resize: 'vertical',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-surface-elevated)'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {wordCount} words • {text.length} characters
              </div>
              <button type="submit" className="btn-primary" disabled={!text.trim()}>
                Save Reflection ✦
              </button>
            </div>
          </form>
        </div>

        {/* Saved Entries */}
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '18px', color: 'var(--text-primary)' }}>Your Sacred Reflections</h3>
          {entries.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
              Your journal vault is currently empty. Write your first reflection above to build your private sanctuary archive.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {entries.map(entry => (
                <div key={entry.id} className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--primary-dark)',
                        background: 'rgba(82, 183, 136, 0.15)',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        marginBottom: '6px'
                      }}>
                        {entry.tag}
                      </span>
                      <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{entry.title}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="icon-btn-ghost"
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>

                  {entry.prompt && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--primary-dark)', fontStyle: 'italic', marginBottom: '12px' }}>
                      Prompt: "{entry.prompt}"
                    </div>
                  )}

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '14px' }}>
                    {entry.text}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                    <span>{new Date(entry.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span>{entry.wordCount} words</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
