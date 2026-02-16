/**
 * Location Selector Component
 * Unified location selection using clean, reusable components
 * Following PROMPTS.md Rule #4: Use centralized DTOs, no type redefinition
 */

import React from 'react';
import UnifiedLocationSelector from './UnifiedLocationSelector';

// Re-export UnifiedLocationSelector as LocationSelector for backward compatibility
const LocationSelector = UnifiedLocationSelector;

export default LocationSelector;
