import React, { useState, useEffect } from 'react';
import { Storage } from '../services/storage';
import GeometricShapesCanvas from '../components/three/GeometricShapesCanvas';

const DEFAULT_ROUTINES = [
  { id: 1, category: 'Morning', title: 'Gentle hydration & window sunlight', desc: '1 glass of water + 2 mins daylight', completed: false, icon: '☀️' },
  { id: 2, category: 'Morning', title: '3-minute morning breathwork', desc: 'Soothes cortisol awakening spike', completed: false, icon: '🌬️' },
  { id: 3, category: 'Day', title: 'Midday screen break & posture reset', desc: 'Step away and unclench shoulders', completed: false, icon: '🚶' },
  { id: 4, category: 'Day', title: 'Emotional check-in pulse', desc: 'Log current feeling in Mood Tracker', completed: false, icon: '📊' },
  { id: 5, category: 'Evening', title: 'Unfiltered reflection journal', desc: 'Empty racing thoughts before sleep', completed: false, icon: '✍️' },
  { id: 6, category: 'Evening', title: 'Dim lights & digital sunset', desc: 'Turn off harsh blue light 30m prior to rest', completed: false, icon: '🌙' }
];

export default function Routine() {
  const [routines, setRoutines] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Morning');
  const [selectedCat, setSelectedCat] = useState('All');

  useEffect(() => {
    const saved = Storage.getRoutines();
    if (saved && saved.length > 0) {
      setRoutines(saved);
    } else {
      setRoutines(DEFAULT_ROUTINES);
      Storage.saveRoutines(DEFAULT_ROUTINES);
    }
  }, []);

  const toggleTask = (id) => {
    const updated = routines.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    setRoutines(updated);
    Storage.saveRoutines(updated);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      category: newCategory,
      title: newTitle.trim(),
      desc: 'Personal wellness intention',
      completed: false,
      icon: newCategory === 'Morning' ? '☀️' : newCategory === 'Day' ? '🌱' : '🌙'
    };

    const updated = [...routines, newTask];
    setRoutines(updated);
    Storage.saveRoutines(updated);
    setNewTitle('');
  };

  const filtered = selectedCat === 'All' ? routines : routines.filter(r => r.category === selectedCat);
  const completedCount = routines.filter(r => r.completed).length;
  const progressPercent = routines.length > 0 ? Math.round((completedCount / routines.length) * 100) : 0;

  return (
    <div className="routine-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <GeometricShapesCanvas />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Daily Rhythms
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>Restorative Daily Routine</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Uncomplicated micro-habits designed to steady your nervous system day by day.
          </p>
        </div>

        {/* Progress summary banner */}
        <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Today's Restorative Balance</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{progressPercent}% Complete</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(33, 64, 47, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
              borderRadius: '10px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {completedCount} of {routines.length} habits completed today
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['All', 'Morning', 'Day', 'Evening'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              style={{
                background: selectedCat === cat ? 'rgba(82, 183, 136, 0.2)' : 'var(--bg-surface)',
                border: `1px solid ${selectedCat === cat ? 'var(--primary)' : 'var(--border-subtle)'}`,
                color: selectedCat === cat ? 'var(--primary-dark)' : 'var(--text-secondary)',
                padding: '8px 18px',
                borderRadius: '100px',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Routine items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => toggleTask(item.id)}
              className="glass-card"
              style={{
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                cursor: 'pointer',
                background: item.completed ? 'rgba(82, 183, 136, 0.1)' : 'var(--bg-surface-elevated)',
                borderColor: item.completed ? 'rgba(82, 183, 136, 0.35)' : 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                border: `2px solid ${item.completed ? 'var(--primary)' : 'var(--border-hover)'}`,
                background: item.completed ? 'var(--primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                {item.completed && '✓'}
              </div>

              <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{item.icon}</span>

              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '1.05rem',
                  marginBottom: '2px',
                  textDecoration: item.completed ? 'line-through' : 'none',
                  color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>

              <span style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--primary-dark)',
                background: 'rgba(82, 183, 136, 0.15)',
                padding: '4px 10px',
                borderRadius: '100px'
              }}>
                {item.category}
              </span>
            </div>
          ))}
        </div>

        {/* Add new habit */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Add a Personal Intention</h4>
          <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 5-minute herbal tea pause without phone"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ flex: 1, minWidth: '220px' }}
              required
            />
            <select
              className="input-field"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ width: '130px' }}
            >
              <option value="Morning">Morning</option>
              <option value="Day">Day</option>
              <option value="Evening">Evening</option>
            </select>
            <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>
              Add Habit +
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
