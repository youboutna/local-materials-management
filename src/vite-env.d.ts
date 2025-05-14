
/// <reference types="vite/client" />

// Create a global namespace for environment variables
interface ImportMetaEnv {
  readonly VITE_DEV_MODE: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
