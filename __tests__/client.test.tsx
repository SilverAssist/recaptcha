/**
 * Client component tests
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { RecaptchaWrapper } from "../src/client";

// Mock next/script
jest.mock("next/script", () => {
  return function Script({
    src,
    onLoad,
    onError: scriptOnError,
  }: {
    src: string;
    onLoad?: () => void;
    onError?: () => void;
    strategy?: string;
  }) {
    React.useEffect(() => {
      // Use queueMicrotask to simulate async script load without timers
      // This works correctly with fake timers
      if (onLoad) {
        queueMicrotask(() => onLoad());
      }
    }, [onLoad]);
    return null;
  };
});

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

    // Wait for the script to load (via setScriptLoaded(true))
    await waitFor(
      () => {
        expect(onError).toHaveBeenCalledWith(error);
      },
      { timeout: 2000 }
    );
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

  describe("Lazy Loading", () => {
    let mockObserve: jest.Mock;
    let mockDisconnect: jest.Mock;
    let mockIntersectionObserver: jest.Mock;

    beforeEach(() => {
      // Mock IntersectionObserver
      mockObserve = jest.fn();
      mockDisconnect = jest.fn();
      mockIntersectionObserver = jest.fn(function (
        this: IntersectionObserver
      ) {
        return {
          observe: mockObserve,
          disconnect: mockDisconnect,
          unobserve: jest.fn(),
          takeRecords: jest.fn(),
          root: null,
          rootMargin: "",
          thresholds: [],
        };
      });

      (global as any).IntersectionObserver = mockIntersectionObserver;

      // Reset window flags
      delete (window as any).__recaptchaLoaded;
      delete (window as any).__recaptchaLoading;
      delete (window as any).__recaptchaCallbacks;
    });

    afterEach(() => {
      delete (global as any).IntersectionObserver;
    });

    it("should not load script immediately when lazy=true", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy />);

      // Script should not be loaded yet
      await waitFor(() => {
        expect(mockExecute).not.toHaveBeenCalled();
      });

      expect(mockObserve).toHaveBeenCalled();
    });

    it("should set up IntersectionObserver with default root margin", () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { rootMargin: "200px" }
      );
    });

    it("should set up IntersectionObserver with custom root margin", () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(
        <RecaptchaWrapper
          action="contact_form"
          lazy
          lazyRootMargin="400px"
        />
      );

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { rootMargin: "400px" }
      );
    });

    it("should load script when element becomes visible", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Mock document.head.appendChild to simulate script load
      const originalAppendChild = document.head.appendChild;
      document.head.appendChild = jest.fn((script: any) => {
        // Simulate script load
        setTimeout(() => {
          if (script.onload) script.onload();
        }, 0);
        return script;
      }) as any;

      render(<RecaptchaWrapper action="contact_form" lazy />);

      // Verify IntersectionObserver was set up
      expect(mockObserve).toHaveBeenCalled();

      // Get the observer instance and callback
      const observerInstance = mockIntersectionObserver.mock.instances[0];
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      // Simulate intersection
      act(() => {
        observerCallback([{ isIntersecting: true }], observerInstance);
      });

      // Script should be loaded now
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith("test-site-key", {
          action: "contact_form",
        });
      });

      expect(mockDisconnect).toHaveBeenCalled();

      // Restore
      document.head.appendChild = originalAppendChild;
    });

    it("should not load script when element is not intersecting", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy />);

      // Verify IntersectionObserver was set up
      expect(mockObserve).toHaveBeenCalled();

      // Get the observer instance and callback
      const observerInstance = mockIntersectionObserver.mock.instances[0];
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      // Simulate non-intersection
      act(() => {
        observerCallback([{ isIntersecting: false }], observerInstance);
      });

      // Script should not be loaded
      await waitFor(() => {
        expect(mockExecute).not.toHaveBeenCalled();
      });

      expect(mockDisconnect).not.toHaveBeenCalled();
    });

    it("should not set up IntersectionObserver when lazy=false", () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy={false} />);

      expect(mockIntersectionObserver).not.toHaveBeenCalled();
    });

    it("should clean up IntersectionObserver on unmount", () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      const { unmount } = render(<RecaptchaWrapper action="contact_form" lazy />);

      expect(mockObserve).toHaveBeenCalled();

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe("Singleton Script Loading", () => {
    beforeEach(() => {
      // Reset window flags
      delete (window as any).__recaptchaLoaded;
      delete (window as any).__recaptchaLoading;
      delete (window as any).__recaptchaCallbacks;

      // Mock document.head.appendChild
      document.head.appendChild = jest.fn((script: any) => {
        // Simulate script load
        setTimeout(() => {
          if (script.onload) script.onload();
        }, 0);
        return script;
      });
    });

    it("should only load script once for multiple components in lazy mode", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Mock IntersectionObserver to auto-trigger intersection
      let observerCallbacks: Array<IntersectionObserverCallback> = [];
      (global as any).IntersectionObserver = jest.fn(function (
        this: IntersectionObserver,
        callback: IntersectionObserverCallback
      ) {
        observerCallbacks.push(callback);
        setTimeout(() => {
          callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this
          );
        }, 0);
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn(),
          takeRecords: jest.fn(),
          root: null,
          rootMargin: "",
          thresholds: [],
        };
      });

      const appendChildSpy = jest.spyOn(document.head, "appendChild");

      // Render multiple components
      render(
        <>
          <RecaptchaWrapper action="form1" lazy />
          <RecaptchaWrapper action="form2" lazy />
          <RecaptchaWrapper action="form3" lazy />
        </>
      );

      // Wait for script to load
      await waitFor(() => {
        expect(window.__recaptchaLoaded).toBe(true);
      });

      // Script should be appended only once
      const scriptCalls = appendChildSpy.mock.calls.filter(
        (call) => call[0].tagName === "SCRIPT"
      );
      expect(scriptCalls.length).toBe(1);

      appendChildSpy.mockRestore();
      delete (global as any).IntersectionObserver;
    });

    it("should handle script load error in lazy mode", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      const onError = jest.fn();

      // Mock IntersectionObserver
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();
      (global as any).IntersectionObserver = jest.fn(function () {
        return {
          observe: mockObserve,
          disconnect: mockDisconnect,
          unobserve: jest.fn(),
          takeRecords: jest.fn(),
          root: null,
          rootMargin: "",
          thresholds: [],
        };
      });

      // Mock document.head.appendChild to simulate script error
      const originalAppendChild = document.head.appendChild;
      document.head.appendChild = jest.fn((script: any) => {
        // Simulate script error
        setTimeout(() => {
          if (script.onerror) script.onerror();
        }, 0);
        return script;
      }) as any;

      render(<RecaptchaWrapper action="contact_form" lazy onError={onError} />);

      // Get the observer instance and callback
      const IntersectionObserverMock = (global as any).IntersectionObserver;
      const observerCallback = IntersectionObserverMock.mock.calls[0][0];

      // Simulate intersection to trigger script load
      act(() => {
        observerCallback([{ isIntersecting: true }], {});
      });

      // Wait for error callback
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Failed to load reCAPTCHA script",
          })
        );
      });

      // Restore
      document.head.appendChild = originalAppendChild;
      delete (global as any).IntersectionObserver;
    });

    it("should reuse already loaded script when script is already loaded", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Mark script as already loaded
      (window as any).__recaptchaLoaded = true;

      // Mock IntersectionObserver
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();
      (global as any).IntersectionObserver = jest.fn(function () {
        return {
          observe: mockObserve,
          disconnect: mockDisconnect,
          unobserve: jest.fn(),
          takeRecords: jest.fn(),
          root: null,
          rootMargin: "",
          thresholds: [],
        };
      });

      const appendChildSpy = jest.spyOn(document.head, "appendChild");

      render(<RecaptchaWrapper action="contact_form" lazy />);

      // Get the observer instance and callback
      const IntersectionObserverMock = (global as any).IntersectionObserver;
      const observerCallback = IntersectionObserverMock.mock.calls[0][0];

      // Simulate intersection
      act(() => {
        observerCallback([{ isIntersecting: true }], {});
      });

      // Wait for execute to be called
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalled();
      });

      // Script should NOT be appended again
      const scriptCalls = appendChildSpy.mock.calls.filter(
        (call) => call[0].tagName === "SCRIPT"
      );
      expect(scriptCalls.length).toBe(0);

      appendChildSpy.mockRestore();
      delete (global as any).IntersectionObserver;
    });

    it("should maintain singleton behavior when mixing lazy and non-lazy instances", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Mock IntersectionObserver
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();
      (global as any).IntersectionObserver = jest.fn(function () {
        return {
          observe: mockObserve,
          disconnect: mockDisconnect,
          unobserve: jest.fn(),
          takeRecords: jest.fn(),
          root: null,
          rootMargin: "",
          thresholds: [],
        };
      });

      const appendChildSpy = jest.spyOn(document.head, "appendChild");

      // Render both non-lazy and lazy instances
      render(
        <>
          <RecaptchaWrapper action="hero_form" />
          <RecaptchaWrapper action="footer_form" lazy />
        </>
      );

      // Wait for non-lazy script to load (via Next.js Script)
      await waitFor(() => {
        expect(window.__recaptchaLoaded).toBe(true);
      });

      // Get the observer instance and callback
      const IntersectionObserverMock = (global as any).IntersectionObserver;
      const observerCallback = IntersectionObserverMock.mock.calls[0][0];

      // Simulate lazy instance becoming visible
      act(() => {
        observerCallback([{ isIntersecting: true }], {});
      });

      // Wait for lazy instance to attempt loading
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalled();
      });

      // Script should NOT be appended again (Next.js Script handles the first load)
      const scriptCalls = appendChildSpy.mock.calls.filter(
        (call) => call[0].tagName === "SCRIPT"
      );
      expect(scriptCalls.length).toBe(0);

      appendChildSpy.mockRestore();
      delete (global as any).IntersectionObserver;
    });
  });
});
