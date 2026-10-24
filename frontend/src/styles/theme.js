// ============================================
// MindCare Sanctuary — Design System Tokens
// Light-Theme, Lightweight, Botanical & Soft Pastel Palette
// WCAG AA compliant contrast (> 4.5:1 text, > 3:1 graphical elements)
// Single Source of Truth for Colors, Spacing, Radius, Elevation, Typography, and Motion
// ============================================

export const theme = {
  // Light palette
  colors: {
    // Canvas & Surfaces (Warm off-white base, no dark mode by default)
    bgPrimary: '#faf9f5',
    bgSurface: '#f3f6f1',
    bgSurfaceElevated: '#ffffff',
    bgGlass: 'rgba(255, 255, 255, 0.76)',
    bgGlassStrong: 'rgba(255, 255, 255, 0.92)',
    bgGlassCard: 'rgba(255, 255, 255, 0.88)',
    bgInput: '#ffffff',

    // Text & Contrast (WCAG AA Compliant on #faf9f5 / #ffffff)
    textPrimary: '#1a2e22',      // Deep forest charcoal (~12.8:1 contrast)
    textSecondary: '#2d4a3e',    // Rich herbal slate (~8.2:1 contrast)
    textMuted: '#42675d',        // Calm sage slate (5.99:1 contrast on canvas, 6.31:1 on white)
    textSubtle: '#52796f',       // Supporting labels (4.8:1 contrast)
    textInverse: '#ffffff',

    // Nature & Pastels: Soft Sage Green (Primary brand)
    sage: '#357255',
    sageDark: '#245741',
    sageDeep: '#1b4332',
    sageLight: '#74c69d',
    sageSoft: '#eaf4ee',
    sageGlow: 'rgba(82, 183, 136, 0.26)',

    // Lavender (Serenity & Mindfulness)
    lavender: '#9d84b7',
    lavenderDark: '#6b5286',
    lavenderLight: '#c2b0d6',
    lavenderSoft: '#f3eef8',
    lavenderGlow: 'rgba(157, 132, 183, 0.22)',

    // Peach & Amber (Warmth & Energy)
    peach: '#e99a80',
    peachDark: '#c26d52',
    peachWarm: '#f6bd60',
    peachSoft: '#fcf1ed',
    peachGlow: 'rgba(233, 154, 128, 0.22)',

    // Sky Blue (Clarity & Breath)
    sky: '#6ba3c7',
    skyDark: '#3e7699',
    skyLight: '#99c6e2',
    skySoft: '#edf5fa',
    skyGlow: 'rgba(107, 163, 199, 0.22)',

    // Soft Feedback Variants (Gentle, non-aggressive tones)
    successSoft: '#e8f5e9',
    successText: '#1b5e20',
    successBorder: 'rgba(46, 125, 50, 0.25)',

    warnSoft: '#fff8e1',
    warnText: '#8d6304',
    warnBorder: 'rgba(245, 158, 11, 0.28)',

    errorSoft: '#fdebee',
    errorText: '#b71c1c',
    errorBorder: 'rgba(239, 68, 68, 0.28)',

    infoSoft: '#e1f5fe',
    infoText: '#0277bd',
    infoBorder: 'rgba(2, 119, 189, 0.25)',

    // Subtle Borders
    borderSubtle: 'rgba(45, 106, 79, 0.10)',
    borderHover: 'rgba(45, 106, 79, 0.22)',
    borderActive: 'rgba(82, 183, 136, 0.42)',
    borderLight: 'rgba(255, 255, 255, 0.65)'
  },

  // Corner Radii
  radius: {
    none: '0',
    xs: '6px',
    sm: '10px',
    md: '16px',
    lg: '22px',
    xl: '30px',
    full: '9999px'
  },

  // Soft Elevation Shadows (Light theme: diffuse, airy, zero muddy pitch-black)
  shadows: {
    none: 'none',
    sm: '0 2px 8px rgba(33, 64, 47, 0.04)',
    md: '0 8px 24px rgba(33, 64, 47, 0.06), 0 2px 6px rgba(33, 64, 47, 0.02)',
    lg: '0 16px 42px rgba(33, 64, 47, 0.08), 0 4px 12px rgba(33, 64, 47, 0.03)',
    xl: '0 24px 60px rgba(33, 64, 47, 0.10), 0 6px 18px rgba(33, 64, 47, 0.04)',
    glowSage: '0 0 32px rgba(82, 183, 136, 0.24)',
    glowLavender: '0 0 32px rgba(157, 132, 183, 0.22)',
    glowPeach: '0 0 32px rgba(233, 154, 128, 0.22)',
    innerSoft: 'inset 0 1px 2px rgba(33, 64, 47, 0.05)'
  },

  // Backdrop Blurs
  blur: {
    none: '0',
    sm: '6px',
    md: '14px',
    lg: '22px',
    xl: '34px'
  },

  // Spacing Scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px'
  },

  // Typography
  typography: {
    fonts: {
      display: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem'     // 48px
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7
    }
  },

  // Motion & Animation Tokens (Durations 400-1200ms, easing curves, stagger)
  motion: {
    durations: {
      fast: '250ms',
      normal: '400ms',
      slow: '700ms',
      gentle: '1000ms',
      breathing: '8000ms',
      brainBreathCycle: '9000ms',
      brainBreathSeconds: 9.0
    },
    easings: {
      easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      gentleSpring: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
      calmBreath: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    stagger: {
      fast: 60,
      normal: 120,
      slow: 200
    }
  }
};

export default theme;
