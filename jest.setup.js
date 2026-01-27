require("@testing-library/jest-dom");

// Mock Next.js Script component
jest.mock("next/script", () => {
  return function MockScript({ onLoad, onError, ...props }) {
    // Simulate script load after a tick
    if (onLoad) {
      setTimeout(() => {
        onLoad();
      }, 0);
    }
    return null;
  };
});

// Mock process.env
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});
