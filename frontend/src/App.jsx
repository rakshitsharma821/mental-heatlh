import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import CompanionDrawer from './components/companion/CompanionDrawer';
import SanctuaryCursor from './components/common/SanctuaryCursor';

// Lazy-loaded page components for optimal code-splitting
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MoodTracker = lazy(() => import('./pages/MoodTracker'));
const Breathing = lazy(() => import('./pages/Breathing'));
const Journal = lazy(() => import('./pages/Journal'));
const Games = lazy(() => import('./pages/Games'));
const Routine = lazy(() => import('./pages/Routine'));
const Progress = lazy(() => import('./pages/Progress'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const CrisisSupport = lazy(() => import('./pages/CrisisSupport'));
const SettingsPrivacy = lazy(() => import('./pages/SettingsPrivacy'));
const TherapistDashboard = lazy(() => import('./pages/TherapistDashboard'));
const Community = lazy(() => import('./pages/Community'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Questionnaire = lazy(() => import('./pages/Questionnaire'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
import CookieConsentBanner from './components/common/CookieConsentBanner';

// Route SEO, Title and Meta Description Registry
const ROUTE_META = {
  '/': {
    title: 'MindCare Sanctuary | Gentle Mental Wellness & Healing',
    description: 'An unhurried digital sanctuary for youth and young adults to rest, reflect, track moods, and restore balance.'
  },
  '/login': {
    title: 'Sign In | MindCare Sanctuary',
    description: 'Sign in to your private MindCare sanctuary space. 100% confidential and Zero-PII protected.'
  },
  '/register': {
    title: 'Begin Sanctuary | MindCare',
    description: 'Create your private sanctuary space. Join as a member or apply to join our licensed clinician network.'
  },
  '/dashboard': {
    title: 'Your Sanctuary Dashboard | MindCare',
    description: 'Your daily sanctuary home — check in with your feelings, reflect, practice calming routines, and track growth.'
  },
  '/mood': {
    title: 'Mood Tracker & Emotional Weather | MindCare',
    description: 'Notice and track your feelings with mindful clarity and compassionate non-judgmental awareness.'
  },
  '/breathing': {
    title: 'Mindful Breathing Pacer | MindCare',
    description: 'Interactive calming 3D breathing pacer with Box, 4-7-8, and deep calm rhythms.'
  },
  '/journal': {
    title: 'Reflective Journal | MindCare',
    description: 'A quiet, encrypted space for thoughts, worries, and gratitude. Your words remain strictly your own.'
  },
  '/routine': {
    title: 'Daily Micro-Routines | MindCare',
    description: 'Build gentle, self-compassionate habits for morning clarity, mid-day rest, and peaceful sleep.'
  },
  '/progress': {
    title: 'Recovery & Growth Insights | MindCare',
    description: 'Observe your emotional recovery trends and mood resilience over time with real private data.'
  },
  '/roadmap': {
    title: 'Sanctuary Growth Roadmap | MindCare',
    description: 'Step-by-step milestones for emotional grounding, habit formation, and inner peace.'
  },
  '/games': {
    title: 'Mindful Calming Games | MindCare',
    description: 'Gentle, zero-pressure interactive mindful games: Zen garden drawing, bubble drift, pattern focus, and gratitude.'
  },
  '/community': {
    title: 'Anonymous Peer Sanctuary | MindCare',
    description: 'Safe, moderated, anonymous peer support community. Share encouragement without fear of judgment.'
  },
  '/crisis': {
    title: '24/7 Crisis Lifelines & Safety Plan | MindCare',
    description: 'Zero-barrier crisis support, national helplines (Tele-MANAS, KIRAN, 988), and interactive personal safety planner.'
  },
  '/settings': {
    title: 'Privacy & DPDP Security Settings | MindCare',
    description: 'Take full control of your personal data, reduce motion settings, manage export, and DPDP rights.'
  },
  '/therapist': {
    title: 'Clinician Workspace | MindCare Sanctuary',
    description: 'Licensed therapist clinical consultations, verified credentials vault, and client appointment pipeline.'
  },
  '/clinical': {
    title: 'Clinical Records & Consent Trail | MindCare',
    description: 'Strict client consent management, audit trails, and clinical session documentation.'
  },
  '/admin': {
    title: 'System Administration Console | MindCare',
    description: 'Administrative governance, therapist verification queue, and platform oversight.'
  },
  '/welcome': {
    title: 'Welcome to Sanctuary | MindCare',
    description: 'Your gentle orientation to the MindCare sanctuary experience.'
  },
  '/questionnaire': {
    title: 'Clinical Wellness Assessment | MindCare',
    description: 'Confidential clinical check-in based on PHQ-9 & GAD-7 to gently understand your current needs.'
  },
  '/recommendations': {
    title: 'Your Care Recommendations | MindCare',
    description: 'Tailored wellness tools, coping strategies, and clinical care matching for your current score band.'
  },
  '/privacy-policy': {
    title: 'Privacy Policy & DPDP Act Notice | MindCare',
    description: 'Our comprehensive data protection notice in compliance with India’s Digital Personal Data Protection Act 2023.'
  },
  '/privacy': {
    title: 'Privacy Policy & DPDP Act Notice | MindCare',
    description: 'Our comprehensive data protection notice in compliance with India’s Digital Personal Data Protection Act 2023.'
  },
  '/terms': {
    title: 'Terms & Conditions of Service | MindCare',
    description: 'Legal terms governing your use of MindCare self-care modules and tele-consultation facilitation.'
  },
  '/terms-and-conditions': {
    title: 'Terms & Conditions of Service | MindCare',
    description: 'Legal terms governing your use of MindCare self-care modules and tele-consultation facilitation.'
  },
  '/cookie-policy': {
    title: 'Cookie & Local Storage Policy | MindCare',
    description: 'Full disclosure of client-side local storage. Zero advertising tracking cookies and zero behavioral trackers.'
  },
  '/cookies': {
    title: 'Cookie & Local Storage Policy | MindCare',
    description: 'Full disclosure of client-side local storage. Zero advertising tracking cookies and zero behavioral trackers.'
  },
  '/refund-policy': {
    title: 'Refund & Cancellation Policy | MindCare',
    description: 'Fair consumer cancellation windows and refund timelines for clinical consultations.'
  },
  '/cancellation-refund-policy': {
    title: 'Refund & Cancellation Policy | MindCare',
    description: 'Fair consumer cancellation windows and refund timelines for clinical consultations.'
  }
};

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      color: 'var(--primary-dark, #2d6a4f)',
      fontSize: '0.95rem',
      fontWeight: 500,
      fontFamily: 'var(--font-sans)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(82, 183, 136, 0.2)',
          borderTopColor: 'var(--primary, #52b788)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px auto'
        }} />
        <span>Arriving gently...</span>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isQuestionnaire = location.pathname === '/questionnaire';
  const isTherapistPortal = location.pathname === '/therapist' || location.pathname === '/clinical';
  const isAdminPortal = location.pathname === '/admin';
  const hideNavbar = isQuestionnaire || isTherapistPortal || isAdminPortal;

  // Sync document title and meta description dynamically on every route transition
  useEffect(() => {
    const meta = ROUTE_META[location.pathname] || {
      title: 'Page Not Found | MindCare Sanctuary',
      description: 'The page you are looking for is not in the sanctuary. Find calm navigation back to safety and wellness.'
    };
    document.title = meta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', meta.description);
    }
  }, [location.pathname]);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!hideNavbar && <Navbar />}
      <main id="main-content" tabIndex="-1" style={{ flex: 1, outline: 'none' }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Entry */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Legal, DPDP Act & Compliance Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/terms-and-conditions" element={<TermsConditions />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/cancellation-refund-policy" element={<RefundPolicy />} />

            {/* Crisis & Safety — ALWAYS reachable independent of auth or AI */}
            <Route path="/crisis" element={<CrisisSupport />} />
            <Route path="/settings" element={<SettingsPrivacy />} />

            {/* Public-ish Wellness Activities */}
            <Route path="/breathing" element={<Breathing />} />
            <Route path="/games" element={<Games />} />
            <Route path="/community" element={<Community />} />

            {/* Special Administrative & Clinical Workspaces */}
            <Route
              path="/therapist"
              element={
                <ProtectedRoute allowedRoles={['therapist', 'clinician']}>
                  <TherapistDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clinical"
              element={
                <ProtectedRoute allowedRoles={['therapist', 'clinician']}>
                  <TherapistDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Guided Onboarding Flow */}
            <Route
              path="/welcome"
              element={
                <ProtectedRoute>
                  <Welcome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/questionnaire"
              element={
                <ProtectedRoute>
                  <Questionnaire />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              }
            />

            {/* Protected Sanctuary Modules */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mood"
              element={
                <ProtectedRoute>
                  <MoodTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <Journal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routine"
              element={
                <ProtectedRoute>
                  <Routine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap"
              element={
                <ProtectedRoute>
                  <Roadmap />
                </ProtectedRoute>
              }
            />

            {/* Custom 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!hideNavbar && <Footer />}
      {!hideNavbar && <CompanionDrawer />}
      <CookieConsentBanner />
      <SanctuaryCursor />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
