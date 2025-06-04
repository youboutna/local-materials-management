// Set this to false to enable proper authentication behavior
export const DEV_MODE = false;

// Mock user for development mode
export const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001", // Valid UUID format for dev
  email: "dev@example.com",
  user_metadata: {
    full_name: "Développeur Test",
    role: "admin",
    phone: "123456789",
    national_id: "DEV12345"
  }
};

// Development mode role configuration
export interface DevRoleOptions {
  role: "admin" | "user" | "inspector" | "practitioner" | "insurance_company" | "material-manager" | "manager" | "director"| "agent"|"supplier";
  description: string;
}

export const DEV_ROLES: DevRoleOptions[] = [
  { role: "admin", description: "Full system access" },
  { role: "inspector", description: "inspector access only" },
  { role: "practitioner", description: "Medical practitioner" },
  { role: "insurance_company", description: "Insurance company representative" },
  { role: "material-manager", description: "Materials management" },
  { role: "manager", description: "Project management" },
  { role: "director", description: "Director level access" },
  { role: "agent", description: "Director level access" },
  { role: "supplier", description: "Director level access" },
  { role: "user", description: "Standard user" }
];

// Get the active role from localStorage or use default
export const getActiveDevRole = (): DevRoleOptions => {
  if (typeof window !== 'undefined') {
    const storedRole = localStorage.getItem('dev_role');
    if (storedRole) {
      const foundRole = DEV_ROLES.find(r => r.role === storedRole);
      if (foundRole) return foundRole;
    }
  }
  return DEV_ROLES[0]; // Default to admin
};

// Set the active role in localStorage
export const setActiveDevRole = (role: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dev_role', role);
    // Update the DEV_USER with the new role
    DEV_USER.user_metadata.role = role;
  }
};
