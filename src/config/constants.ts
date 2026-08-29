// Configuration flags - can be controlled by environment variables
// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";
const isDevelopment = isBrowser
  ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  : false;

/**
 * Override administrateur du mode DEV (persisté par DevModeService).
 * Le fichier `.env` n'est plus la seule source : un administrateur peut
 * activer/désactiver le mode DEV depuis /settings sans redéploiement.
 */
export const DEV_MODE_OVERRIDE_KEY = "hadratech.dev_mode_override";

const readDevModeOverride = (): boolean | null => {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(DEV_MODE_OVERRIDE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    /* stockage indisponible */
  }
  return null;
};

const envDevMode =
  (isBrowser && (window as any).__APP_CONFIG__?.DEV_MODE === "true") ||
  // NOTE: must stay as a literal `import.meta.env.X` access — Vite only
  // statically replaces this exact form (aliasing or `import.meta?.env`
  // yields undefined in the browser bundle).
  import.meta.env?.VITE_DEV_MODE === "true" ||
  false;

/**
 * Mode DEV dynamique — à préférer à la constante `DEV_MODE` dans tout code
 * exécuté après le démarrage (adaptateurs, services, UI) afin de refléter
 * immédiatement une surcharge administrateur.
 */
export const isDevMode = (): boolean => readDevModeOverride() ?? envDevMode;

/** Valeur figée au chargement du module (compatibilité ascendante). */
export const DEV_MODE = isDevMode();

/** Mode hors-ligne complet (DEV_USERS, aucun appel réseau). */
export const IS_LOCAL_BYPASS =
  ((isBrowser && (window as any).__APP_CONFIG__?.APP_MODE) ||
    import.meta.env?.VITE_APP_MODE) === 'local-bypass';

/** La déconnexion est masquée uniquement en mode local-bypass. */
export const ENABLE_LOGOUT = !IS_LOCAL_BYPASS;

export const APP_NAME = import.meta.env?.VITE_APP_NAME || 'HadraTech-GPI';
export const APP_VERSION = import.meta.env?.VITE_APP_VERSION || '1.0.0';

/** Lecture du réglage administrateur courant (null = valeur .env utilisée). */
export const getDevModeOverride = (): boolean | null => readDevModeOverride();

/** Écriture du réglage administrateur (appelée uniquement par DevModeService). */
export const setDevModeOverride = (enabled: boolean | null): void => {
  if (!isBrowser) return;
  try {
    if (enabled === null) window.localStorage.removeItem(DEV_MODE_OVERRIDE_KEY);
    else window.localStorage.setItem(DEV_MODE_OVERRIDE_KEY, String(enabled));
  } catch {
    /* stockage indisponible */
  }
};

export const CLIENT_ETRML = (isBrowser && (window as any).__APP_CONFIG__?.CLIENT_ETRML === "true") || false;


// Development-mode user registry (local accounts, overridable via localStorage)
export interface DevUserProfile {
  id: string;
  email: string;
  password?: string;
  user_metadata: {
    full_name: string;
    role: string;
    phone: string;
    national_id: string;
  };
  /** Fine-grained permissions (Mode B / audit UI). */
  permissions?: string[];
  /** Team memberships. */
  teams?: string[];
  /** User preferences (language, theme, defaults). */
  preferences?: Record<string, unknown>;
}

const DEFAULT_DEV_USERS: Record<string, DevUserProfile> = {
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
    permissions: ["*"],
    teams: ["core"],
    preferences: { language: "fr", theme: "light" },
  },
  manager: {
    id: "00000000-0000-0000-0000-000000000002",
    email: "manager@hadratech.com",
    password: "DEV-MANAGER-001",
    user_metadata: {
      full_name: "Manager Dev",
      role: "manager",
      phone: "100000002",
      national_id: "DEV-MANAGER-002",
    },
    permissions: [
      "projects:read",
      "projects:create",
      "projects:update",
      "tenders:read",
      "tenders:manage",
    ],
    teams: ["projects"],
    preferences: { language: "fr", theme: "light" },
  },
  director: {
    id: "00000000-0000-0000-0000-000000000003",
    email: "director@hadratech.com",
    password: "DEV-DIRECTOR-001",
    user_metadata: {
      full_name: "Director Dev",
      role: "director",
      phone: "100000003",
      national_id: "DEV-DIRECTOR-003",
    },
    permissions: [
      "projects:read",
      "projects:approve",
      "payments:approve",
      "users:read",
    ],
    teams: ["direction"],
    preferences: { language: "fr", theme: "light" },
  },
  supplier: {
    id: "00000000-0000-0000-0000-000000000004",
    email: "supplier@hadratech.com",
    password: "DEV-SUPPLIER-001",
    user_metadata: {
      full_name: "Supplier Dev",
      role: "supplier",
      phone: "100000004",
      national_id: "DEV-SUPPLIER-004",
    },
    permissions: ["tenders:read", "submissions:create", "invoices:create"],
    teams: ["suppliers"],
    preferences: { language: "fr", theme: "light" },
  },
  consultant: {
    id: "00000000-0000-0000-0000-000000000005",
    email: "consultant@hadratech.com",
    password: "DEV-CONSULTANT-001",
    user_metadata: {
      full_name: "Consultant Dev",
      role: "consultant",
      phone: "100000005",
      national_id: "DEV-CONSULTANT-005",
    },
    permissions: ["projects:read", "inspections:create", "reports:create"],
    teams: ["consultants"],
    preferences: { language: "fr", theme: "light" },
  },
};


const LOCAL_USERS_STORAGE_KEY = "dev_users_overrides";

function loadPersistedUsers(): Record<string, DevUserProfile> {
  if (!isBrowser) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DevUserProfile>) : {};
  } catch {
    return {};
  }
}

export function persistDevUsers(users: Record<string, DevUserProfile>): void {
  if (!isBrowser) return;
  window.localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(users));
  window.dispatchEvent(new CustomEvent("dev-users-changed"));
}

/** Live DEV_USERS registry: defaults merged with localStorage overrides. */
export const DEV_USERS: Record<string, DevUserProfile> = new Proxy(
  {} as Record<string, DevUserProfile>,
  {
    get(_t, prop: string) {
      const merged = { ...DEFAULT_DEV_USERS, ...loadPersistedUsers() };
      return merged[prop];
    },
    ownKeys() {
      return Object.keys({ ...DEFAULT_DEV_USERS, ...loadPersistedUsers() });
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
    has(_t, prop: string) {
      return prop in { ...DEFAULT_DEV_USERS, ...loadPersistedUsers() };
    },
  },
);

export function getDevUsersSnapshot(): Record<string, DevUserProfile> {
  return { ...DEFAULT_DEV_USERS, ...loadPersistedUsers() };
}

export function getDefaultDevUsers(): Record<string, DevUserProfile> {
  return { ...DEFAULT_DEV_USERS };
}

/** Active DEV_USER — derived from the active dev role (localStorage: dev_role). */
export const DEV_USER: DevUserProfile = new Proxy({} as DevUserProfile, {
  get(_t, prop: keyof DevUserProfile) {
    const roleKey = (isBrowser && localStorage.getItem("dev_role")) || "admin";
    const users = getDevUsersSnapshot();
    const profile = users[roleKey] ?? users.admin ?? DEFAULT_DEV_USERS.admin;
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
    | "supplier"
    | "consultant";
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
  { role: "consultant", description: "Consultant / mission de contrôle" },
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
  // DEV_MODE selects local adapters but never authenticates a user implicitly.
  skipAuthChecks: false,
  mockApiDelay: 500, // ms
};
