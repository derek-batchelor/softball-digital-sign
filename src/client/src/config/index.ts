export const config = {
  // In production (Docker), use relative URLs to go through nginx
  // In development, use the direct server URL
  apiUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'),
  wsUrl: import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'),
} as const;
