/**
 * Application Configuration for Browser Environment
 * This file should be included in your HTML to configure the app
 */

window.__APP_CONFIG__ = {
  // Development mode settings
  DEV_MODE: true,
  CLIENT_ETRML: false,
  
  // Development user configuration
  DEV_USER_ID: "00000000-0000-0000-0000-000000000001",
  DEV_USER_EMAIL: "dev@example.com",
  DEV_USER_NAME: "Développeur Test",
  DEV_USER_ROLE: "admin",
  DEV_USER_PHONE: "123456789",
  DEV_USER_NATIONAL_ID: "DEV12345",
  
  // API configuration
  API_BASE_URL: "http://localhost:8080/api",
  MOCK_API_DELAY: 500,
  
  // Feature flags
  ENABLE_DEBUG_LOGS: true,
  SKIP_AUTH_CHECKS: true,
  ENABLE_MOCK_DATA: true,
};
