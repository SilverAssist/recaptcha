/**
 * Client component tests
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { RecaptchaWrapper } from "../src/client";

// Store original env
const originalEnv = process.env;

// Mock window.grecaptcha
const mockExecute = jest.fn(() => Promise.resolve("mock-token"));
const mockReady = jest.fn((callback: () => void) => callback());

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };

  // Reset mocks
  mockExecute.mockClear();
  mockReady.mockClear();
  mockExecute.mockImplementation(() => Promise.resolve("mock-token"));

  // Setup window.grecaptcha mock
  Object.defineProperty(window, "grecaptcha", {
    value: {
      ready: mockReady,
      execute: mockExecute,
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe("RecaptchaWrapper", () => {
  it("should render hidden input with default name", async () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(<RecaptchaWrapper action="contact_form" />);

    const input = screen.getByTestId("recaptcha-token-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "hidden");
    expect(input).toHaveAttribute("name", "recaptchaToken");
    expect(input).toHaveAttribute("id", "recaptcha-token");
  });

  it("should render hidden input with custom name and id", async () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(
      <RecaptchaWrapper
        action="signup"
        inputName="customToken"
        inputId="custom-id"
      />
    );

    const input = screen.getByTestId("recaptcha-token-input");
    expect(input).toHaveAttribute("name", "customToken");
    expect(input).toHaveAttribute("id", "custom-id");
  });

  it("should call onTokenGenerated callback when token is generated", async () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
    const onTokenGenerated = jest.fn();

    render(
      <RecaptchaWrapper action="contact_form" onTokenGenerated={onTokenGenerated} />
    );

    await waitFor(() => {
      expect(onTokenGenerated).toHaveBeenCalledWith("mock-token");
    });
  });

  it("should render nothing when site key is not configured", () => {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    const { container } = render(<RecaptchaWrapper action="contact_form" />);

    expect(container.firstChild).toBeNull();
  });

  it("should use siteKey prop over environment variable", async () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "env-site-key";

    render(<RecaptchaWrapper action="contact_form" siteKey="prop-site-key" />);

    const input = screen.getByTestId("recaptcha-token-input");
    expect(input).toBeInTheDocument();

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith("prop-site-key", {
        action: "contact_form",
      });
    });
  });

  it("should call onError callback when grecaptcha.execute fails", async () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
    const onError = jest.fn();
    const error = new Error("Execute failed");

    mockExecute.mockRejectedValueOnce(error);

    render(<RecaptchaWrapper action="contact_form" onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it("should execute recaptcha with correct action", async () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

    render(<RecaptchaWrapper action="signup_form" />);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith("test-site-key", {
        action: "signup_form",
      });
    });
  });

  it("should set up refresh interval", async () => {
    jest.useFakeTimers();
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
    const refreshInterval = 30000;

    render(
      <RecaptchaWrapper action="contact_form" refreshInterval={refreshInterval} />
    );

    // Initial call happens on mount
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalled();
    });

    const initialCallCount = mockExecute.mock.calls.length;

    // Advance time by refresh interval
    act(() => {
      jest.advanceTimersByTime(refreshInterval);
    });

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledTimes(initialCallCount + 1);
    });
  });

  it("should clean up interval on unmount", async () => {
    jest.useFakeTimers();
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    const { unmount } = render(<RecaptchaWrapper action="contact_form" />);

    // Wait for initial execution
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
