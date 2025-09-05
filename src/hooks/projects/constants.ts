
// Using Supabase for all database operations
export const USE_TYPEORM = false;

// Check schedule intervals (in days)
export const CHECK_SCHEDULE_INTERVALS = {
  insuranceCheck: 1,
  delayCheck: 7,
  inspectionCheck: 1
} as const;

// Application settings
export const APP_SETTINGS = {
  theme: {
    primaryColor: 'adrar',
    secondaryColor: 'terracotta',
    accentColor: 'sandstone'
  },
  features: {
    typeorm: false,
    supabase: true
  }
};
