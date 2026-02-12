/**
 * Enhanced Location Selector Component
 * Replaces basic LocationSelector with advanced autocomplete and features
 * Following PROMPTS.md Rule #4: Use centralized DTOs, no type redefinition
 */

import React from 'react';
import EnhancedLocationSelector from './EnhancedLocationSelector';

// Re-export EnhancedLocationSelector as LocationSelector for backward compatibility
const LocationSelector = EnhancedLocationSelector;

export default LocationSelector;
