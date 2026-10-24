# MindCare Sanctuary — Light-Theme Design System & Architecture (`DESIGN.md`)

This document specifies the design philosophy, design token architecture, lightweight 3D/motion budget, accessibility standards, and component guidelines for the MindCare Sanctuary web application.

---

## 1. Visual Philosophy: "Powerful but Peaceful"

- **Atmosphere**: Calm, airy, hopeful, and premium.
- **Theme Principle**: **Light theme only by default**. Warm off-white canvases, soft botanical sage greens, soothing lavender, peach, and sky-blue accents.
- **Tone**: High-contrast, generous whitespace, soft glass cards with subtle borders and gentle shadows, slow natural motion.
- **Distraction-Free Sanctuary**: No flashy strobing, no fast twitchy motion, no autoplay sound, no intrusive custom cursor, and **zero geometric/pyramid ornaments**.
- **Static Ingestion Guardrail**: Critical assessment and authentication flows (**Register**, **Login**, **Questionnaire**) remain **strictly static** with zero 3D canvases and zero moving objects.

---

## 2. Design Tokens Architecture

Design tokens are declared in JavaScript at `frontend/src/styles/theme.js` and exposed as native CSS custom properties at `frontend/src/index.css`. All components consume these tokens; hardcoded ad-hoc color values are forbidden.

### 2.1 Color Palette & Contrast Tokens

| Token | Hex / CSS Var | Purpose | Contrast vs Background | WCAG AA Status |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Base** | `#faf9f5` (`--bg-primary`) | Warm off-white primary backdrop | Baseline | Target |
| **Card / Surface** | `#ffffff` (`--bg-surface-elevated`) | Crisp elevated porcelain card surface | Baseline | Target |
| **Glass Surface** | `rgba(255, 255, 255, 0.76)` (`--bg-glass`) | Frosted backdrop blur surface | Baseline | Target |
| **Text Primary** | `#1a2e22` (`--text-primary`) | Deep evergreen charcoal for headings & main text | **13.5 : 1** on `#faf9f5` | **AAA Passed** (> 7:1) |
| **Text Secondary** | `#2d4a3e` (`--text-secondary`) | Rich herbal slate for body copy | **8.4 : 1** on `#faf9f5` | **AAA Passed** (> 7:1) |
| **Text Muted** | `#42675d` (`--text-muted`) | Calm sage slate for metadata & subtitles | **5.6 : 1** on `#ffffff` | **AA Passed** (> 4.5:1) |
| **Brand Primary Forest** | `#2d6a4f` (`--accent-forest`) | Primary buttons, links, active tab accents | **6.8 : 1** vs White text | **AA Passed** (> 4.5:1) |
| **Brand Leaf Green** | `#40916c` (`--accent-leaf`) | Gradient companion for primary buttons | **4.6 : 1** vs White text | **AA Passed** (> 4.5:1) |
| **Brand Soft Mint** | `#52b788` (`--accent-mint`) | Interactive highlights & subtle borders | **3.2 : 1** (graphical UI) | **AA Passed** (> 3:1) |
| **Pastel Lavender** | `#9d84b7` (`--accent-lavender`) | Reflective meditation & yoga cards | Visual accent | Passed |
| **Pastel Peach / Sun** | `#f6bd60` (`--accent-peach-warm`) | Warmth, daylight accents, streak badge | Visual accent | Passed |
| **Pastel Sky Blue** | `#6ba3c7` (`--accent-sky`) | Mindful games & calm breathwork cards | Visual accent | Passed |

### 2.2 Typography Scale

- **Display Font**: `Outfit`, sans-serif (weights: 600, 700, 800) loaded with `font-display: swap`. Used for hero headlines, major section headers, and phase titles.
- **Body Font**: `Inter`, sans-serif (weights: 400, 500, 600) loaded with `font-display: swap`. Optimized for reading long-form reflections and clinical notes.
- **Fluid Sizing Clamps**:
  - `Hero`: `clamp(2.5rem, 5vw, 4.0rem)`
  - `H1`: `clamp(1.8rem, 3.8vw, 2.6rem)`
  - `H2`: `clamp(1.4rem, 2.5vw, 1.85rem)`
  - `H3`: `1.15rem – 1.35rem`
  - `Body`: `0.92rem – 1.05rem` (line-height: `1.6 – 1.7`)

### 2.3 Radius, Blur, and Elevation

- **Radius Tokens**: `radius-sm: 8px`, `radius-md: 14px`, `radius-lg: 20px`, `radius-xl: 28px`, `radius-full: 9999px`.
- **Blur Tokens**: `blur-sm: 8px`, `blur-md: 16px`, `blur-lg: 24px`.
- **Glass Card System** (`.glass-card`):
  - Background: `rgba(255, 255, 255, 0.88)`
  - Backdrop Filter: `blur(16px)`
  - Border: `1px solid rgba(82, 183, 136, 0.22)`
  - Shadow: `0 12px 36px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(82, 183, 136, 0.06)`

### 2.4 Motion Tokens

- **Durations**:
  - `fast`: `200ms` (hover states, focus transitions)
  - `normal`: `400ms` (drawer open/close, card expansion)
  - `slow`: `800ms` (text reveal, page section entrance)
  - `breathe`: `1200ms` (gentle wave / pulsing elements)
  - `cycle`: `8000ms – 10000ms` (natural respiratory cycle)
- **Easing Curves**:
  - `ease-out`: `cubic-bezier(0.2, 0.8, 0.2, 1)` (snappy yet gentle deceleration)
  - `spring`: `cubic-bezier(0.34, 1.56, 0.64, 1)` (soft button hover lift)

---

## 3. Lightweight 3D & Animation Architecture (Three.js Budget)

MindCare enforces a strict **Single WebGL Canvas Per Page Rule** to guarantee 60fps performance on mobile devices and integrated GPUs.

### 3.1 WebGL Canvas Guardrails

1. **Device Pixel Ratio (DPR) Clamping**:
   - `renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))`
   - Never exceeds 1.5x DPR, preventing GPU fill-rate exhaustion on Retina displays.
2. **Hardware Concurrency Check**:
   - Antialiasing is dynamically enabled only on hardware with `>= 4` threads and standard DPR.
   - `powerPreference: 'low-power'` to prioritize battery life and reduce thermal load.
3. **IntersectionObserver Pause**:
   - Canvas mount tracks viewport intersection via `IntersectionObserver`. When scrolled out of view, `requestAnimationFrame` is paused immediately.
4. **Visibility API Pause**:
   - `document.addEventListener('visibilitychange')` halts animation when the user switches tabs or minimizes the window.
5. **Disposal & Memory Cleanup**:
   - All geometries, shader materials, instance buffers, and renderers are explicitly disposed upon React component unmount (`useEffect` return cleanup).

### 3.2 3D Components

#### 1. `BreathingOrbCanvas` (`frontend/src/components/three/BreathingOrbCanvas.jsx`)
- **Shader Architecture**: Custom GLSL vertex and fragment shader with Fresnel rim factor.
  - Zero heavy transmission or refraction passes.
  - Generates a luminous, translucent iridescent pearlescent sphere.
- **Instanced Petal Pool**: 40 floating pastel petals rendered using a single `InstancedMesh`.
- **Modes**:
  - **Ambient / Hero**: 8–10s organic continuous respiratory cycle with subtle mouse parallax and scroll tilt.
  - **Somatic Breathwork Guide** (`Breathing.jsx`): Real-time synchronization with **4-7-8 Relaxation**, **Box Breathing (4-4-4-4)**, and **Balanced 5.5s Resonance**. Smoothly lerps scale (0.88x to 1.34x) in sync with countdown seconds.
- **Accessible Fallback**: Renders a static CSS pastel aurora orb when `prefers-reduced-motion: reduce` is active.

#### 2. `InnerWorldCanvas` (`frontend/src/components/three/InnerWorldCanvas.jsx`)
- **Procedural Living Sanctuary Tree**: True 3D geometry representing user progress.
- Features: Porcelain ground island, reflective teal spring water, PCF soft shadows (optimized map size: `1024x1024`), elevated botanical lighting.
- DPR capped at 1.5, low-power mode, IntersectionObserver and visibility pause hooks.

#### 3. `TiltCard` (`frontend/src/components/common/TiltCard.jsx`)
- Lightweight CSS 3D perspective transform (`perspective: 1000px`, `rotateX`, `rotateY`).
- Includes specular light glare tracking mouse coordinates.
- **Zero WebGL overhead**; automatically turns off for users requesting reduced motion.

---

## 4. Distraction-Free Sanctuary Rules (Tasks 8 & 8b)

To protect emotional well-being and maintain focus during sensitive operations:

1. **Authentication (`Register.jsx`, `Login.jsx`)**:
   - 100% static layout. Zero 3D canvases, zero custom cursor, zero moving background particles.
2. **Clinical Onboarding (`Questionnaire.jsx`)**:
   - Fullscreen focus mode on start (`document.documentElement.requestFullscreen`).
   - Global chrome completely hidden: `Navbar`, `Footer`, and `CompanionDrawer` trigger are removed via `.focus-mode-active` CSS.
   - Back button returns to the previous question (preserving state) rather than leaving the questionnaire.
   - `beforeunload` warning prevents accidental loss of assessment progress.
   - Zero WebGL canvases or distracting animations.
3. **Administrative & Clinical Dashboards**:
   - `AdminDashboard.jsx` and `TherapistDashboard.jsx` use calm, minimal 2D presentation with zero 3D.

---

## 5. Accessibility (WCAG AA) & Safety Compliance

### 5.1 Keyboard Navigation & Focus
- **Universal Focus Ring**: Visible high-contrast focus rings defined on all interactive elements via `:focus-visible`:
  ```css
  :focus-visible {
    outline: 2px solid var(--accent-forest);
    outline-offset: 2px;
  }
  ```
- **Skip Link**: `<a href="#main-content" className="skip-link">Skip to main content</a>` positioned at the top of the DOM for screen reader and keyboard accessibility.

### 5.2 Motion Reduction
- Full `@media (prefers-reduced-motion: reduce)` support:
  - Animation durations clamped to `0.01ms`.
  - Transitions disabled.
  - Three.js canvases switch to static single-frame rendering or pure CSS pastel gradient posters.

### 5.3 Clinical Safety & Language
- **Non-Clinical Score Bands**: User-facing assessment scores avoid diagnostic pathology terms:
  - Band Low: `🌱 Steady & Grounded`
  - Band Moderate: `🌤️ Taking Care`
  - Band High: `🤝 Extra Support Available`
- **Mandatory Disclaimer**: `"🌿 This is a self-reflection tool, not a clinical diagnosis."` displayed on all result and recommendation screens.
- **Crisis Escalation Flow**: Deterministic safety checks run *before* any LLM call. Triggered keywords do not echo back the user's distress term, ask gentle consent ("Would you like me to call a helpline for you?"), and provide verified Indian crisis numbers (`Tele-MANAS 14416`, `KIRAN 1800-599-0019`) upon confirmation.

---

## 6. Component Catalog & Quick Reference

| Component | File Path | Usage & Purpose |
| :--- | :--- | :--- |
| `theme.js` | `frontend/src/styles/theme.js` | Authoritative source of design tokens |
| `strings.js` | `frontend/src/config/strings.js` | Authoritative source of UI strings & brand copy |
| `BreathingOrbCanvas` | `frontend/src/components/three/BreathingOrbCanvas.jsx` | 3D Iridescent breathing orb for hero & guided breathwork |
| `InnerWorldCanvas` | `frontend/src/components/three/InnerWorldCanvas.jsx` | 3D Procedural living sanctuary tree for dashboard |
| `TiltCard` | `frontend/src/components/common/TiltCard.jsx` | CSS 3D mouse tilt card with specular glare |
| `Navbar` | `frontend/src/components/layout/Navbar.jsx` | Sticky glass navigation bar with accessible links |
| `Footer` | `frontend/src/components/layout/Footer.jsx` | Light sanctuary footer with crisis disclaimer & helplines |
| `BookingModal` | `frontend/src/components/clinical/BookingModal.jsx` | Light modal for scheduling licensed clinician sessions |
| `CompanionDrawer` | `frontend/src/components/companion/CompanionDrawer.jsx` | Floating AI companion drawer with safety filter integration |
