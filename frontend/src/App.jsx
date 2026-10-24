import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import CompanionDrawer from './components/companion/CompanionDrawer';
import SanctuaryCursor from './components/common/SanctuaryCursor';

// Lazy-loaded route pages for optimal code splitting
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

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!isQuestionnaire && <Navbar />}
      <main id="main-content" tabIndex="-1" style={{ flex: 1, outline: 'none' }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Entry */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Crisis & Safety — ALWAYS reachable independent of auth or AI */}
            <Route path="/crisis" element={<CrisisSupport />} />
            <Route path="/settings" element={<SettingsPrivacy />} />

            {/* Clinician Portal */}
            <Route path="/clinical" element={<TherapistDashboard />} />
            <Route path="/therapist" element={<TherapistDashboard />} />

            {/* Admin Governance Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Wellness modules */}
            <Route path="/breathing" element={<Breathing />} />
            <Route path="/games" element={<Games />} />
            <Route path="/community" element={<Community />} />

            {/* Task 2 Guided Flow */}
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!isQuestionnaire && <Footer />}
      {!isQuestionnaire && <CompanionDrawer />}
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
