// ============================================
// MindCare — Community Sanctuary & Peer Circles (Part 6)
// Opt-in, anonymous, matched strictly on shared intentions.
// Zero comparison, zero leaderboards, zero clinical or mood data leakage.
// ============================================

import React, { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { WELLNESS_INTENTIONS } from '../services/communityService';
import AmbientCanvas from '../components/three/AmbientCanvas';
import { useAuth } from '../context/AuthContext';

export default function Community() {
  const { user } = useAuth();

  // Profile & Preferences
  const [profile, setProfile] = useState(null);
  const [optedIn, setOptedIn] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(['breath', 'quiet']);
  const [alias, setAlias] = useState('');
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [newAliasInput, setNewAliasInput] = useState('');

  // Circles & Posts
  const [circles, setCircles] = useState([]);
  const [activeCircleId, setActiveCircleId] = useState('circle_breath_quiet');
  const [posts, setPosts] = useState([]);
  const [newEncouragement, setNewEncouragement] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Safety & Crisis Warning
  const [crisisNudge, setCrisisNudge] = useState(null);
  const [reportModalPost, setReportModalPost] = useState(null);
  const [reportReason, setReportReason] = useState('Offensive or unsupportive language');
  const [reportNotice, setReportNotice] = useState('');

  // Peer Match
  const [peerMatch, setPeerMatch] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [peerNotice, setPeerNotice] = useState('');

  // Initial load: Profile, Circles, Peer Match Status
  const loadCommunityData = async () => {
    try {
      // 1. Load community profile
      const profRes = await Api.getCommunityProfile();
      if (profRes.success && profRes.profile) {
        setProfile(profRes.profile);
        setOptedIn(Boolean(profRes.profile.opt_in_community));
        setAlias(profRes.profile.anonymous_alias);
        setNewAliasInput(profRes.profile.anonymous_alias);
        if (Array.isArray(profRes.profile.intention_tags)) {
          setSelectedInterests(profRes.profile.intention_tags);
        }
      }

      // 2. Load circles
      const circRes = await Api.getCommunityCircles();
      if (circRes.success && circRes.circles) {
        setCircles(circRes.circles);
        if (circRes.circles.length > 0 && !activeCircleId) {
          setActiveCircleId(circRes.circles[0].id);
        }
      }

      // 3. Load peer match
      const pmRes = await Api.getPeerMatchStatus();
      if (pmRes.success && pmRes.hasMatch) {
        setPeerMatch(pmRes.match);
      }
    } catch (e) {
      console.warn('Error loading community data:', e);
    }
  };

  const loadPosts = async (circleId) => {
    if (!circleId) return;
    try {
      const res = await Api.getCommunityPosts(circleId);
      if (res.success && res.posts) {
        setPosts(res.posts);
      }
    } catch (e) {
      console.warn('Error fetching posts:', e);
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, []);

  useEffect(() => {
    if (activeCircleId) {
      loadPosts(activeCircleId);
    }
  }, [activeCircleId]);

  const handleToggleOptIn = async () => {
    const nextOptIn = !optedIn;
    setOptedIn(nextOptIn);
    try {
      await Api.updateCommunityProfile({
        opt_in_community: nextOptIn,
        anonymous_alias: alias,
        intention_tags: selectedInterests
      });
      loadCommunityData();
    } catch (e) {
      // Revert if error
      setOptedIn(!nextOptIn);
    }
  };

  const handleToggleTag = async (tagId) => {
    const updated = selectedInterests.includes(tagId)
      ? selectedInterests.filter(id => id !== tagId)
      : [...selectedInterests, tagId];

    setSelectedInterests(updated);
    try {
      await Api.updateCommunityProfile({
        opt_in_community: optedIn,
        anonymous_alias: alias,
        intention_tags: updated
      });
    } catch (e) {
      // Ignore
    }
  };

  const handleSaveAlias = async () => {
    if (!newAliasInput.trim() || newAliasInput.trim().length < 3) return;
    try {
      const res = await Api.updateCommunityProfile({
        opt_in_community: optedIn,
        anonymous_alias: newAliasInput.trim(),
        intention_tags: selectedInterests
      });
      if (res.success) {
        setAlias(res.profile.anonymous_alias);
        setIsEditingAlias(false);
      } else {
        alert(res.message || 'Alias update failed.');
      }
    } catch (e) {
      alert('Failed to update alias.');
    }
  };

  const handleSendPost = async (e) => {
    e.preventDefault();
    if (!newEncouragement.trim()) return;

    setIsPosting(true);
    setCrisisNudge(null);

    try {
      const res = await Api.createCommunityPost(activeCircleId, newEncouragement.trim());
      if (res.success) {
        setNewEncouragement('');
        loadPosts(activeCircleId);
      } else if (res.crisisDetected) {
        setCrisisNudge({
          message: res.message,
          helplines: res.helplines || []
        });
      } else {
        alert(res.message || 'Could not post encouragement.');
      }
    } catch (e) {
      alert('Server unreachable. Please check your connection.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleHeartPost = async (postId) => {
    try {
      const res = await Api.heartCommunityPost(postId);
      if (res.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, hearts: res.hearts, hasHearted: res.hearted };
          }
          return p;
        }));
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleReportPost = async () => {
    if (!reportModalPost) return;
    try {
      const res = await Api.reportCommunityPost(reportModalPost.id, reportReason);
      if (res.success) {
        setReportNotice('Thank you. This post has been submitted for moderation.');
        setTimeout(() => {
          setReportNotice('');
          setReportModalPost(null);
        }, 2200);
      }
    } catch (e) {
      alert('Unable to submit report.');
    }
  };

  // Peer Match Handlers
  const handleRequestPeer = async () => {
    setIsMatching(true);
    setPeerNotice('');
    try {
      const res = await Api.requestPeerMatch();
      if (res.success) {
        if (res.matched) {
          setPeerMatch(res.peer);
          setPeerNotice('Kindred traveler paired! You can share encouragement below.');
        } else {
          setPeerNotice(res.message);
        }
      } else {
        setPeerNotice(res.message || 'Unable to request peer match.');
      }
    } catch (e) {
      setPeerNotice('Server unreachable.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleLeavePeer = async () => {
    if (!window.confirm('Are you sure you wish to peacefully conclude this peer connection?')) return;
    try {
      const res = await Api.leavePeerMatch();
      if (res.success) {
        setPeerMatch(null);
        setPeerNotice('Connection peacefully concluded.');
        setTimeout(() => setPeerNotice(''), 3000);
      }
    } catch (e) {
      // Ignore
    }
  };

  return (
    <div className="community-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <AmbientCanvas count={24} speed={0.2} />

      <div style={{ maxWidth: '980px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Sanctuary Community
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Peer Circles & Gentle Stillness
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', margin: '0 auto' }}>
            A calm, unhurried space for wholesome encouragement. Strictly zero leaderboards, no follower counts, and zero personal data leakage.
          </p>
        </div>

        {/* Zero-Leakage Privacy Assurance Banner */}
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
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(82, 183, 136, 0.15)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                Zero Clinical & Identity Leakage Guarantee
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Peer circles operate exclusively via your anonymous nature alias. Your real name, email, mood forecasts, and clinical records are never visible to peers.
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleOptIn}
            className={optedIn ? 'btn-ghost' : 'btn-primary'}
            style={{ fontSize: '0.82rem', padding: '8px 18px', whiteSpace: 'nowrap' }}
          >
            {optedIn ? 'Leave Community (Opt Out)' : 'Join Peer Circles (Opt In) →'}
          </button>
        </div>

        {!optedIn ? (
          /* Opt-In Gate State */
          <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '48px 36px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}></div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Connect with Mindful Companions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
              MindCare Peer Circles are completely voluntary and gentle. When you opt in, you choose wholesome intentions you'd like to cultivate (such as breathwork or restful sleep rhythms).
            </p>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 28px', fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li> <strong>100% Anonymous:</strong> You are represented solely by a calming nature alias.</li>
              <li> <strong>No Comparison:</strong> No scores, streaks, or ranks.</li>
              <li> <strong>Content Guardrails:</strong> Every reflection is filtered for safe, compassionate language.</li>
            </ul>
            <button onClick={handleToggleOptIn} className="btn-primary" style={{ padding: '12px 32px', fontSize: '0.95rem' }}>
              I Understand — Opt In to Sanctuary Circles 
            </button>
          </div>
        ) : (
          /* Active Community Experience */
          <div>
            {/* Step 1: Anonymous Alias & Intentions */}
            <div className="glass-card" style={{ padding: '28px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
                    Your Sanctuary Identity & Intentions
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Circles and kindred companions match strictly on these focus areas.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Posting As:</span>
                  {isEditingAlias ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="input-field"
                        style={{ padding: '4px 10px', fontSize: '0.82rem', width: '140px' }}
                        value={newAliasInput}
                        onChange={(e) => setNewAliasInput(e.target.value)}
                        maxLength={30}
                      />
                      <button onClick={handleSaveAlias} className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Save
                      </button>
                      <button onClick={() => setIsEditingAlias(false)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.92rem' }}>
                        {alias || 'Gentle Traveler'}
                      </span>
                      <button onClick={() => setIsEditingAlias(true)} className="btn-ghost" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                         Change
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tag selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
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
                      {intent.label} {isSelected && ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Kindred Peer Connection Card */}
            <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '28px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', fontWeight: 700 }}>
                    Kindred Peer Connection
                  </span>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                    {peerMatch ? `Connected with ${peerMatch.peerAlias || peerMatch.alias}` : 'Find a 1-on-1 Kindred Traveler'}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    {peerMatch
                      ? `Sharing focus on #${peerMatch.sharedIntention || peerMatch.matchedFocus} • 100% Anonymous mutual encouragement`
                      : 'Pair with another opted-in member sharing your wellness intentions.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {peerMatch ? (
                    <button
                      onClick={handleLeavePeer}
                      className="btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', color: '#b91c1c' }}
                    >
                      Peacefully Unpair 
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestPeer}
                      disabled={isMatching}
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                    >
                      {isMatching ? 'Finding Kindred Soul...' : ' Request Peer Match'}
                    </button>
                  )}
                </div>
              </div>

              {peerNotice && (
                <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                  ℹ {peerNotice}
                </div>
              )}
            </div>

            {/* Step 3: Circles Selector Grid */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '14px' }}>
                Thematic Sanctuary Circles
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {circles.map(circle => {
                  const isActive = circle.id === activeCircleId;
                  return (
                    <div
                      key={circle.id}
                      onClick={() => setActiveCircleId(circle.id)}
                      className="glass-card"
                      style={{
                        padding: '22px',
                        cursor: 'pointer',
                        borderColor: isActive ? 'var(--primary)' : 'var(--border-subtle)',
                        background: isActive ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        boxShadow: isActive ? '0 8px 24px rgba(64, 145, 108, 0.15)' : 'var(--shadow-card)',
                        transform: isActive ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-dark)' }}>
                          Companion Circle
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {circle.postCount || 0} reflections
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {circle.title}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                        {circle.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Active Circle Discussion & Reflections */}
            {activeCircleId && (
              <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                      Active Sanctuary Circle
                    </span>
                    <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {circles.find(c => c.id === activeCircleId)?.title || 'Circle Reflections'}
                    </h3>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Posting anonymously as <strong>{alias || 'Gentle Traveler'}</strong>
                  </span>
                </div>

                {/* Crisis Guidance Alert if Triggered */}
                {crisisNudge && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    color: '#b91c1c'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>
                       We are here for you
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '12px' }}>
                      {crisisNudge.message}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {crisisNudge.helplines?.map((h, i) => (
                        <a
                          key={i}
                          href={`tel:${h.number}`}
                          style={{
                            background: '#ffffff',
                            color: '#b91c1c',
                            padding: '6px 14px',
                            borderRadius: '100px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                           {h.name}: {h.number}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Input Form */}
                <form onSubmit={handleSendPost} style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Share a gentle reflection or wholesome word of encouragement..."
                      value={newEncouragement}
                      onChange={(e) => setNewEncouragement(e.target.value)}
                      style={{ flex: 1 }}
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={isPosting}
                      className="btn-primary"
                      style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
                    >
                      {isPosting ? 'Sharing...' : 'Share Seedling '}
                    </button>
                  </div>
                </form>

                {/* Posts Stream */}
                {posts.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px', fontSize: '0.88rem' }}>
                    No reflections in this circle yet. Be the first to plant a gentle word! 
                  </p>
                ) : (
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
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                              {post.author}
                            </span>
                            {post.isFacilitator && (
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: 'rgba(82, 183, 136, 0.2)',
                                color: 'var(--primary-dark)',
                                padding: '2px 8px',
                                borderRadius: '100px'
                              }}>
                                 Clinical Facilitator
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              • {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                            "{post.text}"
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleHeartPost(post.id)}
                            className="btn-ghost"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              fontSize: '0.82rem',
                              borderRadius: '100px',
                              background: post.hasHearted ? 'rgba(82, 183, 136, 0.18)' : 'transparent',
                              borderColor: post.hasHearted ? 'var(--primary)' : 'var(--border-subtle)'
                            }}
                          >
                            <span></span>
                            <span>{post.hearts}</span>
                          </button>

                          <button
                            onClick={() => setReportModalPost(post)}
                            className="icon-btn-ghost"
                            style={{ fontSize: '0.75rem', opacity: 0.6 }}
                            title="Report reflection"
                          >
                            
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportModalPost && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 300
        }}>
          <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '28px', backgroundColor: '#fff', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Report Reflection
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Our moderation team reviews reported content to maintain a safe and compassionate sanctuary.
            </p>

            {reportNotice ? (
              <div style={{ color: 'var(--primary-dark)', fontWeight: 600, fontSize: '0.88rem', padding: '12px 0' }}>
                 {reportNotice}
              </div>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">Reason for Report</label>
                  <select
                    className="input-field"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  >
                    <option value="Offensive or unsupportive language">Offensive or unsupportive language</option>
                    <option value="Triggering or graphic self-harm details">Triggering or graphic self-harm details</option>
                    <option value="Personal data or contact details shared">Personal data or contact details shared</option>
                    <option value="Spam or promotional message">Spam or promotional message</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={handleReportPost}
                    className="btn-primary"
                    style={{ flex: 1, backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                  >
                    Submit Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportModalPost(null)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
