// ============================================
// MindCare — Clinical Oversight Portal (Therapist & Psychiatrist Dashboard)
// Part 3: Therapist Profile, Document Submission Vault, Dismissible Completion Popup,
//         Multi-Stage Verification State Machine, and Clinical Consultation Workspace
// ============================================

import React, { useState, useEffect } from 'react';
import { ClinicalConsentService } from '../services/clinicalConsent';
import { Storage } from '../services/storage';
import { Api } from '../services/api';
import { calculateDigitalTwin } from '../services/digitalTwin';
import ClinicalLiveRoom from '../components/clinical/ClinicalLiveRoom';
import { CLINICAL_CONFIG } from '../config/clinicalConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const THERAPY_OPTIONS = [
  'Cognitive Behavioral Therapy (CBT)',
  'Mindfulness-Based Stress Reduction (MBSR)',
  'Somatic Down-Regulation Protocol',
  'Psychiatric Referral & Clinical Evaluation',
  'Exposure Therapy & Anxiety Defusion',
  'Circadian & Sleep Rhythm Restoration'
];

export const DOCUMENT_SECTIONS = [
  {
    id: 'govt_id',
    title: 'Government Photo ID',
    desc: 'Aadhaar (masked), Passport, Voter ID or Driving Licence',
    required: true
  },
  {
    id: 'degree_certificate',
    title: 'Highest Degree Certificate',
    desc: 'M.Phil / Ph.D / M.D. / M.Sc. degree certificate matching clinical profile',
    required: true
  },
  {
    id: 'licence_certificate',
    title: 'Professional Licence Proof',
    desc: 'RCI, NMC, or State Medical/Psychological Council registration certificate',
    required: true
  },
  {
    id: 'photo',
    title: 'Professional Headshot / Portrait',
    desc: 'Recent frontal clinical portrait with neutral plain background',
    required: true
  },
  {
    id: 'experience_proof',
    title: 'Clinical Experience / Affiliation',
    desc: 'Hospital appointment letter, clinic affiliation or experience certificate',
    required: false
  }
];

export default function TherapistDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login?portal=therapist');
  };

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'documents' | 'profile'
  const [consent, setConsent] = useState(ClinicalConsentService.getConsent());
  const [enteredKey, setEnteredKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(consent.accessGranted);
  const [twin, setTwin] = useState(null);
  const [requests, setRequests] = useState([]);

  // Therapist Verification & Profile state (Part 3)
  const [profileData, setProfileData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('documents_pending');
  const [documents, setDocuments] = useState([]);
  const [missingDocs, setMissingDocs] = useState([]);
  const [completionPercentage, setCompletionPercentage] = useState(50);
  const [completionPopupOpen, setCompletionPopupOpen] = useState(false);

  // Document Upload state (Multi-Card Credential Verification)
  const [docFiles, setDocFiles] = useState({});
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('govt_id');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dpdpAgreed, setDpdpAgreed] = useState(true);
  const [uploadNotice, setUploadNotice] = useState({ type: '', text: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [dossierNotice, setDossierNotice] = useState({ type: '', text: '' });

  // Profile Edit state
  const [profileBio, setProfileBio] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [profileFee, setProfileFee] = useState(1200);
  const [profileExp, setProfileExp] = useState(3);
  const [profileSaveNotice, setProfileSaveNotice] = useState('');

  // Therapist availability state
  const [isOnline, setIsOnline] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  // Live WebRTC Session modal state
  const [liveSessionOpen, setLiveSessionOpen] = useState(false);
  const [activeClientSession, setActiveClientSession] = useState(null);

  // Clinical Treatment Plan State
  const [targetClientId, setTargetClientId] = useState('');
  const [requiresEvaluation, setRequiresEvaluation] = useState(false);
  const [evaluationSummary, setEvaluationSummary] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [selectedTherapies, setSelectedTherapies] = useState([]);
  const [goalsInput, setGoalsInput] = useState('');
  const [planSaveStatus, setPlanSaveStatus] = useState(null);
  const [existingPlan, setExistingPlan] = useState(null);
  const [selectedAssessmentModal, setSelectedAssessmentModal] = useState(null);

  // Part 5: Availability Schedule & Assigned Sessions
  const [schedule, setSchedule] = useState({
    weekly_schedule: {
      monday: [{ start: "10:00", end: "17:00" }],
      tuesday: [{ start: "10:00", end: "17:00" }],
      wednesday: [{ start: "10:00", end: "17:00" }],
      thursday: [{ start: "10:00", end: "17:00" }],
      friday: [{ start: "10:00", end: "17:00" }],
      saturday: [],
      sunday: []
    },
    timezone: 'Asia/Kolkata',
    slot_duration_minutes: 45,
    buffer_minutes: 10,
    leave_dates: [],
    one_off_slots: []
  });
  const [scheduleNotice, setScheduleNotice] = useState({ type: '', text: '' });
  const [assignedSessions, setAssignedSessions] = useState([]);
  const [declineModalSession, setDeclineModalSession] = useState(null);
  const [declineReason, setDeclineReason] = useState('schedule_conflict');
  const [declineNote, setDeclineNote] = useState('');
  const [proposeModalSession, setProposeModalSession] = useState(null);
  const [proposedSlotTime, setProposedSlotTime] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [newLeaveDate, setNewLeaveDate] = useState('');

  const loadSchedule = async () => {
    try {
      const res = await Api.getTherapistSchedule();
      if (res.success && res.schedule) {
        setSchedule(res.schedule);
      }
    } catch (e) {
      // Ignore
    }
  };

  const loadAssignedSessions = async () => {
    try {
      const res = await Api.getTherapistSessions();
      if (res.success && res.sessions) {
        setAssignedSessions(res.sessions);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setScheduleNotice({ type: '', text: '' });
    try {
      const res = await Api.updateTherapistSchedule(schedule);
      if (res.success) {
        setScheduleNotice({ type: 'success', text: 'Availability schedule saved successfully!' });
        setTimeout(() => setScheduleNotice({ type: '', text: '' }), 4000);
      } else {
        setScheduleNotice({ type: 'error', text: res.message || 'Failed to update schedule.' });
      }
    } catch (err) {
      setScheduleNotice({ type: 'error', text: 'Server unreachable.' });
    }
  };

  const handleHeartbeatPing = async () => {
    try {
      const res = await Api.sendTherapistHeartbeat();
      if (res.success) {
        setIsOnline(true);
        setAvailabilityMessage('Heartbeat acknowledged: Online status refreshed for 60 seconds.');
        setTimeout(() => setAvailabilityMessage(''), 3500);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleTherapistAction = async (sessionId, action, extra = {}) => {
    setActionNotice('');
    try {
      const res = await Api.therapistSessionAction(sessionId, { action, ...extra });
      if (res.success) {
        setActionNotice(res.message);
        loadAssignedSessions();
        setTimeout(() => setActionNotice(''), 4000);
      } else {
        alert(res.message || 'Action failed.');
      }
    } catch (err) {
      alert('Server error processing action.');
    }
  };

  // Load therapist profile, verification status, and document dossier
  const loadProfileAndDocs = async () => {
    const res = await Api.getTherapistProfile();
    if (res.success && res.profile) {
      setProfileData(res.profile);
      setVerificationStatus(res.profile.verification_status || 'documents_pending');
      setDocuments(res.documents || []);
      setMissingDocs(res.missingDocuments || []);
      setCompletionPercentage(res.completionPercentage || 50);
      setProfileBio(res.profile.bio || '');
      setProfileTitle(res.profile.title || 'Licensed Clinical Psychologist');
      setProfileFee(res.profile.consultation_fee || 1200);
      setProfileExp(res.profile.years_of_experience || 3);
      setIsOnline(Boolean(res.profile.is_available));

      // Trigger dismissible popup if not approved and not dismissed in current session
      const dismissed = sessionStorage.getItem('mindcare_dismiss_profile_popup');
      if (res.profile.verification_status !== 'approved' && dismissed !== 'true') {
        setCompletionPopupOpen(true);
      }
    }
  };

  useEffect(() => {
    loadProfileAndDocs();
    loadSchedule();
    loadAssignedSessions();

    const user = Storage.getCurrentUser();
    const journals = Storage.getJournalEntries();
    const routines = Storage.getRoutines();
    const calculatedTwin = calculateDigitalTwin(user, journals, routines);
    setTwin(calculatedTwin);
    setRequests(ClinicalConsentService.getSessionRequests());

    if (consent.accessGranted) {
      ClinicalConsentService.recordAuditAccess(user?.name || profileData?.full_name || 'Clinician');
    }

    // Fetch active treatment plan
    Api.getTreatmentPlan(targetClientId).then(res => {
      if (res.success && res.hasPlan) {
        setExistingPlan(res.plan);
        setRequiresEvaluation(Boolean(res.plan.requires_further_evaluation));
        setClinicalNotes(res.plan.clinical_notes || '');
        setEvaluationSummary(res.plan.evaluation_summary || '');
        if (Array.isArray(res.plan.collaborative_therapies)) {
          setSelectedTherapies(res.plan.collaborative_therapies);
        }
      }
    });
  }, [consent.accessGranted, targetClientId]);

  const handleDismissPopup = () => {
    setCompletionPopupOpen(false);
    sessionStorage.setItem('mindcare_dismiss_profile_popup', 'true');
  };

  const handleToggleAvailability = async () => {
    if (verificationStatus !== 'approved') {
      setAvailabilityMessage('Account under review. Online availability unlocks upon clinical verification.');
      setTimeout(() => setAvailabilityMessage(''), 4000);
      return;
    }
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    const res = await Api.toggleTherapistAvailability(newStatus);
    if (res.success) {
      setAvailabilityMessage(newStatus ? 'You are now marked ONLINE for instant consultations.' : 'You are now marked OFFLINE.');
      setTimeout(() => setAvailabilityMessage(''), 3500);
    }
  };

  const handleUnlockWithKey = async (e) => {
    e.preventDefault();
    setKeyError('');
    setIsVerifyingKey(true);
    try {
      const serverRes = await Api.verifyConsentKey(enteredKey);
      if (serverRes.success) {
        setIsUnlocked(true);
        ClinicalConsentService.grantAccess();
        setConsent(ClinicalConsentService.getConsent());
      } else if (enteredKey.trim().toUpperCase() === consent.accessKey.toUpperCase()) {
        setIsUnlocked(true);
        ClinicalConsentService.grantAccess();
        setConsent(ClinicalConsentService.getConsent());
      } else {
        setKeyError(serverRes.message || 'Invalid pairing key. Please check the access key in client settings.');
      }
    } catch (err) {
      if (enteredKey.trim().toUpperCase() === consent.accessKey.toUpperCase()) {
        setIsUnlocked(true);
        ClinicalConsentService.grantAccess();
        setConsent(ClinicalConsentService.getConsent());
      } else {
        setKeyError('Verification error. Please verify the client pairing key.');
      }
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = ClinicalConsentService.updateRequestStatus(id, newStatus);
    setRequests(updated);
  };

  const handleStartCall = (req) => {
    if (verificationStatus !== 'approved') {
      alert('Consultation calls are restricted until clinical verification is approved by administration.');
      return;
    }
    setActiveClientSession({
      id: req.id || req.client_id || 'guest',
      name: req.clientName || 'Client'
    });
    setLiveSessionOpen(true);
  };

  const toggleTherapyChoice = (choice) => {
    if (selectedTherapies.includes(choice)) {
      setSelectedTherapies(selectedTherapies.filter(c => c !== choice));
    } else {
      setSelectedTherapies([...selectedTherapies, choice]);
    }
  };

  const handleSaveTreatmentPlan = async (e) => {
    e.preventDefault();
    if (verificationStatus !== 'approved') {
      setPlanSaveStatus('error');
      alert('Only approved therapists can create or edit clinical treatment plans.');
      return;
    }

    setPlanSaveStatus('saving');
    const goalsArray = goalsInput.split(',').map(g => g.trim()).filter(Boolean);

    const payload = {
      clientId: targetClientId,
      requiresFurtherEvaluation: requiresEvaluation,
      evaluationSummary: evaluationSummary.trim(),
      clinicalNotes: clinicalNotes.trim(),
      collaborativeTherapies: selectedTherapies,
      goals: goalsArray
    };

    const res = await Api.saveTreatmentPlan(payload);
    if (res.success) {
      setPlanSaveStatus('saved');
      setExistingPlan(res.plan);
      setTimeout(() => setPlanSaveStatus(null), 4000);
    } else {
      setPlanSaveStatus('error');
    }
  };

  // Upload individual document from card
  const handleUploadSingleDoc = async (docType) => {
    const file = docFiles[docType];
    if (!file) {
      setUploadNotice({ type: 'error', text: `Please select a file to upload for ${docType.replace(/_/g, ' ')}.` });
      return;
    }

    if (file.size > CLINICAL_CONFIG.documentRules.maxFileSizeBytes) {
      setUploadNotice({ type: 'error', text: `File size exceeds the ${CLINICAL_CONFIG.documentRules.maxFileSizeMB} MB limit.` });
      return;
    }

    setUploadingDocId(docType);
    setUploadNotice({ type: 'info', text: `Validating credentials for ${docType.replace(/_/g, ' ')}...` });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      formData.append('consent_agreed', dpdpAgreed);

      const res = await Api.uploadTherapistDocument(formData);
      if (res.success) {
        setUploadNotice({
          type: 'success',
          text: `${docType.replace(/_/g, ' ').toUpperCase()} verified successfully (${res.ai_confidence || 98}% match).`
        });
        setDocFiles(prev => ({ ...prev, [docType]: null }));
        loadProfileAndDocs();
      } else {
        setUploadNotice({ type: 'error', text: res.message || 'Upload failed.' });
      }
    } catch (err) {
      setUploadNotice({ type: 'error', text: 'Network error during upload.' });
    } finally {
      setUploadingDocId(null);
    }
  };

  // Upload all selected documents in batch and verify
  const handleUploadAllDocs = async () => {
    const typesToUpload = Object.keys(docFiles).filter(k => docFiles[k]);
    if (typesToUpload.length === 0) {
      setUploadNotice({ type: 'error', text: 'Please select files on the document cards before uploading.' });
      return;
    }

    setBatchUploading(true);
    setUploadNotice({ type: 'info', text: `Validating and vaulting ${typesToUpload.length} documents...` });

    try {
      let count = 0;
      for (const docType of typesToUpload) {
        const file = docFiles[docType];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_type', docType);
        formData.append('consent_agreed', dpdpAgreed);

        const res = await Api.uploadTherapistDocument(formData);
        if (res.success) count++;
      }

      setUploadNotice({
        type: 'success',
        text: `Successfully vaulted and verified ${count} documents. Provisional consultation clearance active.`
      });
      setDocFiles({});
      loadProfileAndDocs();
    } catch (err) {
      setUploadNotice({ type: 'error', text: 'Error during batch upload.' });
    } finally {
      setBatchUploading(false);
    }
  };

  // Upload document handler (classic single dropdown fallback)
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    setUploadNotice({ type: '', text: '' });

    if (!selectedFile) {
      setUploadNotice({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    if (selectedFile.size > CLINICAL_CONFIG.documentRules.maxFileSizeBytes) {
      setUploadNotice({ type: 'error', text: `File size exceeds the ${CLINICAL_CONFIG.documentRules.maxFileSizeMB} MB limit.` });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('doc_type', selectedDocType);
    formData.append('consent_agreed', dpdpAgreed);

    setIsUploading(true);
    const res = await Api.uploadTherapistDocument(formData);
    setIsUploading(false);

    if (res.success) {
      setUploadNotice({ type: 'success', text: 'Document securely uploaded and vaulted.' });
      setSelectedFile(null);
      loadProfileAndDocs();
      setTimeout(() => setUploadNotice({ type: '', text: '' }), 4000);
    } else {
      setUploadNotice({ type: 'error', text: res.message || 'Upload failed.' });
    }
  };

  // Delete document handler
  const handleDeleteDoc = async (docId) => {
    const ok = window.confirm('Are you sure you want to remove this document?');
    if (!ok) return;

    const res = await Api.deleteTherapistDocument(docId);
    if (res.success) {
      loadProfileAndDocs();
    } else {
      alert(res.message || 'Could not delete document.');
    }
  };

  // Submit dossier for review
  const handleSubmitDossier = async () => {
    setDossierNotice({ type: '', text: '' });
    const res = await Api.submitTherapistDossier();
    if (res.success) {
      setDossierNotice({ type: 'success', text: res.message });
      setVerificationStatus('under_review');
      loadProfileAndDocs();
    } else {
      setDossierNotice({ type: 'error', text: res.message });
    }
  };

  // Download document securely via signed URL
  const handleDownloadDoc = async (docId) => {
    const res = await Api.getSignedDocumentUrl(docId);
    if (res.success && res.downloadUrl) {
      window.open(res.downloadUrl, '_blank');
    } else {
      alert(res.message || 'Could not generate download link.');
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaveNotice('Saving changes...');
    const res = await Api.updateTherapistProfile({
      title: profileTitle,
      bio: profileBio,
      consultation_fee: profileFee,
      years_of_experience: profileExp
    });
    if (res.success) {
      setProfileSaveNotice('Profile updated successfully.');
      if (res.verification_status) setVerificationStatus(res.verification_status);
      setTimeout(() => setProfileSaveNotice(''), 3500);
      loadProfileAndDocs();
    } else {
      setProfileSaveNotice(res.message || 'Failed to update profile.');
    }
  };

  const therapist = profileData
    ? {
        name: profileData?.full_name || user?.name || 'Licensed Clinician',
        title: profileData.title || 'Licensed Clinical Psychologist',
        license: profileData.license_number || 'RCI-CR-28491'
      }
    : ClinicalConsentService.getDefaultTherapist();

  const { scopes } = consent;

  return (
    <div className="therapist-portal-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── CLINICIAN PRACTICE STATION HEADER ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#2b5f7d' }}>
              MindCare Clinical Workspace
            </span>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '4px', marginBottom: '4px' }}>
              {therapist.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {therapist.title} • ID: <code>{user?.public_id || 'THR-DEMO01'}</code> • Licence: <code>{therapist.license}</code>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleToggleAvailability}
              className="btn-ghost"
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '100px',
                border: isOnline ? '1px solid #52b788' : '1px solid #ef4444',
                color: isOnline ? '#2d6a4f' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#52b788' : '#ef4444'
              }}></span>
              {isOnline ? 'Online (Accepting Calls)' : 'Offline (Unavailable)'}
            </button>

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

        {/* ── TAB NAVIGATION ── */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.04)', padding: '4px', borderRadius: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'overview' ? '#ffffff' : 'transparent',
              fontWeight: activeTab === 'overview' ? 700 : 500,
              color: activeTab === 'overview' ? 'var(--primary-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              boxShadow: activeTab === 'overview' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Workspace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'documents' ? '#ffffff' : 'transparent',
              fontWeight: activeTab === 'documents' ? 700 : 500,
              color: activeTab === 'documents' ? 'var(--primary-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              boxShadow: activeTab === 'documents' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Document Vault ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'profile' ? '#ffffff' : 'transparent',
              fontWeight: activeTab === 'profile' ? 700 : 500,
              color: activeTab === 'profile' ? 'var(--primary-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              boxShadow: activeTab === 'profile' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Profile & Practice
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'schedule' ? '#ffffff' : 'transparent',
              fontWeight: activeTab === 'schedule' ? 700 : 500,
              color: activeTab === 'schedule' ? 'var(--primary-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              boxShadow: activeTab === 'schedule' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Schedule & Availability
          </button>
        </div>

        {/* ── TAB 1: WORKSPACE / OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            {/* Non-Approved Notice for Clinical Workspace */}
            {verificationStatus !== 'approved' && (
              <div className="glass-card" style={{
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '28px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Clinical Features Locked During Verification
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Publishing availability, client session requests, live WebRTC video rooms, and collaborative treatment plans are exclusively enabled for verified clinicians. You can upload credentials in the <strong>Document Vault</strong> tab.
                  </div>
                </div>
              </div>
            )}

            {/* Clinical Sessions Section */}

                {/* Session Requests & Clinical State Machine Pipeline */}
                <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                        Assigned Clinical Sessions ({assignedSessions.length})
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        Directly assigned client consultation requests under clinical coordination
                      </p>
                    </div>
                    {actionNotice && (
                      <span style={{ fontSize: '0.82rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                        {actionNotice}
                      </span>
                    )}
                  </div>

                  {assignedSessions.length === 0 ? (
                    <div style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border-subtle)',
                    margin: '12px 0'
                  }}>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 600 }}>
                      No Clinical Sessions Assigned Yet
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                      When a client completes their wellness assessment and books a consultation with you, their session request and clinical intake report will appear here automatically.
                    </p>
                  </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {assignedSessions.map(session => {
                        const isAssigned = session.status === 'assigned';
                        const isConfirmed = session.status === 'confirmed';
                        const isAccepted = session.status === 'therapist_accepted';
                        const isDeclined = session.status === 'therapist_declined';

                        const statusColors = {
                          assigned: { bg: 'rgba(246, 189, 96, 0.18)', color: '#b07d3b', label: 'Assigned (Action Required)' },
                          therapist_accepted: { bg: 'rgba(59, 130, 246, 0.18)', color: '#2563eb', label: 'Accepted (Awaiting Confirmation)' },
                          confirmed: { bg: 'rgba(82, 183, 136, 0.2)', color: 'var(--primary-dark)', label: 'Confirmed (Ready for Room)' },
                          therapist_declined: { bg: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', label: 'Declined' },
                          completed: { bg: 'rgba(107, 114, 128, 0.15)', color: '#4b5563', label: 'Completed' }
                        };
                        const badge = statusColors[session.status] || { bg: 'var(--bg-glass)', color: 'var(--text-secondary)', label: session.status };

                        return (
                          <div
                            key={session.id}
                            style={{
                              background: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '16px',
                              padding: '18px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <div style={{ flex: 1, minWidth: '260px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {session.clientName || 'Client'}
                                </span>
                                {session.clientAge && (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Age: {session.clientAge}
                                  </span>
                                )}
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 10px',
                                  borderRadius: '100px',
                                  background: badge.bg,
                                  color: badge.color
                                }}>
                                  {badge.label}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.82rem', color: 'var(--primary-dark)', marginTop: '2px' }}>
                                Mode: <strong>{(session.mode || 'video').toUpperCase()}</strong> • Duration: {session.slot_duration_minutes || 45} min • Slot: {session.preferred_slot ? new Date(session.preferred_slot).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : session.preferredWindow}
                              </div>

                              {session.proposed_slot && (
                                <div style={{ fontSize: '0.78rem', color: '#2563eb', marginTop: '2px' }}>
                                  Proposed Slot: {new Date(session.proposed_slot).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                              )}

                              {/* Confidential Note (Protected by Consent) */}
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                {session.consent_share_note ? (
                                  session.client_note ? (
                                    <span>Member Note: "<em>{session.client_note}</em>"</span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>No introductory note provided.</span>
                                  )
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    Member note private (explicit sharing consent not provided)
                                  </span>
                                )}
                              </div>

                              {session.decline_reason && (
                                <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px' }}>
                                  Decline reason: {session.decline_reason} {session.decline_note ? `("${session.decline_note}")` : ''}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedAssessmentModal(session)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                title="View Client Clinical Assessment & Therapy Analysis"
                              >
                                Client Intake Report
                              </button>

                              {isAssigned && (
                                <>
                                  <button
                                    onClick={() => handleTherapistAction(session.id, 'accept')}
                                    className="btn-primary"
                                    style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                                  >
                                    Accept Session
                                  </button>
                                  <button
                                    onClick={() => setDeclineModalSession(session)}
                                    className="btn-ghost"
                                    style={{ padding: '6px 14px', fontSize: '0.78rem', color: '#dc2626' }}
                                  >
                                    Decline...
                                  </button>
                                  <button
                                    onClick={() => {
                                      setProposeModalSession(session);
                                      setProposedSlotTime(session.preferred_slot ? session.preferred_slot.slice(0, 16) : '');
                                    }}
                                    className="btn-ghost"
                                    style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                                  >
                                    ⏱ Propose Time
                                  </button>
                                </>
                              )}

                              {isConfirmed && (
                                <button
                                  onClick={() => handleStartCall(session)}
                                  className="btn-primary"
                                  disabled={verificationStatus !== 'approved'}
                                  style={{ padding: '6px 16px', fontSize: '0.78rem' }}
                                >
                                  Join WebRTC Room
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
          </>
        )}

        {/* ── TAB 2: CREDENTIALS & DOCUMENT VAULT (Part 3) ── */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Progress & Verification Summary */}
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Clinical Credential Vault
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Upload official proof of identity and clinical licences. Stored in encrypted private storage behind DPDP data protection norms.
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    {completionPercentage}%
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dossier Completeness</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '100px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{
                  height: '100%',
                  width: `${completionPercentage}%`,
                  backgroundColor: completionPercentage >= 100 ? '#52b788' : '#d97706',
                  borderRadius: '100px'
                }} />
              </div>

              {/* Missing Requirements List */}
              {missingDocs.length > 0 && (
                <div style={{ padding: '14px 18px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>
                    Missing Required Documents ({missingDocs.length}):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {missingDocs.map(mKey => (
                      <li key={mKey}>
                        <strong>{CLINICAL_CONFIG.documentRules.types[mKey]?.title || mKey}</strong> — {CLINICAL_CONFIG.documentRules.types[mKey]?.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Multi-Section Credential Vault with AI Verification */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Credential Documents & Verification Vault
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Upload each of your required clinical documents below. Our Clinical AI engine instantly verifies document structure, council credentials, and security markers to grant provisional consultation clearance.
                  </p>
                </div>
              </div>

              {/* 5 Distinct Document Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {DOCUMENT_SECTIONS.map((sec) => {
                  const existingDoc = documents.find(d => d.doc_type === sec.id);
                  const isSelected = Boolean(docFiles[sec.id]);
                  const isCardUploading = uploadingDocId === sec.id;

                  return (
                    <div
                      key={sec.id}
                      className="glass-card"
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: existingDoc
                          ? '2px solid rgba(82, 183, 136, 0.5)'
                          : isSelected
                          ? '2px solid #2b5f7d'
                          : sec.required
                          ? '1.5px dashed rgba(239, 68, 68, 0.4)'
                          : '1px solid rgba(0,0,0,0.08)',
                        backgroundColor: existingDoc
                          ? 'rgba(82, 183, 136, 0.05)'
                          : isSelected
                          ? 'rgba(43, 95, 125, 0.04)'
                          : 'var(--bg-glass)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {sec.title}
                          </h4>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '100px',
                            backgroundColor: sec.required ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0,0,0,0.06)',
                            color: sec.required ? '#dc2626' : 'var(--text-muted)'
                          }}>
                            {sec.required ? 'REQUIRED' : 'OPTIONAL'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                          {sec.desc}
                        </p>

                        {existingDoc ? (
                          <div style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(82, 183, 136, 0.12)',
                            border: '1px solid rgba(82, 183, 136, 0.3)',
                            marginBottom: '14px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '0.78rem', color: '#2d6a4f' }}>
                                Validated ({existingDoc.ai_confidence || 98}% match)
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                              {existingDoc.original_filename} ({(existingDoc.file_size / (1024 * 1024)).toFixed(2)} MB)
                            </div>
                            {existingDoc.ai_notes && (
                              <div style={{ fontSize: '0.72rem', color: '#2b5f7d', marginTop: '4px' }}>
                                {existingDoc.ai_notes.replace(/\s*/i, '')}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        {/* File selection input */}
                        <div style={{ marginBottom: '10px' }}>
                          <label
                            htmlFor={`file-input-${sec.id}`}
                            style={{
                              display: 'block',
                              textAlign: 'center',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              border: '1px dashed rgba(43, 95, 125, 0.3)',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              backgroundColor: docFiles[sec.id] ? 'rgba(82, 183, 136, 0.1)' : 'rgba(0,0,0,0.02)',
                              color: docFiles[sec.id] ? '#2d6a4f' : 'var(--text-secondary)'
                            }}
                          >
                            {docFiles[sec.id]
                              ? `${docFiles[sec.id].name} (${(docFiles[sec.id].size / (1024*1024)).toFixed(2)} MB)`
                              : existingDoc
                              ? 'Replace File'
                              : 'Select File (PDF, JPG, PNG)'}
                          </label>
                          <input
                            id={`file-input-${sec.id}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setDocFiles(prev => ({ ...prev, [sec.id]: f }));
                            }}
                          />
                        </div>

                        {/* Actions for this individual card */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {docFiles[sec.id] && (
                            <button
                              type="button"
                              onClick={() => handleUploadSingleDoc(sec.id)}
                              disabled={isCardUploading}
                              className="btn-primary"
                              style={{ flex: 1, padding: '7px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
                            >
                              {isCardUploading ? 'Verifying...' : 'Upload & Validate'}
                            </button>
                          )}
                          {existingDoc && (
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(existingDoc.id)}
                              className="btn-ghost"
                              style={{ flex: docFiles[sec.id] ? undefined : 1, padding: '6px 10px', fontSize: '0.76rem' }}
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DPDP Consent & Batch Upload Bar */}
              <div className="glass-card" style={{ padding: '18px 22px', borderRadius: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '14px'
                }}>
                  <input
                    type="checkbox"
                    id="batchDpdpConsent"
                    checked={dpdpAgreed}
                    onChange={(e) => setDpdpAgreed(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <label htmlFor="batchDpdpConsent" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {CLINICAL_CONFIG.consentNotice}
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleUploadAllDocs}
                    disabled={batchUploading || Object.keys(docFiles).filter(k => docFiles[k]).length === 0}
                    className="btn-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: '0.86rem',
                      borderRadius: '100px',
                      opacity: Object.keys(docFiles).filter(k => docFiles[k]).length === 0 ? 0.6 : 1
                    }}
                  >
                    {batchUploading
                      ? 'Processing Credential Validation...'
                      : `Upload All Selected Files & Validate (${Object.keys(docFiles).filter(k => docFiles[k]).length} selected)`}
                  </button>

                  {uploadNotice.text && (
                    <span style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: uploadNotice.type === 'success' ? '#2d6a4f' : uploadNotice.type === 'info' ? '#2b5f7d' : '#dc2626'
                    }}>
                      {uploadNotice.text}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Uploaded Credentials ({documents.length})
                </h3>

                <button
                  type="button"
                  onClick={handleSubmitDossier}
                  disabled={missingDocs.length > 0 || verificationStatus === 'under_review' || verificationStatus === 'approved'}
                  className="btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontSize: '0.82rem',
                    borderRadius: '100px',
                    opacity: (missingDocs.length > 0 || verificationStatus === 'under_review' || verificationStatus === 'approved') ? 0.5 : 1
                  }}
                  title={missingDocs.length > 0 ? 'Upload all required documents to submit' : 'Submit for review'}
                >
                  {verificationStatus === 'under_review' ? ' Dossier Under Review' :
                   verificationStatus === 'approved' ? ' Dossier Approved' :
                   'Submit Dossier for Clinical Review →'}
                </button>
              </div>

              {dossierNotice.text && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  backgroundColor: dossierNotice.type === 'success' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: dossierNotice.type === 'success' ? 'var(--primary-dark)' : '#b91c1c'
                }}>
                  {dossierNotice.text}
                </div>
              )}

              {documents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No documents uploaded yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px' }}>Type</th>
                        <th style={{ padding: '10px' }}>Filename</th>
                        <th style={{ padding: '10px' }}>Size</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Uploaded</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map(doc => {
                        const typeInfo = CLINICAL_CONFIG.documentRules.types[doc.doc_type] || {};
                        return (
                          <tr key={doc.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {typeInfo.title || doc.doc_type}
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                              <div style={{ fontWeight: 600 }}>{doc.original_filename}</div>
                              {doc.ai_notes && (
                                <div style={{ fontSize: '0.72rem', color: '#2b5f7d', fontStyle: 'italic', marginTop: '2px' }}>
                                   {doc.ai_notes}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                              {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                {doc.ai_verified && (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '100px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    backgroundColor: 'rgba(82, 183, 136, 0.2)',
                                    color: '#2d6a4f'
                                  }}>
                                    System Validated ({doc.ai_confidence || 98}%)
                                  </span>
                                )}
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '100px',
                                  fontSize: '0.70rem',
                                  fontWeight: 700,
                                  backgroundColor:
                                    doc.status === 'approved' || doc.status === 'verified' ? 'rgba(82, 183, 136, 0.15)' :
                                    doc.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' :
                                    'rgba(245, 158, 11, 0.15)',
                                  color:
                                    doc.status === 'approved' || doc.status === 'verified' ? 'var(--primary-dark)' :
                                    doc.status === 'rejected' ? '#b91c1c' :
                                    '#b45309'
                                }}>
                                  {doc.status.toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDoc(doc.id)}
                                  className="btn-ghost"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  View ↗
                                </button>
                                {doc.status !== 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDoc(doc.id)}
                                    className="btn-ghost"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#b91c1c' }}
                                  >
                                    
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: PROFILE & PRACTICE DETAILS ── */}
        {activeTab === 'profile' && (
          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px' }}>
              Practice Profile & Credentials
            </h2>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Professional Title
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={profileTitle}
                    onChange={(e) => setProfileTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    className="input-field"
                    value={profileExp}
                    onChange={(e) => setProfileExp(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="input-field"
                    value={profileFee}
                    onChange={(e) => setProfileFee(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Practice Bio & Therapeutic Approach
                </label>
                <textarea
                  className="input-field"
                  rows="4"
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Describe your therapeutic orientation, experience with young adults, and focus areas..."
                />
              </div>

              {verificationStatus === 'approved' && (
                <div style={{ fontSize: '0.78rem', color: '#b45309', fontStyle: 'italic' }}>
                  Note: Modifying licensing or primary clinical credentials will automatically re-queue your account for administrative re-verification.
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button type="submit" className="btn-primary" style={{ padding: '10px 28px' }}>
                  Save Profile Changes
                </button>
                {profileSaveNotice && (
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                    {profileSaveNotice}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 4: SCHEDULE & AVAILABILITY (Part 5) ── */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Live Availability Heartbeat Card */}
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    🟢 "Available Now" Heartbeat Broadcast
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Members see clinicians marked "Available Now" if a heartbeat was broadcast in the last 60 seconds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleHeartbeatPing}
                  className="btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.84rem' }}
                >
                  Send Heartbeat (Online for 60s)
                </button>
              </div>
              {availabilityMessage && (
                <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                   {availabilityMessage}
                </div>
              )}
            </div>

            {/* Weekly Schedule & Slots Configuration */}
            <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
              <div style={{ marginBottom: '22px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Weekly Working Hours & Slot Configuration
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Define recurring consultation windows. Stored with UTC and <strong>{schedule.timezone || 'Asia/Kolkata'}</strong> reference.
                </p>
              </div>

              {scheduleNotice.text && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: scheduleNotice.type === 'success' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                  color: scheduleNotice.type === 'success' ? 'var(--primary-dark)' : '#dc2626',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '20px'
                }}>
                  {scheduleNotice.type === 'success' ? '' : ''} {scheduleNotice.text}
                </div>
              )}

              <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Slot Duration
                    </label>
                    <select
                      className="input-field"
                      value={schedule.slot_duration_minutes || 45}
                      onChange={(e) => setSchedule({ ...schedule, slot_duration_minutes: Number(e.target.value) })}
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes (Default)</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Buffer Between Consultations
                    </label>
                    <select
                      className="input-field"
                      value={schedule.buffer_minutes || 10}
                      onChange={(e) => setSchedule({ ...schedule, buffer_minutes: Number(e.target.value) })}
                    >
                      <option value={0}>0 Minutes (Back to Back)</option>
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes (Recommended)</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Clinical Timezone
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={schedule.timezone || 'Asia/Kolkata'}
                      readOnly
                      style={{ background: 'var(--bg-glass)', opacity: 0.8 }}
                    />
                  </div>
                </div>

                {/* Day-by-Day Slots */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Daily Hours (24-Hour Format: HH:mm)
                  </label>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const slots = schedule.weekly_schedule?.[day] || [];
                    const isAvailable = slots.length > 0;
                    const firstSlot = slots[0] || { start: '10:00', end: '17:00' };

                    return (
                      <div
                        key={day}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 18px',
                          borderRadius: '12px',
                          background: isAvailable ? 'var(--bg-surface-elevated)' : 'rgba(0,0,0,0.02)',
                          border: '1px solid var(--border-subtle)',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '140px' }}>
                          <input
                            type="checkbox"
                            checked={isAvailable}
                            onChange={(e) => {
                              const updatedWeekly = { ...(schedule.weekly_schedule || {}) };
                              if (e.target.checked) {
                                updatedWeekly[day] = [{ start: '10:00', end: '17:00' }];
                              } else {
                                updatedWeekly[day] = [];
                              }
                              setSchedule({ ...schedule, weekly_schedule: updatedWeekly });
                            }}
                            id={`day_${day}`}
                          />
                          <label htmlFor={`day_${day}`} style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                            {day}
                          </label>
                        </div>

                        {isAvailable ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>From:</span>
                            <input
                              type="time"
                              className="input-field"
                              style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem' }}
                              value={firstSlot.start}
                              onChange={(e) => {
                                const updatedWeekly = { ...(schedule.weekly_schedule || {}) };
                                updatedWeekly[day] = [{ start: e.target.value, end: firstSlot.end }];
                                setSchedule({ ...schedule, weekly_schedule: updatedWeekly });
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>To:</span>
                            <input
                              type="time"
                              className="input-field"
                              style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem' }}
                              value={firstSlot.end}
                              onChange={(e) => {
                                const updatedWeekly = { ...(schedule.weekly_schedule || {}) };
                                updatedWeekly[day] = [{ start: firstSlot.start, end: e.target.value }];
                                setSchedule({ ...schedule, weekly_schedule: updatedWeekly });
                              }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Off / No consultation slots
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Leave Dates Management */}
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Scheduled Leave & Unavailable Dates
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Members cannot request sessions on your planned leave dates.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      className="input-field"
                      style={{ maxWidth: '220px' }}
                      value={newLeaveDate}
                      onChange={(e) => setNewLeaveDate(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newLeaveDate && !schedule.leave_dates?.includes(newLeaveDate)) {
                          setSchedule({
                            ...schedule,
                            leave_dates: [...(schedule.leave_dates || []), newLeaveDate].sort()
                          });
                          setNewLeaveDate('');
                        }
                      }}
                      className="btn-ghost"
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      + Add Leave Date
                    </button>
                  </div>

                  {schedule.leave_dates && schedule.leave_dates.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {schedule.leave_dates.map(dateStr => (
                        <span
                          key={dateStr}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '100px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#b91c1c',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                           {dateStr}
                          <button
                            type="button"
                            onClick={() => {
                              setSchedule({
                                ...schedule,
                                leave_dates: schedule.leave_dates.filter(d => d !== dateStr)
                              });
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontWeight: 700 }}
                          >
                            
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '12px' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 32px' }}>
                    Save Availability Schedule →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Decline Reason Modal */}
      {declineModalSession && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 200
        }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px', backgroundColor: '#fff', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Decline Session Request
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Select a clinical reason for declining this request. Clinical coordination will be notified immediately for client reassignment.
            </p>

            <div className="input-group">
              <label className="input-label">Decline Reason</label>
              <select
                className="input-field"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              >
                <option value="schedule_conflict">Schedule Conflict / Overbooked</option>
                <option value="out_of_specialization">Case Out of Clinical Specialization</option>
                <option value="capacity_limit">Current Clinical Caseload at Full Capacity</option>
                <option value="personal_leave">On Leave / Time Off</option>
                <option value="other">Other Clinical or Operational Reason</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Confidential Note for Admin (Optional)</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Provide clinical context for reassignment..."
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  handleTherapistAction(declineModalSession.id, 'decline', {
                    reason: declineReason,
                    decline_note: declineNote
                  });
                  setDeclineModalSession(null);
                  setDeclineNote('');
                }}
                className="btn-primary"
                style={{ flex: 1, backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
              >
                Confirm Decline
              </button>
              <button
                type="button"
                onClick={() => setDeclineModalSession(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose New Slot Modal */}
      {proposeModalSession && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 200
        }}>
          <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '28px', backgroundColor: '#fff', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Propose New Appointment Time
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Propose an alternative time window for this consultation:
            </p>

            <div className="input-group">
              <label className="input-label">Proposed Date & Time (IST)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={proposedSlotTime}
                onChange={(e) => setProposedSlotTime(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  if (!proposedSlotTime) return;
                  handleTherapistAction(proposeModalSession.id, 'propose_new_slot', {
                    proposed_slot: new Date(proposedSlotTime).toISOString()
                  });
                  setProposeModalSession(null);
                }}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Submit Proposed Time
              </button>
              <button
                type="button"
                onClick={() => setProposeModalSession(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISMISSIBLE PROFILE-COMPLETION POPUP (Part 3) ── */}
      {completionPopupOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div className="glass-card" style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={handleDismissPopup}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                border: 'none',
                background: 'transparent',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
              title="Close popup (never blocks dashboard)"
            >
              
            </button>

            
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Complete Your Clinician Profile
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Your profile is <strong>{completionPercentage}% complete</strong>. To activate client calls, instant online availability, and treatment plans, please upload your verification credentials.
            </p>

            {/* Missing items pill badges */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Pending Verification Items:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {missingDocs.map(item => (
                  <span
                    key={item}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#b91c1c'
                    }}
                  >
                    • {CLINICAL_CONFIG.documentRules.types[item]?.title || item}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleDismissPopup}
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              >
                Remind me later
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  handleDismissPopup();
                  setActiveTab('documents');
                }}
                style={{ padding: '10px 22px', fontSize: '0.85rem' }}
              >
                Upload Documents Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Assessment & Clinical Intake Report Modal */}
      {selectedAssessmentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '88vh',
            overflowY: 'auto',
            padding: '28px',
            background: 'var(--bg-surface-elevated, #ffffff)',
            borderRadius: '20px',
            border: '1.5px solid var(--border-subtle, #e2e8f0)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-dark)', letterSpacing: '0.04em' }}>
                  Client Clinical Intake Report
                </span>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', margin: '4px 0 2px' }}>
                  {selectedAssessmentModal.clientName || 'Sanctuary Client'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ID: <code>{selectedAssessmentModal.clientPublicId}</code> {selectedAssessmentModal.clientAge ? `• Age: ${selectedAssessmentModal.clientAge}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessmentModal(null)}
                className="btn-ghost"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                ✕ Close
              </button>
            </div>

            {selectedAssessmentModal.latest_assessment ? (
              <div>
                {/* Score & Band Header */}
                <div style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: selectedAssessmentModal.latest_assessment.band === 'high' ? 'rgba(220, 53, 69, 0.1)' : (selectedAssessmentModal.latest_assessment.band === 'moderate' ? 'rgba(246, 189, 96, 0.15)' : 'rgba(82, 183, 136, 0.15)'),
                  border: `1px solid ${selectedAssessmentModal.latest_assessment.band === 'high' ? 'rgba(220, 53, 69, 0.3)' : (selectedAssessmentModal.latest_assessment.band === 'moderate' ? 'rgba(246, 189, 96, 0.3)' : 'rgba(82, 183, 136, 0.3)')}`,
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Onboarding Screener Classification
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedAssessmentModal.latest_assessment.band ? selectedAssessmentModal.latest_assessment.band.toUpperCase() : 'MODERATE'} BAND
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--text-primary)'
                  }}>
                    Score: {selectedAssessmentModal.latest_assessment.total_score} / 24
                  </div>
                </div>

                {/* Recommended Therapy Modality */}
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid rgba(82, 183, 136, 0.35)',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-dark)', letterSpacing: '0.04em' }}>
                    Recommended Therapy Modality
                  </span>
                  <h4 style={{ margin: '4px 0 2px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedAssessmentModal.latest_assessment.recommended_therapy || selectedAssessmentModal.latest_assessment.ai_analysis?.recommendedTherapy || 'Cognitive Behavioral Therapy (CBT) & Somatic Regulation'}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Target Specialization: {selectedAssessmentModal.latest_assessment.recommended_specialist || selectedAssessmentModal.latest_assessment.ai_analysis?.recommendedSpecialist || 'Licensed Clinical Psychologist'}
                  </div>
                </div>

                {/* Clinical Summary */}
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface, #f8faf9)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Clinical Presentation Analysis
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {selectedAssessmentModal.latest_assessment.ai_analysis?.clinicalSummary || selectedAssessmentModal.latest_assessment.clinical_notes || 'Client reports noticeable mental fatigue and nervous tension requiring structured cognitive reframing and parasympathetic down-regulation.'}
                  </p>
                </div>

                {/* Recommended Focus Areas */}
                {selectedAssessmentModal.latest_assessment.ai_analysis?.focusAreas && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Recommended Session Focus Areas:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedAssessmentModal.latest_assessment.ai_analysis.focusAreas.map((fa, i) => (
                        <span key={i} style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(82, 183, 136, 0.12)',
                          color: 'var(--primary-dark)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          border: '1px solid rgba(82, 183, 136, 0.25)'
                        }}>
                          • {fa}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Therapist Briefing / Intake Guidance */}
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  borderLeft: '4px solid var(--primary)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-dark)', marginBottom: '4px' }}>
                    Therapist Workstation Clinical Guidance
                  </div>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: '1.55' }}>
                    {selectedAssessmentModal.latest_assessment.ai_analysis?.therapistIntakeNotes || selectedAssessmentModal.latest_assessment.clinical_notes || 'Prioritize rapport establishment and somatic calming before exploring deeper cognitive triggers. Validate presenting stress without clinical overwhelm.'}
                  </p>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Assessment completed: {new Date(selectedAssessmentModal.latest_assessment.completed_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.94rem', fontWeight: 600 }}>
                  No Onboarding Assessment on Record
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  This member requested a consultation without completing the preliminary questionnaire. You can conduct a direct intake in the consultation room.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WebRTC Live Session Modal for Therapist */}
      {liveSessionOpen && activeClientSession && (
        <ClinicalLiveRoom
          isOpen={liveSessionOpen}
          onClose={() => setLiveSessionOpen(false)}
          roomId={`consult_${activeClientSession.id}`}
          initialMode="video"
          peerName={activeClientSession.name || 'Client'}
          peerRole="Client"
        />
      )}
    </div>
  );
}
