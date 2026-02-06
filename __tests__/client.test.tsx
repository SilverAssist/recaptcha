/**
 * Client component tests
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { RecaptchaWrapper } from "../src/client";

// Control variable to simulate script load error
let simulateScriptError = false;

// Mock next/script with proper act() wrapping to avoid React state update warnings
jest.mock("next/script", () => {
  // Import act from react for use inside the mock
  const { act } = require("@testing-library/react");
  
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
      // Use queueMicrotask wrapped in act() to properly handle React state updates
      // This prevents "not wrapped in act(...)" warnings
      if (simulateScriptError) {
        if (scriptOnError) {
          queueMicrotask(() => {
            act(() => {
              scriptOnError();
            });
          });
        }
      } else if (onLoad) {
        queueMicrotask(() => {
          act(() => {
            onLoad();
          });
        });
      }
    }, [onLoad, scriptOnError]);
    return null;
  };
});

// Export setter for tests
export const setSimulateScriptError = (value: boolean) => {
  simulateScriptError = value;
};

// Store original env
const originalEnv = process.env;

// Mock window.grecaptcha
const mockExecute = jest.fn(() => Promise.resolve("mock-token"));
const mockReady = jest.fn((callback: () => void) => callback());

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };

  // Reset script error simulation
  simulateScriptError = false;

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

  describe("Edge Cases for Coverage", () => {
    beforeEach(() => {
      // Reset window flags
      delete (window as any).__recaptchaLoaded;
      delete (window as any).__recaptchaLoading;
      delete (window as any).__recaptchaCallbacks;
    });

    it("should handle unmount during grecaptcha polling", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Temporarily remove grecaptcha to force polling
      const originalGrecaptcha = (window as any).grecaptcha;
      delete (window as any).grecaptcha;

      const { unmount } = render(<RecaptchaWrapper action="contact_form" />);

      // Unmount immediately while polling is happening
      unmount();

      // Restore grecaptcha after a delay
      await act(async () => {
        await new Promise((r) => setTimeout(r, 150));
        Object.defineProperty(window, "grecaptcha", {
          value: originalGrecaptcha,
          writable: true,
          configurable: true,
        });
      });

      // No error should occur - component should handle unmount gracefully
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it("should handle unmount after execute but before callback", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      const onTokenGenerated = jest.fn();

      // Make execute return a delayed promise
      mockExecute.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve("delayed-token"), 100);
          })
      );

      const { unmount } = render(
        <RecaptchaWrapper
          action="contact_form"
          onTokenGenerated={onTokenGenerated}
        />
      );

      // Unmount while execute is pending
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
        unmount();
      });

      // Wait for the delayed promise to resolve
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      // The callback should NOT have been called because component unmounted
      // (depending on timing, this tests the isMountedRef check)
    });

    it("should handle non-Error exceptions in executeRecaptcha", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      const onError = jest.fn();

      // Make execute throw a non-Error value
      mockExecute.mockRejectedValueOnce("string error");

      render(<RecaptchaWrapper action="contact_form" onError={onError} />);

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalled();
      });

      // onError should NOT be called for non-Error exceptions
      // (the code checks `error instanceof Error`)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(onError).not.toHaveBeenCalled();
    });

    it("should log warning in development when site key not configured", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

      // Temporarily restore console.warn to capture the call
      const warnSpy = jest.fn();
      jest.spyOn(console, "warn").mockImplementation(warnSpy);

      // Set development mode
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        configurable: true,
      });

      const { container } = render(<RecaptchaWrapper action="contact_form" />);

      // Component should render nothing
      expect(container.firstChild).toBeNull();

      // Warning should have been called (though suppressed by our setup)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Site key not configured")
      );

      // Restore NODE_ENV
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        configurable: true,
      });
    });

    it("should not log warning in production when site key not configured", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

      const warnSpy = jest.fn();
      jest.spyOn(console, "warn").mockImplementation(warnSpy);

      // Set production mode
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        configurable: true,
      });

      const { container } = render(<RecaptchaWrapper action="contact_form" />);

      expect(container.firstChild).toBeNull();
      // Warning should NOT be called in production
      expect(warnSpy).not.toHaveBeenCalled();

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        configurable: true,
      });
    });

    it("should handle grecaptcha not becoming available after max attempts", async () => {
      jest.useFakeTimers();
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Remove grecaptcha entirely
      delete (window as any).grecaptcha;

      render(<RecaptchaWrapper action="contact_form" />);

      // Advance timers beyond max polling attempts (20 * 100ms = 2000ms)
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });

      // Execute should not have been called since grecaptcha never became available
      expect(mockExecute).not.toHaveBeenCalled();

      jest.useRealTimers();

      // Restore grecaptcha
      Object.defineProperty(window, "grecaptcha", {
        value: {
          ready: mockReady,
          execute: mockExecute,
        },
        writable: true,
        configurable: true,
      });
    });
  });

  describe("Non-lazy Script Error Handling", () => {
    beforeEach(() => {
      // Reset window flags
      delete (window as any).__recaptchaLoaded;
      delete (window as any).__recaptchaLoading;
      delete (window as any).__recaptchaCallbacks;
    });

    afterEach(() => {
      simulateScriptError = false;
    });

    it("should call onError callback when non-lazy Script fails to load", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      const onError = jest.fn();

      // Enable script error simulation
      simulateScriptError = true;

      render(<RecaptchaWrapper action="contact_form" onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Failed to load reCAPTCHA script",
          })
        );
      });
    });

    it("should clear __recaptchaLoading flag on script error", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Set up loading flag
      (window as any).__recaptchaLoading = true;

      // Enable script error simulation
      simulateScriptError = true;

      render(<RecaptchaWrapper action="contact_form" />);

      await waitFor(() => {
        expect(window.__recaptchaLoading).toBe(false);
      });
    });

    it("should notify queued callbacks on script error", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      const queuedOnError = jest.fn();

      // Set up a queued callback (simulating a lazy instance waiting)
      (window as any).__recaptchaLoading = true;
      (window as any).__recaptchaCallbacks = [
        { onLoad: jest.fn(), onError: queuedOnError },
      ];

      // Enable script error simulation
      simulateScriptError = true;

      render(<RecaptchaWrapper action="contact_form" />);

      await waitFor(() => {
        expect(queuedOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Failed to load reCAPTCHA script",
          })
        );
      });

      // Callbacks array should be cleared
      expect(window.__recaptchaCallbacks).toEqual([]);
    });
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

    it("should fallback to eager loading when IntersectionObserver is not supported", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Remove IntersectionObserver to simulate unsupported environment
      delete (global as any).IntersectionObserver;

      // Mock document.head.appendChild for lazy script loading
      const originalAppendChild = document.head.appendChild;
      document.head.appendChild = jest.fn((script: any) => {
        setTimeout(() => {
          if (script.onload) script.onload();
        }, 0);
        return script;
      }) as any;

      render(<RecaptchaWrapper action="contact_form" lazy />);

      // Should load script immediately (fallback to eager) and execute
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith("test-site-key", {
          action: "contact_form",
        });
      });

      // Restore
      document.head.appendChild = originalAppendChild;
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

    it("should generate token even when grecaptcha is delayed after script load", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      const originalGrecaptcha = (window as any).grecaptcha;
      const originalAppendChild = document.head.appendChild;

      try {
        // Temporarily delete grecaptcha to simulate race condition
        delete (window as any).grecaptcha;

        // Mock document.head.appendChild to simulate script load
        // where grecaptcha becomes available AFTER onload fires
        document.head.appendChild = jest.fn((script: any) => {
          setTimeout(() => {
            // Call onload first (grecaptcha not yet available)
            if (script.onload) script.onload();

            // Make grecaptcha available shortly after (simulating race condition)
            setTimeout(() => {
              Object.defineProperty(window, "grecaptcha", {
                value: {
                  ready: mockReady,
                  execute: mockExecute,
                },
                writable: true,
                configurable: true,
              });
            }, 50);
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

        // Wait for script to load and token to be generated
        // (even though grecaptcha was delayed)
        await waitFor(
          () => {
            expect(mockExecute).toHaveBeenCalledWith("test-site-key", {
              action: "contact_form",
            });
          },
          { timeout: 2500 }
        );
      } finally {
        // Restore document.head.appendChild
        document.head.appendChild = originalAppendChild;

        // Restore window.grecaptcha to its original state
        if (typeof originalGrecaptcha !== "undefined") {
          (window as any).grecaptcha = originalGrecaptcha;
        } else {
          delete (window as any).grecaptcha;
        }
      }
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
        (call) => (call[0] as Element).tagName === "SCRIPT"
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
        (call) => (call[0] as Element).tagName === "SCRIPT"
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
        (call) => (call[0] as Element).tagName === "SCRIPT"
      );
      expect(scriptCalls.length).toBe(0);

      appendChildSpy.mockRestore();
      delete (global as any).IntersectionObserver;
    });
  });
});
