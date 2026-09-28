// ============================================
// MindCare — Community Sanctuary & Peer Circles
// Opt-in, anonymous, matched strictly on shared intentions.
// Zero comparison, zero leaderboards, zero clinical or mood data leakage.
// ============================================

import React, { useState, useEffect } from 'react';
import { CommunityService, WELLNESS_INTENTIONS } from '../services/communityService';
import AmbientCanvas from '../components/three/AmbientCanvas';
import { Link } from 'react-router-dom';

export default function Community() {
  const [optedIn, setOptedIn] = useState(CommunityService.isOptedIn());
  const [selectedInterests, setSelectedInterests] = useState(CommunityService.getUserInterests());
  const [circles, setCircles] = useState([]);
  const [activeCircleId, setActiveCircleId] = useState('circle_breath_quiet');
  const [posts, setPosts] = useState([]);
  const [newEncouragement, setNewEncouragement] = useState('');
  const [alias, setAlias] = useState('Gentle Oak');

  useEffect(() => {
    if (optedIn) {
      const matched = CommunityService.getMatchedCircles();
      setCircles(matched);
      if (matched.length > 0 && !activeCircleId) {
        setActiveCircleId(matched[0].id);
      }
      setPosts(CommunityService.getCircleEncouragements(activeCircleId));
    }
  }, [optedIn, activeCircleId, selectedInterests]);

  const handleToggleOptIn = () => {
    const next = !optedIn;
    setOptedIn(next);
    CommunityService.setOptIn(next);
  };

  const handleToggleTag = (tagId) => {
    const updated = CommunityService.toggleInterest(tagId);
    setSelectedInterests([...updated]);
  };

  const handleSendPost = (e) => {
    e.preventDefault();
    if (!newEncouragement.trim()) return;
    const updated = CommunityService.sendEncouragement(activeCircleId, newEncouragement, alias);
    setPosts(updated);
    setNewEncouragement('');
  };

  const handleHeartPost = (postId) => {
    const updated = CommunityService.cheerEncouragement(activeCircleId, postId);
    setPosts(updated);
  };

  return (
    <div className="community-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <AmbientCanvas count={24} speed={0.2} />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Companion Circles
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Sanctuary Peer Circles
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '620px', margin: '0 auto' }}>
            A gentle, unhurried space for mutual encouragement. No leaderboards, no follower counts — just kindred travelers practicing quiet mindfulness.
          </p>
        </div>

        {/* Zero-Leakage Guarantee Badge */}
        <div className="glass-card" style={{
          padding: '18px 24px',
          marginBottom: '32px',
          borderLeft: '4px solid var(--primary)',
          background: 'linear-gradient(135deg, rgba(82, 183, 136, 0.08), rgba(255, 255, 255, 0.95))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.8rem' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                Zero Clinical & Mood Leakage Guarantee
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Circles match solely on your chosen wellness intentions. Your mood logs, AI insights, and clinical records are never visible to peers.
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleOptIn}
            className={optedIn ? 'btn-ghost' : 'btn-primary'}
            style={{ fontSize: '0.82rem', padding: '8px 18px' }}
          >
            {optedIn ? 'Leave Community (Opt Out)' : 'Join Peer Circles (Opt In) →'}
          </button>
        </div>

        {!optedIn ? (
          /* Opt-In Gate State */
          <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '48px 36px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌱</div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Connect with Mindful Companions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
              MindCare Peer Circles are completely voluntary. When you opt in, you choose wholesome intentions you'd like to cultivate (such as breathwork or gentle sleep rhythms). We pair you with calm companion pods of fellow members.
            </p>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 28px', fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>✓ <strong>100% Anonymous:</strong> You choose a calming nature alias.</li>
              <li>✓ <strong>No Comparison:</strong> No scores, streaks, or ranks.</li>
              <li>✓ <strong>Private:</strong> Your personal reflections stay strictly yours.</li>
            </ul>
            <button onClick={handleToggleOptIn} className="btn-primary" style={{ padding: '12px 32px', fontSize: '0.95rem' }}>
              I Understand — Opt In to Sanctuary Circles 🌿
            </button>
          </div>
        ) : (
          /* Active Community Experience */
          <div>
            {/* Step 1: Select Intentions */}
            <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  Your Selected Wellness Intentions
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Circles update automatically based on your tags
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '18px' }}>
                Select the areas of inner growth you are currently focusing on:
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {WELLNESS_INTENTIONS.map(intent => {
                  const isSelected = selectedInterests.includes(intent.id);
                  return (
                    <button
                      key={intent.id}
                      onClick={() => handleToggleTag(intent.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '100px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        border: `1px solid ${isSelected ? 'var(--primary-dark)' : 'var(--border-subtle)'}`,
                        boxShadow: isSelected ? '0 4px 12px rgba(64, 145, 108, 0.2)' : 'none'
                      }}
                    >
                      {intent.label} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Matched Circles Grid */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Your Recommended Sanctuary Circles
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                {circles.map(circle => {
                  const isActive = circle.id === activeCircleId;
                  return (
                    <div
                      key={circle.id}
                      onClick={() => setActiveCircleId(circle.id)}
                      className="glass-card"
                      style={{
                        padding: '24px',
                        cursor: 'pointer',
                        borderColor: isActive ? 'var(--primary)' : 'var(--border-subtle)',
                        background: isActive ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        boxShadow: isActive ? '0 8px 24px rgba(64, 145, 108, 0.15)' : 'var(--shadow-card)',
                        transform: isActive ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: circle.isRecommended ? 'var(--primary-dark)' : 'var(--text-muted)'
                        }}>
                          {circle.isRecommended ? '★ Top Intention Match' : 'Companion Circle'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {circle.membersCount} kindred souls
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {circle.title}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '14px' }}>
                        {circle.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {circle.tags.map(tagId => (
                            <span
                              key={tagId}
                              style={{
                                fontSize: '0.7rem',
                                background: 'rgba(82, 183, 136, 0.12)',
                                color: 'var(--primary-dark)',
                                padding: '3px 8px',
                                borderRadius: '100px'
                              }}
                            >
                              #{tagId}
                            </span>
                          ))}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {isActive ? 'Active Circle ●' : 'View Circle →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Selected Circle Discussion & Mutual Support */}
            {activeCircleId && (
              <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                      Active Sanctuary Circle
                    </span>
                    <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {circles.find(c => c.id === activeCircleId)?.title || 'Circle Encouragements'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span>Posting as:</span>
                    <input
                      type="text"
                      className="input-field"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      style={{ padding: '4px 10px', fontSize: '0.82rem', width: '130px' }}
                      title="Your anonymous nature alias"
                    />
                  </div>
                </div>

                {/* Send a gentle word */}
                <form onSubmit={handleSendPost} style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Share a gentle reflection or wholesome word of encouragement..."
                      value={newEncouragement}
                      onChange={(e) => setNewEncouragement(e.target.value)}
                      style={{ flex: 1 }}
                      maxLength={200}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
                      Share Seedling 🌱
                    </button>
                  </div>
                </form>

                {/* Posts Stream */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {posts.map(post => (
                    <div
                      key={post.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '14px',
                        boxShadow: 'var(--shadow-card)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                            {post.author}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            • {post.time}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                          "{post.text}"
                        </p>
                      </div>

                      <button
                        onClick={() => handleHeartPost(post.id)}
                        className="btn-ghost"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          fontSize: '0.82rem',
                          borderRadius: '100px'
                        }}
                      >
                        <span>💚</span>
                        <span>{post.hearts}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
