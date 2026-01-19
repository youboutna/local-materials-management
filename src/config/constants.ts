// Configuration flags - can be controlled by environment variables
// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';
const isDevelopment = isBrowser ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') : false;

export const DEV_MODE =  isDevelopment||false;
export const CLIENT_ETRML = isBrowser && (window as any).__APP_CONFIG__?.CLIENT_ETRML === 'true' || false;

// Mock user configuration for development mode
export const DEV_USER = {
  id: (isBrowser && (window as any).__APP_CONFIG__?.DEV_USER_ID) || "00000000-0000-0000-0000-000000000001",
  email: (isBrowser && (window as any).__APP_CONFIG__?.DEV_USER_EMAIL) || "dev@example.com",
  user_metadata: {
    full_name: (isBrowser && (window as any).__APP_CONFIG__?.DEV_USER_NAME) || "Développeur Test",
    role: (isBrowser && (window as any).__APP_CONFIG__?.DEV_USER_ROLE) || "admin",
    phone: (isBrowser && (window as any).__APP_CONFIG__?.DEV_USER_PHONE) || "123456789",
    national_id: (isBrowser && (window as any).__APP_CONFIG__?.DEV_USER_NATIONAL_ID) || "DEV12345",
  },
};

// Development mode role configuration
export interface DevRoleOptions {
  role:
    | "admin"
    | "user"
    | "inspector"
    | "practitioner"
    | "insurance_company"
    | "material-manager"
    | "manager"
    | "director"
    | "agent"
    | "supplier";
  description: string;
}

// Default roles - can be extended via configuration
export const DEV_ROLES: DevRoleOptions[] = [
  { role: "admin", description: "Full system access" },
  { role: "inspector", description: "inspector access only" },
  { role: "practitioner", description: "Medical practitioner" },
  {
    role: "insurance_company",
    description: "Insurance company representative",
  },
  { role: "material-manager", description: "Materials management" },
  { role: "manager", description: "Project management" },
  { role: "director", description: "Director level access" },
  { role: "agent", description: "Agent level access" },
  { role: "supplier", description: "Supplier access" },
  { role: "user", description: "Standard user" },
];

// Get the active role from localStorage or use default
export const getActiveDevRole = (): DevRoleOptions => {
  if (typeof window !== "undefined") {
    const storedRole = localStorage.getItem("dev_role");
    if (storedRole) {
      const foundRole = DEV_ROLES.find((r) => r.role === storedRole);
      if (foundRole) return foundRole;
    }
  }
  return DEV_ROLES[0]; // Default to admin
};

// Set the active role in localStorage
export const setActiveDevRole = (role: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("dev_role", role);
    // Update the DEV_USER with the new role
    DEV_USER.user_metadata.role = role;
  }
};

// Configuration helper to check if user has specific role
export const hasDevRole = (userRole: string, requiredRole: string): boolean => {
  if (!DEV_MODE) return false;
  return userRole === requiredRole;
};

// Configuration for development features
export const DEV_CONFIG = {
  enableMockData: DEV_MODE,
  enableDebugLogs: DEV_MODE,
  skipAuthChecks: DEV_MODE,
  mockApiDelay: 500, // ms
};
