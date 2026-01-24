export const config = {
  // Use VITE_API_URL if set, otherwise:
  // - In development: use localhost
  // - In production (Docker with nginx): use relative URL
  // - In production (Static Web Apps): should have VITE_API_URL set
  apiUrl: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : ''),
} as const;
