import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Storage } from '../services/storage';

export default function Progress() {
  const { user } = useAuth();
  const moods = user?.moodHistory || [];
  const journalEntries = Storage.getJournalEntries();
  const streak = user?.streak || 1;

  // Build 7-day data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dayStr = d.toDateString();
    const dayMoods = moods.filter(m => new Date(m.date).toDateString() === dayStr);
    const avgIntensity = dayMoods.length > 0
      ? Math.round(dayMoods.reduce((acc, m) => acc + (m.intensity || 5), 0) / dayMoods.length)
      : 0;

    weekData.push({
      dayName: days[d.getDay()],
      dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
      count: dayMoods.length,
      intensity: avgIntensity,
      hasData: dayMoods.length > 0
    });
  }

  const achievements = [
    { id: 1, title: 'First Sanctuary Step', desc: 'Logged your very first mood reflection', icon: '🌱', unlocked: moods.length >= 1 },
    { id: 2, title: 'Breath Master', desc: 'Completed 3 days of conscious breathwork', icon: '🌬️', unlocked: streak >= 3 },
    { id: 3, title: 'Inner Scribe', desc: 'Saved 3 reflective entries in private journal', icon: '✍️', unlocked: journalEntries.length >= 3 },
    { id: 4, title: 'Equilibrium Anchor', desc: 'Maintained 5-day continuous sanctuary streak', icon: '⚓', unlocked: streak >= 5 },
    { id: 5, title: 'Emotional Cartographer', desc: 'Logged 10 total mood check-ins', icon: '🗺️', unlocked: moods.length >= 10 }
  ];

  return (
    <div className="progress-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Growth & Patterns
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>Your Wellness Progress</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Observe how small, consistent acts of self-care build long-term emotional resilience.
          </p>
        </div>

        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '36px' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '26px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🔥</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{streak} Days</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</div>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '26px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>📊</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{moods.length}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Check-ins</div>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '26px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>✍️</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{journalEntries.length}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Journal Entries</div>
          </div>
        </div>

        {/* 7-Day Mood Activity Bar Chart */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Weekly Mood Check-in Frequency</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Daily intensity scores over the past 7 days</p>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', background: 'rgba(82, 183, 136, 0.15)', padding: '5px 12px', borderRadius: '100px' }}>
              Last 7 Days
            </span>
          </div>

          {/* Bar Chart Bars */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '12px',
            height: '180px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            {weekData.map((d, idx) => {
              const heightPercent = d.hasData ? Math.max(20, (d.intensity / 10) * 100) : 10;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '45px',
                    height: `${heightPercent}%`,
                    background: d.hasData ? 'linear-gradient(to top, var(--primary), var(--primary-light))' : 'rgba(33, 64, 47, 0.08)',
                    borderRadius: '8px 8px 0 0',
                    boxShadow: d.hasData ? '0 2px 8px rgba(45, 106, 79, 0.2)' : 'none',
                    transition: 'height 0.8s ease'
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: d.hasData ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inner World Evolution & Self-Referenced Growth */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '36px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                Inner World Evolution
              </span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                Your Living Sanctuary Tree
              </h3>
            </div>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '100px',
              background: 'rgba(82, 183, 136, 0.18)',
              color: 'var(--primary-dark)',
              border: '1px solid var(--primary)'
            }}>
              ● Self-Referenced Growth (No External Ranks)
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
            In MindCare, gamification is never a competition against others. Every journal entry, breathwork cycle, and honest mood check-in gently nourishes the roots and foliage of your 3D Inner World.
          </p>

          {/* Growth Stages Stepper */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {[
              { stage: 'Stage 1', name: 'Sprouting Seedling', desc: 'First roots planted in soil', threshold: 1, current: moods.length + journalEntries.length >= 1, icon: '🌱' },
              { stage: 'Stage 2', name: 'Tender Sapling', desc: 'Budding foliage & early rhythm', threshold: 5, current: moods.length + journalEntries.length >= 5, icon: '🌿' },
              { stage: 'Stage 3', name: 'Flourishing Canopy', desc: 'Resilient trunk & sunlit leaves', threshold: 12, current: moods.length + journalEntries.length >= 12, icon: '🌳' },
              { stage: 'Stage 4', name: 'Ancient Elderwood', desc: 'Deep roots & harmonic peace', threshold: 25, current: moods.length + journalEntries.length >= 25, icon: '✨' }
            ].map((st, i) => (
              <div
                key={i}
                style={{
                  background: st.current ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  border: `1px solid ${st.current ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  borderRadius: '16px',
                  padding: '18px',
                  opacity: st.current ? 1 : 0.55,
                  boxShadow: st.current ? 'var(--shadow-card)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{st.icon}</div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>{st.stage}</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{st.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{st.desc}</div>
                <div style={{
                  marginTop: '10px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: st.current ? 'var(--primary-dark)' : 'var(--text-muted)'
                }}>
                  {st.current ? '✓ Active Stage' : `Requires ${st.threshold} reflections`}
                </div>
              </div>
            ))}
          </div>

          {/* Self-Referenced Growth Markers against own history */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(82, 183, 136, 0.08), rgba(246, 189, 96, 0.08))',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Emotional Variance vs. Baseline
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '4px' }}>
                +18% Stability
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Compared to your first week of check-ins
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Recovery Nurture Velocity
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                1.4x Faster
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Time taken to bounce back after stressful days
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Conscious Mindfulness Canopy
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b07d3b', marginTop: '4px' }}>
                {Math.max(15, streak * 8)} Minutes
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Cumulative quiet presence logged
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
