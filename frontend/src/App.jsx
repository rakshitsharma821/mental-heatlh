import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import CompanionDrawer from './components/companion/CompanionDrawer';
import SanctuaryCursor from './components/common/SanctuaryCursor';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MoodTracker from './pages/MoodTracker';
import Breathing from './pages/Breathing';
import Journal from './pages/Journal';
import Games from './pages/Games';
import Routine from './pages/Routine';
import Progress from './pages/Progress';
import Roadmap from './pages/Roadmap';
import CrisisSupport from './pages/CrisisSupport';
import SettingsPrivacy from './pages/SettingsPrivacy';
import TherapistDashboard from './pages/TherapistDashboard';
import Community from './pages/Community';
import Welcome from './pages/Welcome';
import Questionnaire from './pages/Questionnaire';
import Recommendations from './pages/Recommendations';
import AdminDashboard from './pages/AdminDashboard';


import { useLocation } from 'react-router-dom';

function AppContent() {
  const location = useLocation();
  const isQuestionnaire = location.pathname === '/questionnaire';

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!isQuestionnaire && <Navbar />}
      <main id="main-content" tabIndex="-1" style={{ flex: 1, outline: 'none' }}>
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

          {/* Admin Governance Portal (Phase B) */}
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
