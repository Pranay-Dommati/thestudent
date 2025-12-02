import posthog from 'posthog-js';
import axios from '../utils/axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// Minimal tracking service: initializes PostHog and forwards events to backend
class TrackingService {
  constructor() {
    this.initialized = false;
    this.sessionId = null;
    this.buffer = [];
    this.flushInterval = null;
  }

  init() {
    if (this.initialized) return;

    // Session id persisted per browser tab/session
    try {
      const key = 'tracking_session_id';
      const existing = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
      this.sessionId = existing || uuidv4();
      if (!existing && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, this.sessionId);
      }
    } catch (e) {
      this.sessionId = uuidv4();
    }

  const phKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_POSTHOG_KEY;
  const phHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

    // Route-aware analytics gating: avoid client-side analytics overhead on admin pages
    let isAdminRoute = false;
    try {
      const path = window?.location?.pathname || '';
      isAdminRoute = path.startsWith('/admin-p');
    } catch {}

    if (phKey) {
      const disableRecordingEnv = import.meta.env.VITE_POSTHOG_DISABLE_SESSION_RECORDING === 'true';
      // Disable session recording and autocapture on admin route to prevent long frames
      const disableRecording = disableRecordingEnv || isAdminRoute;
      const enableAutocapture = (import.meta.env.VITE_POSTHOG_AUTOCAPTURE !== 'false') && !isAdminRoute;
      posthog.init(phKey, {
        api_host: phHost,
        autocapture: enableAutocapture,
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: disableRecording,
        persistence: import.meta.env.VITE_POSTHOG_PERSISTENCE || 'localStorage',
        // Align with PostHog docs example; can be overridden via env
        defaults: import.meta.env.VITE_PUBLIC_POSTHOG_DEFAULTS || '2025-05-24',
      });
      // Make sure Session Replay starts when not disabled
      try { if (!disableRecording && typeof posthog.startSessionRecording === 'function') posthog.startSessionRecording(); } catch {}
      // Use our sessionId as the PostHog distinct_id to correlate replays with our admin analytics
      try {
        posthog.identify(this.sessionId, { session_id: this.sessionId });
      } catch (_) {
        // fallback: set as person property only
        try { posthog.identify(undefined, { session_id: this.sessionId }); } catch {}
      }
      // If we are on admin route, opt-out of capturing to further reduce overhead
      try { if (isAdminRoute && typeof posthog.opt_out_capturing === 'function') posthog.opt_out_capturing(); } catch {}
      this.initialized = true;
      logger.log('[Tracking] PostHog initialized');
    } else {
      logger.warn('[Tracking] VITE_POSTHOG_KEY not set; only backend logging will be used');
    }

    // Start periodic flush for buffered events
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  getSessionId() {
    if (!this.sessionId) {
      this.init();
    }
    return this.sessionId;
  }

  capture(eventType, properties = {}, options = {}) {
    const feature = options.feature || properties.feature || undefined;
    const success = options.success ?? true;
    const error_code = options.error_code;
    const latency_ms = options.latency_ms;
    const client_ts = new Date().toISOString();

    // Enrich with basic site context so we can distinguish localhost vs production
    let siteContext = {};
    try {
      const loc = window.location;
      siteContext = {
        site_host: loc.host,
        site_origin: loc.origin,
        site_path: loc.pathname,
      };
    } catch {}

    const props = { ...siteContext, ...properties };

    const event = {
      session_id: this.getSessionId(),
      event_type: eventType,
      feature,
      metadata: props,
      success,
      error_code,
      latency_ms,
      client_ts,
    };

    // Send to PostHog if available and not opted-out on admin route
    try {
      let isAdminRoute = false;
      try { isAdminRoute = (window?.location?.pathname || '').startsWith('/admin-p'); } catch {}
      if (posthog && !isAdminRoute) {
        posthog.capture(eventType, { ...props, session_id: event.session_id, feature, success, error_code, latency_ms });
      }
    } catch (e) {}

    // Buffer for backend bulk send
    this.buffer.push(event);
    if (this.buffer.length >= 10) this.flush();
  }

  async flush() {
    if (this.buffer.length === 0) return;
    const events = this.buffer.splice(0, this.buffer.length);
    try {
      await axios.post('/analytics/track-activity/bulk/', { events });
    } catch (e) {
      // Put back on failure (best-effort)
      this.buffer.unshift(...events);
    }
  }
}

const tracking = new TrackingService();
export default tracking;
