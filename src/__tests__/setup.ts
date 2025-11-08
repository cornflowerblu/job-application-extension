/**
 * Jest test setup
 * This file runs before all tests
 */

import '@testing-library/jest-dom';

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    lastError: undefined,
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  commands: {
    onCommand: {
      addListener: jest.fn(),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
} as any;

// Mock fetch globally
global.fetch = jest.fn();
