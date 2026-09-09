const SESSION_KEY = 'nexamart_demo_session_id';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    // Fallback for old browsers
    id = crypto.randomUUID ? crypto.randomUUID() : 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}