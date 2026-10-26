// ============================================
// MindCare — WebRTC Live Clinical Consultation Room
// Task 6: Video calls, voice calls, and live chat with Socket.io signaling
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SOCKET_SERVER_URL } from '../../config/appConfig';

export default function ClinicalLiveRoom({
  isOpen,
  onClose,
  roomId = 'sanctuary_session_default',
  initialMode = 'video', // 'video' | 'voice' | 'chat'
  peerName = 'Licensed Practitioner',
  peerRole = 'Licensed Clinical Psychologist'
}) {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState(initialMode);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(initialMode === 'voice' || initialMode === 'chat');
  const [mediaError, setMediaError] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Refs for WebRTC & Socket
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let localStream = null;

    async function initSession() {
      try {
        setConnectionStatus('connecting');

        // 1. Fetch ICE configuration (STUN/TURN) from backend
        const rtcData = await Api.getRtcConfig();
        const iceServers = rtcData?.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }];

        // 2. Setup RTCPeerConnection
        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        // Remote track handler
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnectionStatus('connected');
          }
        };

        // ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit('webrtc-signal', {
              signal: { candidate: event.candidate },
              mode: activeMode
            });
          }
        };

        // Connection state changes
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setConnectionStatus('connected');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setConnectionStatus('disconnected');
          }
        };

        // 3. Request Local Media Stream (if video or voice mode)
        if (activeMode !== 'chat' && navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: activeMode === 'video',
              audio: true
            });
            localStream = stream;
            localStreamRef.current = stream;

            if (localVideoRef.current && activeMode === 'video') {
              localVideoRef.current.srcObject = stream;
            }

            stream.getTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });
          } catch (deviceErr) {
            console.warn('Camera/mic access unavailable, falling back to chat mode:', deviceErr.message);
            setMediaError('Audio/Video hardware access paused. Switching to real-time clinical chat.');
            setActiveMode('chat');
          }
        }

        // 4. Connect to Socket.io signaling with JWT auth token
        const token = localStorage.getItem('mindcare_auth_token') || sessionStorage.getItem('mindcare_auth_token');
        const socket = io(SOCKET_SERVER_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 5000
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-room', {
            roomId,
            userId: user?.id || 'anon_client',
            userName: user?.name || 'Sanctuary Member',
            role: user?.role || 'client'
          });
        });

        // Strict clinical room gating error from server
        socket.on('room-error', (errData) => {
          setConnectionStatus('gated_error');
          setMediaError(errData?.message || 'Access to this clinical room is currently locked.');
        });

        // Peer joined -> initiate WebRTC offer
        socket.on('user-joined', async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc-signal', {
              signal: { sdp: pc.localDescription },
              mode: activeMode
            });
          } catch (e) {
            console.warn('Error creating WebRTC offer:', e);
          }
        });

        // Handle incoming WebRTC signals
        socket.on('webrtc-signal', async ({ signal }) => {
          try {
            if (signal.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              if (signal.sdp.type === 'offer') {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtc-signal', {
                  signal: { sdp: pc.localDescription },
                  mode: activeMode
                });
              }
            } else if (signal.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          } catch (sigErr) {
            console.warn('WebRTC signaling negotiation note:', sigErr.message);
          }
        });

        // Handle in-room live chat messages
        socket.on('clinical-chat-message', (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

        // Call ended by peer
        socket.on('call-ended', () => {
          setConnectionStatus('disconnected');
        });
      } catch (err) {
        console.error('Session initialization error:', err);
      }
    }

    initSession();

    return () => {
      isMounted = false;
      // Cleanup tracks & peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.emit('end-call', { roomId });
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, roomId, activeMode]);

  // Scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  if (!isOpen) return null;

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoDisabled(!isVideoDisabled);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit('clinical-chat-message', {
        roomId,
        message: { text: inputText.trim() }
      });
    }
    setInputText('');
  };

  const handleEndSession = () => {
    if (socketRef.current) {
      socketRef.current.emit('end-call', { roomId });
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      background: 'rgba(18, 30, 24, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1080px',
        height: '90vh',
        background: 'var(--bg-surface)',
        borderRadius: '24px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Top Room Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {peerName}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {peerRole} • E2E Encrypted WebRTC Session
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '100px',
              background: connectionStatus === 'connected' ? 'rgba(82, 183, 136, 0.2)' : 'rgba(246, 189, 96, 0.2)',
              color: connectionStatus === 'connected' ? 'var(--primary-dark)' : '#b07d3b',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connectionStatus === 'connected' ? 'var(--primary)' : '#b07d3b',
                display: 'inline-block'
              }} />
              {connectionStatus === 'connected' ? 'Live & Connected' : 'Waiting for Peer to Connect...'}
            </span>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="btn-ghost"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              title="Toggle In-Session Chat"
            >
               {isChatOpen ? 'Hide Chat' : 'Show Chat'}
            </button>
          </div>
        </div>

        {/* Locked / Gated Error Screen */}
        {connectionStatus === 'gated_error' ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}></div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Consultation Room Locked
            </h3>
            <p style={{ maxWidth: '480px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
              {mediaError || 'This private room is gated. Live consultation rooms open 15 minutes before confirmed sessions.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ padding: '10px 24px' }}
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => {
                  onClose();
                  const ariaTrigger = document.querySelector('.companion-trigger-btn');
                  if (ariaTrigger) ariaTrigger.click();
                }}
                className="btn-ghost"
                style={{ padding: '10px 20px' }}
              >
                 Connect with Aria (24/7 Companion)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Media Notice if devices unavailable */}
            {mediaError && (
              <div style={{
                background: 'rgba(246, 189, 96, 0.15)',
                borderBottom: '1px solid rgba(246, 189, 96, 0.3)',
                padding: '8px 24px',
                fontSize: '0.82rem',
                color: '#b07d3b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>ℹ</span>
                <span>{mediaError}</span>
              </div>
            )}

        {/* Center Main Stage (Video / Voice Stage + Chat Side Panel) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Audio / Video Canvas Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#142019',
            position: 'relative',
            padding: '20px'
          }}>
            {activeMode === 'video' ? (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#0d1510'
              }}>
                {/* Remote Video Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {connectionStatus !== 'connected' && (
                  <div style={{
                    position: 'absolute',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.75)',
                    padding: '24px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(6px)',
                    borderRadius: '16px'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}></div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Ready for Consultation</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                      Connecting audio & video stream with {peerName}...
                    </p>
                  </div>
                )}

                {/* Picture-in-picture local preview */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  width: '180px',
                  height: '120px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid rgba(82, 183, 136, 0.6)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  background: '#1b2c22'
                }}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {isVideoDisabled && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0, 0, 0, 0.7)',
                      fontSize: '0.75rem',
                      color: '#fff'
                    }}>
                      Camera Off
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Voice / Audio Consultation Calming Interface */
              <div style={{
                textAlign: 'center',
                color: '#fff',
                maxWidth: '420px',
                padding: '40px 24px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'rgba(82, 183, 136, 0.2)',
                  border: '2px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 16px',
                  boxShadow: connectionStatus === 'connected' ? '0 0 30px rgba(82, 183, 136, 0.4)' : 'none'
                }}>
                  
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{peerName}</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
                  {activeMode === 'voice' ? 'Direct Voice Audio Consultation' : 'Live Real-Time Clinical Chat'}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontStyle: 'italic' }}>
                  {connectionStatus === 'connected' ? '● Audio line active and encrypted' : 'Waiting for connection to stabilize...'}
                </div>
                {/* Hidden audio element for remote voice */}
                <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
              </div>
            )}
          </div>

          {/* Integrated Live Consultation Chat Panel */}
          {isChatOpen && (
            <div style={{
              width: '340px',
              borderLeft: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span></span>
                <span>In-Session Clinical Notes & Chat</span>
              </div>

              {/* Chat Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '40px' }}>
                     Session started. You can write thoughts, symptoms, or reflections directly to {peerName}.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          fontSize: '0.85rem',
                          background: isMe ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                          color: isMe ? '#fff' : 'var(--text-primary)',
                          border: isMe ? 'none' : '1px solid var(--border-subtle)',
                          boxShadow: 'var(--shadow-card)'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '2px', fontWeight: 600 }}>
                          {m.senderName} ({m.senderRole})
                        </div>
                        <div>{m.text}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                          {m.timestamp}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface-elevated)'
        }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveMode('video')}
              className={activeMode === 'video' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
               Video
            </button>
            <button
              onClick={() => setActiveMode('voice')}
              className={activeMode === 'voice' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
               Voice Only
            </button>
            <button
              onClick={() => setActiveMode('chat')}
              className={activeMode === 'chat' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
               Text Only
            </button>
          </div>

          {/* Media Toggles */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {activeMode !== 'chat' && (
              <>
                <button
                  onClick={toggleMic}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: isMuted ? 'rgba(220, 53, 69, 0.15)' : 'var(--bg-surface)',
                    color: isMuted ? '#dc3545' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  {isMuted ? ' Mic Muted' : ' Mic Active'}
                </button>

                {activeMode === 'video' && (
                  <button
                    onClick={toggleVideo}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      background: isVideoDisabled ? 'rgba(220, 53, 69, 0.15)' : 'var(--bg-surface)',
                      color: isVideoDisabled ? '#dc3545' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    {isVideoDisabled ? ' Camera Off' : ' Camera On'}
                  </button>
                )}
              </>
            )}

            <button
              onClick={handleEndSession}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700
              }}
            >
              End Session 
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
