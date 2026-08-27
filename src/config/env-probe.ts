export const probe = { keys: Object.keys((import.meta as any).env || {}), dev: (import.meta as any).env?.VITE_DEV_MODE };
