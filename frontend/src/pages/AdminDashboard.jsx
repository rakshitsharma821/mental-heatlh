// ============================================
// MindCare — System Administration Portal (Part 4: Complete Admin System)
// Strictly enforces privacy: No access to personal journals, mood logs, or companion session words
// Supports:
// 1. Overview: Anonymized metrics, score-band distribution, session counts
// 2. Therapist Verification: Queue, Dossier viewer, per-doc review, overall decision with external licence check
// 3. Users & Assignments: Directory, assigned therapists, suspend/reactivate, force reset, DPDP erasure
// 4. Session Request Pipeline: Booking queue, approved therapist assignment/reassignment, outcome tracking
// 5. Decline Review: Therapist declines, "Ask Why" message thread, reassign/close
// 6. System Config: Read-only questionnaire & score bands, editable blocked words and helplines
// 7. Safety & Reports: Anonymized crisis trigger timestamps, therapist complaints management
// 8. Super Admin: Admin provisioning, enable/disable, credential reset
// 9. Audit Logs: Append-only Admin Audit Log and Clinical Consent Trail
// ============================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const THERAPIST_STATUS_OPTIONS = [
  'registered',
  'documents_pending',
  'under_review',
  'approved',
  'rejected',
  'more_info_required',
  'suspended'
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login?portal=admin');
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState('overview');

  // Common notification banner
  const [notice, setNotice] = useState({ type: '', text: '' });
  const showNotice = (text, type = 'success') => {
    setNotice({ type, text });
    setTimeout(() => setNotice({ type: '', text: '' }), 4000);
  };

  // 1. Overview state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // 2. Therapist Verification Queue state
  const [therapists, setTherapists] = useState([]);
  const [thQueueStatus, setThQueueStatus] = useState('');
  const [thQueueSearch, setThQueueSearch] = useState('');
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  // Dossier modal
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [docRejectReason, setDocRejectReason] = useState({});
  // Overall decision modal
  const [decisionModalTh, setDecisionModalTh] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    decision: 'approve',
    duration_minutes: 15,
    reason: '',
    licence_verified_externally: false,
    external_verification_notes: ''
  });

  // 3. Users & Assignments state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  // Assigned clients modal for a therapist
  const [assignedClientsModal, setAssignedClientsModal] = useState({ open: false, therapist: null, clients: [] });

  // 4. Session Requests Pipeline state
  const [sessionRequests, setSessionRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, request: null, therapist_id: '', admin_notes: '' });

  // 5. Decline Review state
  const [declines, setDeclines] = useState([]);
  const [loadingDeclines, setLoadingDeclines] = useState(false);
  // Decline "Ask Why" thread modal
  const [threadModal, setThreadModal] = useState({ open: false, decline: null, messages: [], newMessage: '' });

  // 6. System Config state
  const [configData, setConfigData] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [newBlockedWord, setNewBlockedWord] = useState('');

  // 7. Safety & Reports state
  const [safetyReports, setSafetyReports] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loadingSafety, setLoadingSafety] = useState(false);

  // 8. Super Admin state
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [createdAdminResult, setCreatedAdminResult] = useState(null);
  const [createAdminLoading, setCreateAdminLoading] = useState(false);

  // 9. Audit Logs state
  const [systemAuditLogs, setSystemAuditLogs] = useState([]);
  const [consentAuditLogs, setConsentAuditLogs] = useState([]);
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
    loadTherapistQueue();
    loadUsers();
    loadSessionRequests();
    loadDeclines();
    loadConfig();
    loadSafetyReports();
    loadAuditLogs();
  }, [isAdmin]);

  // Data loaders
  const loadStats = async () => {
    setLoadingStats(true);
    const res = await Api.getAdminStats();
    if (res.success) setStats(res.stats);
    setLoadingStats(false);
  };

  const loadTherapistQueue = async () => {
    setLoadingTherapists(true);
    const params = {};
    if (thQueueStatus) params.status = thQueueStatus;
    if (thQueueSearch.trim()) params.search = thQueueSearch.trim();
    const res = await Api.getTherapistQueue(params);
    if (res.success) setTherapists(res.therapists || []);
    setLoadingTherapists(false);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const params = {};
    if (userSearch.trim()) params.q = userSearch.trim();
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.status = statusFilter;
    const res = await Api.getAdminUsers(params);
    if (res.success) setUsers(res.users || []);
    setLoadingUsers(false);
  };

  const loadSessionRequests = async () => {
    setLoadingRequests(true);
    const res = await Api.getSessionRequests();
    if (res.success) setSessionRequests(res.requests || []);
    setLoadingRequests(false);
  };

  const loadDeclines = async () => {
    setLoadingDeclines(true);
    const res = await Api.getDeclines();
    if (res.success) setDeclines(res.declines || []);
    setLoadingDeclines(false);
  };

  const loadConfig = async () => {
    setLoadingConfig(true);
    const res = await Api.getAdminConfig();
    if (res.success) setConfigData(res);
    setLoadingConfig(false);
  };

  const loadSafetyReports = async () => {
    setLoadingSafety(true);
    const [safetyRes, compRes] = await Promise.all([
      Api.getSafetyReports(),
      Api.getComplaints()
    ]);
    if (safetyRes.success) setSafetyReports(safetyRes);
    if (compRes.success) setComplaints(compRes.complaints || []);
    setLoadingSafety(false);
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    const [sysRes, consentRes] = await Promise.all([
      Api.getAdminAuditLogs(),
      Api.getConsentAuditLogs()
    ]);
    if (sysRes.success) setSystemAuditLogs(sysRes.auditLogs || []);
    if (consentRes.success) setConsentAuditLogs(consentRes.auditLogs || []);
    setLoadingAudit(false);
  };

  // Section 2: Dossier Handlers
  const handleOpenDossier = async (therapistId) => {
    setLoadingDossier(true);
    const res = await Api.getTherapistDossier(therapistId);
    if (res.success) {
      setSelectedDossier(res);
      setDocRejectReason({});
    } else {
      showNotice(res.message || 'Failed to load dossier', 'error');
    }
    setLoadingDossier(false);
  };

  const handleDocumentReview = async (docId, status) => {
    if (!selectedDossier) return;
    const reason = docRejectReason[docId] || '';
    if (status === 'rejected' && !reason.trim()) {
      alert('Please provide a rejection reason for this document.');
      return;
    }
    const res = await Api.reviewTherapistDocument(selectedDossier.therapist.user_id, docId, status, reason);
    if (res.success) {
      showNotice(`Document marked as ${status}`);
      handleOpenDossier(selectedDossier.therapist.user_id);
      loadTherapistQueue();
    } else {
      showNotice(res.message || 'Error reviewing document', 'error');
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionModalTh) return;
    const res = await Api.makeVerificationDecision(decisionModalTh.user_id || decisionModalTh.profile_id, decisionForm);
    if (res.success) {
      showNotice(`Therapist verification updated to ${res.verification_status}`);
      setDecisionModalTh(null);
      loadTherapistQueue();
      loadStats();
    } else {
      showNotice(res.message || 'Failed to save decision', 'error');
    }
  };

  const handleDeleteTherapist = async (therapistId, therapistName) => {
    if (!window.confirm(`Are you sure you want to permanently delete therapist "${therapistName || 'this therapist'}"? This will delete all credentials, documents, and profile data.`)) {
      return;
    }
    const res = await Api.deleteTherapist(therapistId);
    if (res.success) {
      showNotice(res.message || 'Therapist permanently deleted.');
      if (selectedDossier && (selectedDossier.therapist.user_id === therapistId || selectedDossier.therapist.id === therapistId)) {
        setSelectedDossier(null);
      }
      loadTherapistQueue();
      loadStats();
    } else {
      showNotice(res.message || 'Failed to delete therapist', 'error');
    }
  };

  // Section 3: User Action Handlers
  const handleUserStatusChange = async (userId, newStatus) => {
    const res = await Api.updateUserStatus(userId, newStatus, `Admin set status to ${newStatus}`);
    if (res.success) {
      showNotice(`User status updated to ${newStatus}`);
      loadUsers();
      loadStats();
    } else {
      showNotice(res.message || 'Failed to update user status', 'error');
    }
  };

  const handleForcePasswordReset = async (userId) => {
    if (!window.confirm('Force password reset for this user on next login?')) return;
    const res = await Api.forcePasswordReset(userId);
    if (res.success) {
      showNotice('Password reset flag set successfully.');
    } else {
      showNotice(res.message || 'Failed to set reset flag', 'error');
    }
  };

  const handleDeleteUserDPDP = async (userObj) => {
    const confirmPrompt = window.prompt(
      `CAUTION: DPDP Account Erasure.\nType "ERASE" to permanently anonymize this account and remove private entries for ${userObj.public_id}:`
    );
    if (confirmPrompt !== 'ERASE') return;
    const res = await Api.deleteUserOnRequest(userObj.id, 'User requested DPDP erasure');
    if (res.success) {
      showNotice('Account successfully anonymized and private data purged.');
      loadUsers();
      loadStats();
    } else {
      showNotice(res.message || 'Failed to execute erasure', 'error');
    }
  };

  const handleViewAssignedClients = async (therapist) => {
    const res = await Api.getTherapistAssignedClients(therapist.user_id || therapist.id);
    if (res.success) {
      setAssignedClientsModal({ open: true, therapist, clients: res.clients || [] });
    }
  };

  // Section 4: Session Request Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.request) return;
    const res = await Api.assignTherapistToRequest(
      assignModal.request.id,
      assignModal.therapist_id,
      assignModal.admin_notes
    );
    if (res.success) {
      showNotice('Therapist successfully assigned to session request.');
      setAssignModal({ open: false, request: null, therapist_id: '', admin_notes: '' });
      loadSessionRequests();
      loadStats();
    } else {
      showNotice(res.message || 'Failed to assign therapist', 'error');
    }
  };

  // Section 5: Decline Thread Handlers
  const handleOpenDeclineThread = async (decline) => {
    const res = await Api.getDeclineThread(decline.id);
    if (res.success) {
      setThreadModal({ open: true, decline, messages: res.messages || [], newMessage: '' });
    }
  };

  const handlePostDeclineMessage = async (e) => {
    e.preventDefault();
    if (!threadModal.newMessage.trim()) return;
    const res = await Api.postDeclineMessage(threadModal.decline.id, threadModal.newMessage.trim());
    if (res.success) {
      setThreadModal(prev => ({
        ...prev,
        newMessage: '',
        messages: [...prev.messages, {
          id: res.id,
          sender_name: user?.name,
          sender_role: 'admin',
          message: threadModal.newMessage.trim(),
          created_at: new Date().toISOString()
        }]
      }));
    } else {
      showNotice(res.message || 'Failed to post message', 'error');
    }
  };

  const handleResolveDecline = async (declineId, action) => {
    let newThId = null;
    if (action === 'reassign') {
      newThId = window.prompt('Enter new approved therapist user_id:');
      if (!newThId) return;
    }
    const res = await Api.resolveDecline(declineId, action, newThId, `Admin selected ${action}`);
    if (res.success) {
      showNotice(`Decline marked as ${action === 'reassign' ? 'reassigned' : 'closed'}`);
      loadDeclines();
      if (threadModal.open) setThreadModal({ open: false, decline: null, messages: [], newMessage: '' });
    } else {
      showNotice(res.message || 'Failed to resolve decline', 'error');
    }
  };

  // Section 6: Config Handlers
  const handleAddBlockedWord = async (e) => {
    e.preventDefault();
    if (!newBlockedWord.trim() || !configData) return;
    const word = newBlockedWord.trim().toLowerCase();
    const currentList = configData.editable?.blockedWords || [];
    if (currentList.includes(word)) {
      alert('Word already exists in blocked words list.');
      return;
    }
    const updated = [...currentList, word];
    const res = await Api.updateBlockedWords(updated);
    if (res.success) {
      showNotice(`Added "${word}" to blocked words list.`);
      setNewBlockedWord('');
      loadConfig();
    } else {
      showNotice(res.message || 'Failed to update blocked words', 'error');
    }
  };

  const handleRemoveBlockedWord = async (wordToRemove) => {
    if (!configData) return;
    const currentList = configData.editable?.blockedWords || [];
    const updated = currentList.filter(w => w !== wordToRemove);
    const res = await Api.updateBlockedWords(updated);
    if (res.success) {
      showNotice(`Removed "${wordToRemove}" from blocked words list.`);
      loadConfig();
    }
  };

  // Section 8: Super Admin Provisioning
  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setCreateAdminLoading(true);
    const res = await Api.createAdmin({
      email: adminEmail.trim(),
      name: adminName.trim(),
      mobile_number: adminMobile.trim() || undefined
    });
    setCreateAdminLoading(false);
    if (res.success) {
      setCreatedAdminResult(res);
      setAdminEmail('');
      setAdminName('');
      setAdminMobile('');
      loadUsers();
      loadStats();
    } else {
      showNotice(res.message || 'Failed to create administrator.', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px' }}>
          
          <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Restricted Sanctuary System
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Administrative console access requires verified Administrator or Super Administrator credentials.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Return to Sanctuary Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Approved therapists list for assignment dropdown
  const approvedTherapists = therapists.filter(t => t.verification_status === 'approved');

  return (
    <div className="admin-dashboard-page" style={{ padding: '36px 24px 80px', minHeight: '100vh', position: 'relative' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#2b5f7d' }}>
                System Administration & Governance
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
              MindCare Sanctuary Control Console
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong> ({user?.role?.toUpperCase()}) • ID: <code>{user?.public_id || 'ADM-01'}</code>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isSuperAdmin && (
              <button
                onClick={() => { setShowCreateAdmin(true); setCreatedAdminResult(null); }}
                className="btn-primary"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              >
                + Provision Administrator
              </button>
            )}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '100px',
              background: 'rgba(43, 95, 125, 0.12)',
              border: '1px solid rgba(43, 95, 125, 0.25)',
              color: '#2b5f7d',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              <span>Zero-PII Protected</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost"
              style={{ fontSize: '0.82rem', padding: '7px 16px' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Global Notice Banner */}
        {notice.text && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: notice.type === 'error' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(82, 183, 136, 0.18)',
            color: notice.type === 'error' ? '#b91c1c' : 'var(--primary-dark)',
            border: `1px solid ${notice.type === 'error' ? 'rgba(220, 53, 69, 0.3)' : 'rgba(82, 183, 136, 0.35)'}`
          }}>
            {notice.type === 'error' ? 'Note: ' : 'Success: '} {notice.text}
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '24px',
          background: 'rgba(0, 0, 0, 0.03)',
          padding: '6px 8px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))',
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', title: 'Overview' },
            { id: 'verification', title: 'Therapist Queue' },
            { id: 'users', title: 'Users & Assignments' },
            { id: 'requests', title: 'Session Pipeline' },
            { id: 'declines', title: 'Decline Reviews' },
            { id: 'config', title: 'System Config' },
            { id: 'safety', title: 'Safety & Reports' },
            { id: 'super_admin', title: 'Super Admin', hide: !isSuperAdmin },
            { id: 'audit', title: 'Audit Logs' }
          ]
            .filter(t => !t.hide)
            .map((tab, idx) => ({
              ...tab,
              label: `${idx + 1}. ${tab.title}`
            }))
            .map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 700 : 600,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isActive ? '#1a2e22' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 2px 8px rgba(26, 46, 34, 0.25)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(26, 46, 34, 0.07)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div>
            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading system statistics...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Clients</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '4px' }}>
                      {stats?.clients ?? (stats?.roleCounts?.client || 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Young adults aged 20–25
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Approved Clinicians</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#2b5f7d', marginTop: '4px' }}>
                      {stats?.approvedTherapists ?? (stats?.therapistMetrics?.approved_therapists || 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#2b5f7d', marginTop: '4px' }}>
                      ● {stats?.activeTherapists ?? (stats?.therapistMetrics?.available_therapists || 0)} currently available
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Verifications</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#b07d3b', marginTop: '4px' }}>
                      {stats?.pendingVerifications ?? (stats?.therapistMetrics?.pending_therapists || 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Dossiers awaiting review
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Requests Awaiting Assignment</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
                      {stats?.requestsAwaitingAssignment ?? (stats?.bookingCounts?.requested || 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      In session routing pipeline
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Sessions This Week</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>
                      {stats?.sessionsThisWeek || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Scheduled consultations
                    </div>
                  </div>
                </div>

                {/* Score Band Aggregates */}
                <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Client Questionnaire Score-Band Distribution
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Total Questionnaires Completed: <strong>{stats?.questionnairesCompleted || 0}</strong> • Anonymized across 3 friendly score bands.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(82, 183, 136, 0.12)', border: '1px solid rgba(82, 183, 136, 0.3)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                        Steady Rhythm (Scores 0–7)
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '6px' }}>
                        {stats?.scoreBandDistribution?.low?.count ?? (stats?.assessmentBands?.low?.count || 0)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Steady baseline resilience
                      </div>
                    </div>

                    <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(246, 189, 96, 0.15)', border: '1px solid rgba(246, 189, 96, 0.35)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b07d3b', textTransform: 'uppercase' }}>
                        Rest & Reset (Scores 8–15)
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b07d3b', marginTop: '6px' }}>
                        {stats?.scoreBandDistribution?.moderate?.count ?? (stats?.assessmentBands?.moderate?.count || 0)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Accumulated tension / fatigue
                      </div>
                    </div>

                    <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.3)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>
                        Care & Comfort (Scores 16–24)
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b91c1c', marginTop: '6px' }}>
                        {stats?.scoreBandDistribution?.high?.count ?? (stats?.assessmentBands?.high?.count || 0)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Escalated to Aria / clinician connect
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: THERAPIST VERIFICATION QUEUE & DOSSIER */}
        {/* ========================================================= */}
        {activeTab === 'verification' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Clinician Verification Queue
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Inspect therapist credentials, review vaulted documents, and issue clinical practice decisions.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search name, licence, ID..."
                  value={thQueueSearch}
                  onChange={(e) => setThQueueSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadTherapistQueue()}
                  style={{ width: '200px', padding: '6px 12px', fontSize: '0.82rem' }}
                />
                <select
                  className="input-field"
                  value={thQueueStatus}
                  onChange={(e) => { setThQueueStatus(e.target.value); }}
                  style={{ width: '160px', padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <option value="">All Verification States</option>
                  {THERAPIST_STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <button onClick={loadTherapistQueue} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                  Filter
                </button>
              </div>
            </div>

            {loadingTherapists ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading clinician records...</div>
            ) : therapists.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px', textAlign: 'center' }}>
                No clinicians found matching filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Therapist ID</th>
                      <th style={{ padding: '10px' }}>Clinician</th>
                      <th style={{ padding: '10px' }}>Licence & Board</th>
                      <th style={{ padding: '10px' }}>Docs Uploaded</th>
                      <th style={{ padding: '10px' }}>External Check</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {therapists.map((th) => (
                      <tr key={th.profile_id || th.user_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {th.public_id}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {th.name} {th.is_demo && <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(246, 189, 96, 0.3)', color: '#b07d3b', borderRadius: '4px' }}>DEMO</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{th.email} • {th.city || 'India'}</div>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                          <div>{th.license_number}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{th.licensing_board}</div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontWeight: 600 }}>{th.uploaded_docs_count || 0} / 4</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {th.licence_verified_externally ? (
                            <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}> Verified</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Unverified</span>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '100px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: th.verification_status === 'approved' ? 'rgba(82, 183, 136, 0.2)' : (th.verification_status === 'under_review' ? 'rgba(246, 189, 96, 0.25)' : (th.verification_status === 'more_info_required' ? 'rgba(235, 148, 59, 0.2)' : 'rgba(220, 53, 69, 0.15)')),
                            color: th.verification_status === 'approved' ? 'var(--primary-dark)' : (th.verification_status === 'under_review' ? '#b07d3b' : (th.verification_status === 'more_info_required' ? '#c05621' : '#b91c1c'))
                          }}>
                            {th.verification_status}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenDossier(th.user_id || th.profile_id)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Open Dossier
                            </button>
                            <button
                              onClick={() => {
                                setDecisionModalTh(th);
                                setDecisionForm({
                                  decision: th.verification_status === 'approved' ? 'approve' : 'approve',
                                  reason: '',
                                  licence_verified_externally: Boolean(th.licence_verified_externally),
                                  external_verification_notes: th.external_verification_notes || ''
                                });
                              }}
                              className="btn-primary"
                              disabled={th.is_demo}
                              title={th.is_demo ? "Demo clinicians cannot be verified" : ""}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Decision
                            </button>
                            <button
                              onClick={() => handleDeleteTherapist(th.user_id || th.profile_id, th.name)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#dc2626',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                              title="Delete therapist submission"
                            >
                              
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Dossier Modal */}
        {selectedDossier && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div className="glass-card" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                    Clinician Verification Dossier
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {selectedDossier.therapist.full_name} ({selectedDossier.therapist.public_id}) • Status: <code>{selectedDossier.therapist.verification_status}</code>
                    {selectedDossier.therapist.held_until && (
                      <span style={{ marginLeft: '10px', color: '#c05621', fontWeight: 600 }}>
                        On Hold until {new Date(selectedDossier.therapist.held_until).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleDeleteTherapist(selectedDossier.therapist.user_id || selectedDossier.therapist.id, selectedDossier.therapist.full_name)}
                    className="btn-danger"
                    style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                     Delete Profile
                  </button>
                  <button onClick={() => setSelectedDossier(null)} className="btn-ghost" style={{ padding: '6px 12px' }}> Close</button>
                </div>
              </div>

              {/* Profile details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px', fontSize: '0.85rem', background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px' }}>
                <div><strong>Licence Number:</strong> {selectedDossier.therapist.license_number}</div>
                <div><strong>Licensing Board:</strong> {selectedDossier.therapist.licensing_board}</div>
                <div><strong>Therapist Type:</strong> {selectedDossier.therapist.therapist_type}</div>
                <div><strong>Experience:</strong> {selectedDossier.therapist.years_of_experience || 0} years</div>
                <div><strong>City & State:</strong> {selectedDossier.therapist.city}, {selectedDossier.therapist.state}</div>
                <div><strong>Consultation Modes:</strong> {(selectedDossier.therapist.consultation_modes || []).join(', ')}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Professional Bio:</strong> {selectedDossier.therapist.bio || '—'}</div>
              </div>

              {/* Vaulted Documents Table */}
              <h4 style={{ fontSize: '1.05rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                Vaulted Documents ({selectedDossier.documents.length})
              </h4>

              {selectedDossier.documents.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  No documents uploaded yet by this clinician.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Type</th>
                        <th style={{ padding: '8px' }}>File</th>
                        <th style={{ padding: '8px' }}>Preview</th>
                        <th style={{ padding: '8px' }}>Doc Status</th>
                        <th style={{ padding: '8px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDossier.documents.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{doc.doc_type}</td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ fontWeight: 600 }}>{doc.original_filename}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(doc.file_size / 1024).toFixed(1)} KB</div>
                            {doc.ai_notes && (
                              <div style={{ fontSize: '0.7rem', color: '#2b5f7d', fontStyle: 'italic', marginTop: '2px' }}>
                                 {doc.ai_notes}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <a
                              href={doc.view_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--primary-dark)', fontWeight: 600, textDecoration: 'underline' }}
                            >
                              Open in Secure Viewer ↗
                            </a>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                              {doc.ai_verified && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '100px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  background: 'rgba(82, 183, 136, 0.2)',
                                  color: '#2d6a4f'
                                }}>
                                  System Validated ({doc.ai_confidence || 98}%)
                                </span>
                              )}
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '100px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: doc.status === 'approved' || doc.status === 'verified' ? 'rgba(82, 183, 136, 0.2)' : (doc.status === 'rejected' ? 'rgba(220, 53, 69, 0.2)' : 'rgba(246, 189, 96, 0.25)'),
                                color: doc.status === 'approved' || doc.status === 'verified' ? 'var(--primary-dark)' : (doc.status === 'rejected' ? '#b91c1c' : '#b07d3b')
                              }}>
                                {doc.status}
                              </span>
                            </div>
                            {doc.reject_reason && (
                              <div style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: '2px' }}>
                                Reason: {doc.reject_reason}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <button
                                onClick={() => handleDocumentReview(doc.id, 'accepted')}
                                className="btn-secondary"
                                style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--primary-dark)' }}
                              >
                                 Accept
                              </button>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                  type="text"
                                  placeholder="Reject reason..."
                                  value={docRejectReason[doc.id] || ''}
                                  onChange={(e) => setDocRejectReason({ ...docRejectReason, [doc.id]: e.target.value })}
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', width: '110px' }}
                                />
                                <button
                                  onClick={() => handleDocumentReview(doc.id, 'rejected')}
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overall Decision Modal */}
        {decisionModalTh && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  Verification Decision: {decisionModalTh.name}
                </h3>
                <button onClick={() => setDecisionModalTh(null)} className="btn-ghost" style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center' }} aria-label="Close modal">✕</button>
              </div>

              <form onSubmit={handleDecisionSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Decision Action *
                  </label>
                  <select
                    className="input-field"
                    value={decisionForm.decision}
                    onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}
                  >
                    <option value="approve">Approve (Authorize Practice & Availability)</option>
                    <option value="hold">Temporary Hold / Pause Access (Set Duration)</option>
                    <option value="request_more_info">Request More Info (Re-upload required)</option>
                    <option value="reject">Reject Application</option>
                    <option value="suspend">Suspend Clinician</option>
                  </select>
                </div>

                {decisionForm.decision === 'hold' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Temporary Hold Duration *
                    </label>
                    <select
                      className="input-field"
                      value={decisionForm.duration_minutes || 15}
                      onChange={(e) => setDecisionForm({ ...decisionForm, duration_minutes: parseInt(e.target.value, 10) })}
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={1440}>24 Hours (1 Day)</option>
                      <option value={4320}>3 Days</option>
                      <option value={10080}>7 Days</option>
                    </select>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Therapist consultation access will be paused for this duration and automatically resume afterward.
                    </span>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={decisionForm.licence_verified_externally}
                      onChange={(e) => setDecisionForm({ ...decisionForm, licence_verified_externally: e.target.checked })}
                    />
                    <span>Licence verified externally via council registry</span>
                  </label>
                </div>

                {decisionForm.licence_verified_externally && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      External Verification Registry Notes
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Verified on RCI Registry portal on 23-Oct"
                      value={decisionForm.external_verification_notes}
                      onChange={(e) => setDecisionForm({ ...decisionForm, external_verification_notes: e.target.value })}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Reason / Administrative Note {decisionForm.decision !== 'approve' && '* (Required)'}
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Provide rationale or required changes..."
                    value={decisionForm.reason}
                    onChange={(e) => setDecisionForm({ ...decisionForm, reason: e.target.value })}
                    required={decisionForm.decision !== 'approve'}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Submit Verification Decision →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: USERS & ASSIGNMENTS */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  User Directory & Therapist Assignments
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Zero-PII member oversight with DPDP account anonymization, assigned therapists, and force reset.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search name, ID, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                  style={{ width: '180px', padding: '6px 12px', fontSize: '0.82rem' }}
                />
                <select
                  className="input-field"
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); }}
                  style={{ width: '120px', padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <option value="">All Roles</option>
                  <option value="client">Client</option>
                  <option value="therapist">Therapist</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <select
                  className="input-field"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); }}
                  style={{ width: '120px', padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </select>
                <button onClick={loadUsers} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                  Filter
                </button>
              </div>
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading users...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Public ID</th>
                      <th style={{ padding: '10px' }}>Name & Email</th>
                      <th style={{ padding: '10px' }}>Role</th>
                      <th style={{ padding: '10px' }}>Assigned Clinician</th>
                      <th style={{ padding: '10px' }}>Last Login</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {u.public_id}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '100px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: u.role === 'super_admin' ? 'rgba(155, 89, 182, 0.2)' : (u.role === 'admin' ? 'rgba(43, 95, 125, 0.2)' : (u.role === 'therapist' ? 'rgba(82, 183, 136, 0.2)' : 'rgba(246, 189, 96, 0.2)')),
                            color: u.role === 'super_admin' ? '#8e44ad' : (u.role === 'admin' ? '#2b5f7d' : (u.role === 'therapist' ? 'var(--primary-dark)' : '#b07d3b'))
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {u.assigned_therapist ? (
                            <div>
                              <span style={{ fontWeight: 600 }}>{u.assigned_therapist.name}</span>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.assigned_therapist.public_id}</div>
                            </div>
                          ) : u.role === 'therapist' ? (
                            <button
                              onClick={() => handleViewAssignedClients(u)}
                              className="btn-secondary"
                              style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            >
                              View Clients
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>None assigned</span>
                          )}
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <select
                            className="input-field"
                            value={u.status || 'active'}
                            onChange={(e) => handleUserStatusChange(u.id, e.target.value)}
                            disabled={u.id === user?.id}
                            style={{ padding: '3px 6px', fontSize: '0.75rem', width: '95px' }}
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="deleted">Deleted</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleForcePasswordReset(u.id)}
                              className="btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                              title="Force password reset on next login"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => handleDeleteUserDPDP(u)}
                              disabled={u.id === user?.id}
                              style={{ padding: '3px 8px', fontSize: '0.72rem', background: 'rgba(220, 53, 69, 0.1)', color: '#b91c1c', border: '1px solid rgba(220, 53, 69, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
                              title="DPDP Erasure and Anonymization"
                            >
                              DPDP Erase
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Assigned Clients Modal */}
        {assignedClientsModal.open && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div className="glass-card" style={{ maxWidth: '550px', width: '100%', padding: '24px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  Assigned Clients for {assignedClientsModal.therapist?.full_name || assignedClientsModal.therapist?.name}
                </h3>
                <button onClick={() => setAssignedClientsModal({ open: false, therapist: null, clients: [] })} className="btn-ghost" style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center' }} aria-label="Close modal">✕</button>
              </div>

              {assignedClientsModal.clients.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No clients currently assigned to this clinician.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Public ID</th>
                        <th style={{ padding: '8px' }}>Client</th>
                        <th style={{ padding: '8px' }}>Total Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedClientsModal.clients.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px', fontFamily: 'monospace' }}>{c.public_id}</td>
                          <td style={{ padding: '8px' }}>{c.full_name}</td>
                          <td style={{ padding: '8px' }}>{c.total_sessions || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SESSION REQUEST PIPELINE */}
        {/* ========================================================= */}
        {activeTab === 'requests' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Clinical Session Request Pipeline
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Coordinate client requests, assign approved clinicians, and record consultation outcomes.
                </p>
              </div>
              <button onClick={loadSessionRequests} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                Refresh
              </button>
            </div>

            {loadingRequests ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading session requests...</div>
            ) : sessionRequests.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px', textAlign: 'center' }}>
                No session bookings in the pipeline.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Client</th>
                      <th style={{ padding: '10px' }}>Session Type</th>
                      <th style={{ padding: '10px' }}>Slot Time</th>
                      <th style={{ padding: '10px' }}>Assigned Clinician</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionRequests.map((req) => (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 600 }}>{req.client_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.client_public_id}</div>
                        </td>
                        <td style={{ padding: '10px' }}>{req.session_type || 'Consultation'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                          {new Date(req.preferred_slot).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px' }}>
                          {req.therapist_name ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{req.therapist_name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.therapist_public_id}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#b91c1c', fontWeight: 600 }}>Awaiting Assignment</span>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '100px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: req.status === 'confirmed' ? 'rgba(82, 183, 136, 0.2)' : 'rgba(246, 189, 96, 0.25)',
                            color: req.status === 'confirmed' ? 'var(--primary-dark)' : '#b07d3b'
                          }}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <button
                            onClick={() => setAssignModal({ open: true, request: req, therapist_id: req.therapist_id || '', admin_notes: req.admin_notes || '' })}
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Assign / Route
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Assign Therapist Modal */}
        {assignModal.open && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '28px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  Assign Approved Clinician
                </h3>
                <button onClick={() => setAssignModal({ open: false, request: null, therapist_id: '', admin_notes: '' })} className="btn-ghost" style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center' }} aria-label="Close modal">✕</button>
              </div>

              <form onSubmit={handleAssignSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Select Approved Clinician *
                  </label>
                  <select
                    className="input-field"
                    value={assignModal.therapist_id}
                    onChange={(e) => setAssignModal({ ...assignModal, therapist_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Approved Clinician --</option>
                    {approvedTherapists.map(th => (
                      <option key={th.user_id} value={th.user_id}>
                        {th.name} ({th.therapist_type || 'Clinician'}) - {th.public_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Administrative Coordination Notes
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Coordination notes or instructions..."
                    value={assignModal.admin_notes}
                    onChange={(e) => setAssignModal({ ...assignModal, admin_notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Confirm Clinician Assignment →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: DECLINE REVIEWS & "ASK WHY" */}
        {/* ========================================================= */}
        {activeTab === 'declines' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                   Session Decline Reviews & Oversight
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Track reasons when a clinician declines a request, initiate "Ask Why" threads, and reassign clients.
                </p>
              </div>
              <button onClick={loadDeclines} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                Refresh
              </button>
            </div>

            {loadingDeclines ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading decline records...</div>
            ) : declines.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px', textAlign: 'center' }}>
                No therapist declines recorded.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Clinician</th>
                      <th style={{ padding: '10px' }}>Client</th>
                      <th style={{ padding: '10px' }}>Decline Reason</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {declines.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{d.therapist_name}</td>
                        <td style={{ padding: '10px' }}>{d.client_public_id || 'Client'}</td>
                        <td style={{ padding: '10px', color: '#b91c1c' }}>{d.reason}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '100px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: d.status === 'closed' ? 'rgba(82, 183, 136, 0.2)' : 'rgba(246, 189, 96, 0.25)',
                            color: d.status === 'closed' ? 'var(--primary-dark)' : '#b07d3b'
                          }}>
                            {d.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenDeclineThread(d)}
                              className="btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              "Ask Why" Thread
                            </button>
                            <button
                              onClick={() => handleResolveDecline(d.id, 'close')}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Decline Thread Modal */}
        {threadModal.open && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div className="glass-card" style={{ maxWidth: '580px', width: '100%', padding: '24px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                   Inquiry Thread: {threadModal.decline?.therapist_name}
                </h3>
                <button onClick={() => setThreadModal({ open: false, decline: null, messages: [], newMessage: '' })} className="btn-ghost" style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center' }} aria-label="Close modal">✕</button>
              </div>

              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.82rem' }}>
                <strong>Original Decline Reason:</strong> {threadModal.decline?.reason}
              </div>

              {/* Message history */}
              <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {threadModal.messages.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '12px' }}>
                    No messages in this thread yet. Send an administrative inquiry below.
                  </div>
                ) : (
                  threadModal.messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '0.82rem',
                        alignSelf: m.sender_role === 'admin' ? 'flex-end' : 'flex-start',
                        background: m.sender_role === 'admin' ? 'rgba(43, 95, 125, 0.15)' : 'rgba(82, 183, 136, 0.15)',
                        maxWidth: '80%'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                        {m.sender_name} ({m.sender_role}) • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>{m.message}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostDeclineMessage} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ask clinician for clarification..."
                  value={threadModal.newMessage}
                  onChange={(e) => setThreadModal({ ...threadModal, newMessage: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: SYSTEM CONFIG */}
        {/* ========================================================= */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Editable: Blocked Words & Safe Synonyms */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Editable Blocked Words & Language Guard
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Proactive words that Aria or the platform must never initiate unless user-introduced. Changes are audit-logged.
              </p>

              <form onSubmit={handleAddBlockedWord} style={{ display: 'flex', gap: '8px', marginBottom: '16px', maxWidth: '420px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Add blocked word..."
                  value={newBlockedWord}
                  onChange={(e) => setNewBlockedWord(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                  + Add Word
                </button>
              </form>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '180px', overflowY: 'auto', padding: '10px', background: 'var(--bg-surface)', borderRadius: '10px' }}>
                {(configData?.editable?.blockedWords || []).map((word) => (
                  <span
                    key={word}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '0.78rem',
                      background: 'rgba(220, 53, 69, 0.1)',
                      color: '#b91c1c',
                      border: '1px solid rgba(220, 53, 69, 0.25)'
                    }}
                  >
                    <span>{word}</span>
                    <button
                      onClick={() => handleRemoveBlockedWord(word)}
                      style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Read-Only: 8 Questions & Score Bands */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'rgba(43, 95, 125, 0.15)', color: '#2b5f7d', fontSize: '0.72rem', fontWeight: 700, marginBottom: '6px' }}>
                READ-ONLY SPECIFICATION
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Young Adult Focus Questionnaire (Fixed 8 Questions, 0–3 Scale)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Standardized non-branching clinical screener designed for ages 20–25.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(configData?.readOnly?.questionnaire?.questions || []).map((q, idx) => (
                  <div key={q.id} style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <strong>{idx + 1}. {q.question}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{q.helper}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: SAFETY & REPORTS */}
        {/* ========================================================= */}
        {activeTab === 'safety' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Crisis-Path Triggers (Anonymized Timestamps Only)
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Total Events: <strong>{safetyReports?.totalEvents || 0}</strong> • Strictly zero client identifiers, journal text, or conversational PII.
                  </p>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 700 }}>
                  Anonymity Guarantee Enforced
                </div>
              </div>

              {safetyReports?.recentEvents?.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent crisis triggers recorded.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Event ID</th>
                        <th style={{ padding: '8px' }}>Trigger Classification</th>
                        <th style={{ padding: '8px' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safetyReports?.recentEvents?.map((ev) => (
                        <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px', fontFamily: 'monospace' }}>{ev.id.slice(0, 12)}...</td>
                          <td style={{ padding: '8px', color: '#b91c1c', fontWeight: 600 }}>{ev.trigger_type}</td>
                          <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                            {new Date(ev.triggered_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Complaints Management */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Clinician Complaints & Incident Reports
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Track complaints filed regarding clinician conduct with resolution notes.
              </p>

              {complaints.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No complaints filed. All records in good standing.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Clinician</th>
                        <th style={{ padding: '8px' }}>Category</th>
                        <th style={{ padding: '8px' }}>Details</th>
                        <th style={{ padding: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{c.therapist_name}</td>
                          <td style={{ padding: '8px' }}>{c.category}</td>
                          <td style={{ padding: '8px' }}>{c.details}</td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(246, 189, 96, 0.25)', color: '#b07d3b' }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: SUPER ADMIN (Provisioning & Access Codes) */}
        {/* ========================================================= */}
        {activeTab === 'super_admin' && isSuperAdmin && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Super Administrator Security Governance
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Provision administrative personnel, manage access code rotation, and enable/disable administrators.
                </p>
              </div>
              <button
                onClick={() => { setShowCreateAdmin(true); setCreatedAdminResult(null); }}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                + Provision Administrator
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Public ID</th>
                    <th style={{ padding: '10px' }}>Administrator</th>
                    <th style={{ padding: '10px' }}>Role</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'admin' || u.role === 'super_admin').map((adm) => (
                    <tr key={adm.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>{adm.public_id}</td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 600 }}>{adm.full_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{adm.email}</div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(155, 89, 182, 0.2)', color: '#8e44ad' }}>
                          {adm.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: adm.status === 'active' ? 'rgba(82, 183, 136, 0.2)' : 'rgba(220, 53, 69, 0.2)', color: adm.status === 'active' ? 'var(--primary-dark)' : '#b91c1c' }}>
                          {adm.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={async () => {
                              const newStatus = adm.status === 'active' ? 'suspended' : 'active';
                              const res = await Api.updateAdminStatus(adm.id, newStatus);
                              if (res.success) {
                                showNotice(res.message);
                                loadUsers();
                              } else {
                                showNotice(res.message, 'error');
                              }
                            }}
                            disabled={adm.id === user?.id}
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          >
                            {adm.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Generate new one-time access code and password for ${adm.full_name}?`)) return;
                              const res = await Api.resetAdminCredentials(adm.id);
                              if (res.success) {
                                setCreatedAdminResult(res);
                                setShowCreateAdmin(true);
                              } else {
                                showNotice(res.message, 'error');
                              }
                            }}
                            className="btn-primary"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          >
                            Reset Access Code
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: AUDIT LOGS */}
        {/* ========================================================= */}
        {activeTab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    System Administration Audit Log (Append-Only)
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Immutable log recording all admin mutations, verification actions, and credentials operations.
                  </p>
                </div>
                <button onClick={loadAuditLogs} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                  Refresh Logs
                </button>
              </div>

              {loadingAudit ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading audit trail...</div>
              ) : systemAuditLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No administrative events logged yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Timestamp</th>
                        <th style={{ padding: '8px' }}>Administrator</th>
                        <th style={{ padding: '8px' }}>Action</th>
                        <th style={{ padding: '8px' }}>Target</th>
                        <th style={{ padding: '8px' }}>Reason</th>
                        <th style={{ padding: '8px' }}>IP Origin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemAuditLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>
                            {log.admin_name || 'Admin'} ({log.admin_role})
                          </td>
                          <td style={{ padding: '8px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                            <code>{log.action}</code>
                          </td>
                          <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                            {log.target_type}: {log.target_id}
                          </td>
                          <td style={{ padding: '8px' }}>
                            {log.reason || '—'}
                          </td>
                          <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                            {log.ip || '127.0.0.1'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Clinical Consent Audit Logs */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                 Clinical Consent Access Trail
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Immutable audit trail verifying clinician scope compliance when accessing client records.
              </p>

              {consentAuditLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No clinician access events recorded yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Timestamp</th>
                        <th style={{ padding: '8px' }}>Clinician</th>
                        <th style={{ padding: '8px' }}>Scope</th>
                        <th style={{ padding: '8px' }}>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consentAuditLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                            {new Date(log.accessed_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{log.therapist_name}</td>
                          <td style={{ padding: '8px', color: 'var(--primary-dark)' }}>
                            <code>{log.accessed_scope}</code>
                          </td>
                          <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Provision Admin Modal */}
        {showCreateAdmin && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '32px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                   Provision Administrator
                </h3>
                <button onClick={() => setShowCreateAdmin(false)} className="btn-ghost" style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center' }} aria-label="Close modal">✕</button>
              </div>

              {createdAdminResult ? (
                <div>
                  <div style={{ padding: '16px', background: 'rgba(82, 183, 136, 0.15)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(82, 183, 136, 0.3)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>
                       Administrator Credentials Generated (Displayed Once Only)
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Securely share these credentials. They must change password and access code upon first login:
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong>Admin ID:</strong> <code>{createdAdminResult.user.public_id}</code></div>
                      <div><strong>Email:</strong> {createdAdminResult.user.email}</div>
                      <div><strong>Temporary Password:</strong> <code>{createdAdminResult.temporaryPassword}</code></div>
                      <div><strong>One-Time Access Code:</strong> <code>{createdAdminResult.oneTimeAccessCode}</code></div>
                    </div>
                  </div>
                  <button onClick={() => { setShowCreateAdmin(false); setCreatedAdminResult(null); }} className="btn-primary" style={{ width: '100%' }}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateAdminSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Dr. Aanya Sharma"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="e.g. aanya.sharma@mindcare.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="e.g. +91 98XXXXXXXX"
                      value={adminMobile}
                      onChange={(e) => setAdminMobile(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createAdminLoading}
                    style={{ width: '100%' }}
                  >
                    {createAdminLoading ? 'Provisioning...' : 'Provision Administrator Account →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
