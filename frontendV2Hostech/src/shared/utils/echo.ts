import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

window.Pusher = Pusher;

/**
 * Lazy-initialized Laravel Echo instance.
 * Only creates the connection when VITE_REVERB_APP_KEY is configured.
 * This prevents "You must pass your app key" errors during development
 * when WebSocket is not yet set up.
 */
function createEchoInstance(): Echo<any> | null {
  const key = import.meta.env.VITE_REVERB_APP_KEY;

  if (!key) {
    console.warn('[Echo] VITE_REVERB_APP_KEY not set — WebSocket disabled.');
    return null;
  }

  return new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1',
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
  });
}

export const echo = createEchoInstance();
