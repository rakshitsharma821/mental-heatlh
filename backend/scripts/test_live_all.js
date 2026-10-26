// Verification of Registration OTP, Logins, and AI Document Verification
async function run() {
  console.log('--- 1. Testing Registration Email OTP ---');
  const otpRes = await fetch('http://localhost:5000/api/auth/send-registration-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test.verify@mindcare.test' })
  });
  const otpData = await otpRes.json();
  console.log('Send OTP response:', otpData);

  console.log('\n--- 2. Testing 3 Canonical Demo Logins ---');
  // Client login
  const cRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portal: 'member', identifier: 'MC-DEMO01', password: 'User@12345' })
  });
  const cData = await cRes.json();
  console.log('Client login:', cData.success, cData.user?.public_id, cData.user?.role);

  // Therapist login
  const tRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portal: 'therapist', identifier: 'THR-DEMO01', email: 'demo.therapist@mindcare.test', password: 'Therapist@12345' })
  });
  const tData = await tRes.json();
  console.log('Therapist login:', tData.success, tData.user?.public_id, tData.user?.role);

  // Admin login
  const aRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portal: 'admin', identifier: 'ADM-DEMO01', accessCode: 'ADM-CODE-DEMO1', password: 'Admin@12345' })
  });
  const aData = await aRes.json();
  console.log('Admin login:', aData.success, aData.user?.public_id, aData.user?.role);

  console.log('\n--- 3. Testing Therapist Document Upload with AI Verification ---');
  const formData = new FormData();
  formData.append('doc_type', 'govt_id');
  formData.append('consent_agreed', 'true');
  const pdfBlob = new Blob(['%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'], { type: 'application/pdf' });
  formData.append('file', pdfBlob, 'govt_id_proof.pdf');

  const uploadRes = await fetch('http://localhost:5000/api/clinical/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + tData.token
    },
    body: formData
  });
  const uploadData = await uploadRes.json();
  console.log('Document upload status:', uploadRes.status);
  console.log('AI Verification result:', uploadData);

  console.log('\n--- 4. Testing Admin Dossier Viewer with AI Badges ---');
  const dossierRes = await fetch(`http://localhost:5000/api/admin/therapists/${tData.user.id}/dossier`, {
    headers: { 'Authorization': 'Bearer ' + aData.token }
  });
  const dossierData = await dossierRes.json();
  console.log('Dossier documents count:', dossierData.documents?.length);
  console.log('First doc AI verification:', {
    doc_type: dossierData.documents?.[0]?.doc_type,
    ai_verified: dossierData.documents?.[0]?.ai_verified,
    ai_confidence: dossierData.documents?.[0]?.ai_confidence,
    ai_notes: dossierData.documents?.[0]?.ai_notes
  });

  console.log('\n--- 5. Testing Admin Temporary Hold (15 min pause) ---');
  const holdRes = await fetch(`http://localhost:5000/api/admin/therapists/${tData.user.id}/verification-decision`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + aData.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      decision: 'hold',
      duration_minutes: 15,
      reason: 'Administrative temporary check'
    })
  });
  const holdData = await holdRes.json();
  console.log('Hold response:', holdData);

  console.log('\n--- 6. Re-approving Therapist ---');
  const approveRes = await fetch(`http://localhost:5000/api/admin/therapists/${tData.user.id}/verification-decision`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + aData.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      decision: 'approve',
      licence_verified_externally: true,
      external_verification_notes: 'Verified against RCI official database.'
    })
  });
  const approveData = await approveRes.json();
  console.log('Approve response:', approveData);
}

run();
