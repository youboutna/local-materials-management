// Configuration flags - can be controlled by environment variables
// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";
const isDevelopment = isBrowser
  ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  : false;

export const DEV_MODE = true;
export const CLIENT_ETRML = (isBrowser && (window as any).__APP_CONFIG__?.CLIENT_ETRML === "true") || false;

// Mock user configuration for development mode
export interface DevUserProfile {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    role: string;
    phone: string;
    national_id: string;
  };
}

export const DEV_USERS: Record<string, DevUserProfile> = {
  admin: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@hadratech.com",
    password: "DEV-ADMIN-001",
    user_metadata: {
      full_name: "Admin Dev",
      role: "admin",
      phone: "100000001",
      national_id: "DEV-ADMIN-001",
    },
  },
  manager: {
    id: "00000000-0000-0000-0000-000000000002",
    email: "manager@hadratech.com",
    user_metadata: {
      full_name: "Manager Dev",
      role: "manager",
      phone: "100000002",
      national_id: "DEV-MANAGER-002",
    },
  },
  director: {
    id: "00000000-0000-0000-0000-000000000003",
    email: "director@hadratech.com",
    user_metadata: {
      full_name: "Director Dev",
      role: "director",
      phone: "100000003",
      national_id: "DEV-DIRECTOR-003",
    },
  },
};

/** Active DEV_USER — derived from the active dev role (localStorage: dev_role). */
export const DEV_USER: DevUserProfile = new Proxy({} as DevUserProfile, {
  get(_t, prop: keyof DevUserProfile) {
    const roleKey = (isBrowser && localStorage.getItem("dev_role")) || "admin";
    const profile = DEV_USERS[roleKey] ?? DEV_USERS.admin;
    return profile[prop];
  },
});

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
    // DEV_USER is a Proxy that resolves the profile from localStorage on read,
    // so no direct mutation is needed here.
    window.dispatchEvent(new CustomEvent("dev-role-changed", { detail: role }));
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
