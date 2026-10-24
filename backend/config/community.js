// ============================================
// MindCare Sanctuary — Community Sanctuary Configuration
// ============================================

export const COMMUNITY_CONFIG = {
  // Feature flag: 1-on-1 peer matching is strictly OFF by default
  enablePeerMatching: process.env.ENABLE_PEER_MATCHING === 'true',

  setPeerMatching(enabled) {
    this.enablePeerMatching = Boolean(enabled);
  }
};
