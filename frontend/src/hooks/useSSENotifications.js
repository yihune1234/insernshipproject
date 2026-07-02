import { useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../utils/constants';

const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_DELAY_MS = 60000;

/**
 * useSSENotifications
 *
 * Opens a Server-Sent Events connection to the issuer notifications stream.
 * Auto-reconnects with exponential back-off on disconnect/error.
 *
 * @param {object} options
 * @param {function} options.onNotification  — called with {type, unread_count, delta, latest?}
 * @param {function} options.onConnect       — called with initial {unread_count} on first connect
 * @param {boolean}  options.enabled         — set false to skip connecting (e.g. not logged-in)
 */
export function useSSENotifications({ onNotification, onConnect, enabled = true } = {}) {
  const esRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY_MS);
  const onNotificationRef = useRef(onNotification);
  const onConnectRef = useRef(onConnect);

  useEffect(() => { onNotificationRef.current = onNotification; }, [onNotification]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);

  const close = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;

    close();

    const token = localStorage.getItem('access_token') || '';
    if (!token) return;

    const base = API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/integration/notifications/stream/?token=${encodeURIComponent(token)}`;

    let es;
    try {
      es = new EventSource(url);
    } catch {
      return;
    }
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') {
          reconnectDelayRef.current = RECONNECT_DELAY_MS;
          onConnectRef.current?.(payload);
        } else if (payload.type === 'notification') {
          onNotificationRef.current?.(payload);
        }
      } catch { /* malformed — ignore */ }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;

      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);

      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, [enabled, close]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      close();
    }
    return close;
  }, [enabled, connect, close]);
}
