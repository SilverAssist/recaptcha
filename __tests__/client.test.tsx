/**
 * Client component tests
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import { RecaptchaWrapper, recaptchaLoader } from "../src/client";

// Store original env
const originalEnv = process.env;

// Mock window.grecaptcha
const mockExecute = jest.fn(() => Promise.resolve("mock-token"));
const mockReady = jest.fn((callback: () => void) => callback());

/**
 * Default `document.head.appendChild` mock: simulates a real `<script>`
 * load succeeding on the next microtask, wrapped in `act()` to avoid
 * React "not wrapped in act(...)" warnings. `ScriptLoader` creates real
 * `<script>` elements via `document.createElement` + `document.head.appendChild`,
 * so intercepting this one DOM call is enough to control both the
 * lazy and non-lazy paths -- both go through the same loader now.
 */
function mockScriptLoadSuccess() {
  return jest.spyOn(document.head, "appendChild").mockImplementation((node) => {
    const script = node as HTMLScriptElement;
    queueMicrotask(() => {
      act(() => {
        script.onload?.(new Event("load"));
      });
    });
    return node;
  });
}

/** Same shape, but simulates the script failing to load. */
function mockScriptLoadError() {
  return jest.spyOn(document.head, "appendChild").mockImplementation((node) => {
    const script = node as HTMLScriptElement;
    queueMicrotask(() => {
      act(() => {
        script.onerror?.(new Event("error"));
      });
    });
    return node;
  });
}

let appendChildSpy: jest.SpyInstance;

beforeEach(() => {
  process.env = { ...originalEnv };

  // Full teardown between tests: recaptchaLoader is a module-level
  // singleton (one shared instance across every RecaptchaWrapper on a
  // page, by design), so without this, one test's loaded/configured
  // state leaks into the next.
  recaptchaLoader.reset();

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

  appendChildSpy = mockScriptLoadSuccess();
});

afterEach(() => {
  process.env = originalEnv;
  appendChildSpy.mockRestore();
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

    render(<RecaptchaWrapper action="signup" inputName="customToken" inputId="custom-id" />);

    const input = screen.getByTestId("recaptcha-token-input");
    expect(input).toHaveAttribute("name", "customToken");
    expect(input).toHaveAttribute("id", "custom-id");
  });

  it("should call onTokenGenerated callback when token is generated", async () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
    const onTokenGenerated = jest.fn();

    render(<RecaptchaWrapper action="contact_form" onTokenGenerated={onTokenGenerated} />);

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

    await waitFor(
      () => {
        expect(onError).toHaveBeenCalledWith(error);
      },
      { timeout: 2000 },
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

    render(<RecaptchaWrapper action="contact_form" refreshInterval={refreshInterval} />);

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
    it("should handle unmount during grecaptcha polling", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Temporarily remove grecaptcha to force polling
      const originalGrecaptcha = window.grecaptcha;
      // @ts-expect-error -- deliberately deleting for the test
      delete window.grecaptcha;

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

      const warnSpy = jest.fn();
      jest.spyOn(console, "warn").mockImplementation(warnSpy);

      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        configurable: true,
      });

      const { container } = render(<RecaptchaWrapper action="contact_form" />);

      expect(container.firstChild).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Site key not configured"));

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

      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        configurable: true,
      });

      const { container } = render(<RecaptchaWrapper action="contact_form" />);

      expect(container.firstChild).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        configurable: true,
      });
    });

    it("should handle grecaptcha not becoming available after max attempts", async () => {
      jest.useFakeTimers();
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      const originalGrecaptcha = window.grecaptcha;
      // @ts-expect-error -- deliberately deleting for the test
      delete window.grecaptcha;

      render(<RecaptchaWrapper action="contact_form" />);

      // Advance timers beyond max polling attempts (20 * 100ms = 2000ms)
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });

      expect(mockExecute).not.toHaveBeenCalled();

      jest.useRealTimers();
      Object.defineProperty(window, "grecaptcha", {
        value: originalGrecaptcha,
        writable: true,
        configurable: true,
      });
    });
  });

  describe("Script Error Handling", () => {
    it("should call onError callback when the script fails to load", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      const onError = jest.fn();

      appendChildSpy.mockRestore();
      appendChildSpy = mockScriptLoadError();

      render(<RecaptchaWrapper action="contact_form" onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Failed to load reCAPTCHA script",
          }),
        );
      });
    });

    it("allows retrying after a failed load", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      appendChildSpy.mockRestore();
      appendChildSpy = mockScriptLoadError();

      const { unmount } = render(<RecaptchaWrapper action="contact_form" />);
      await waitFor(() => expect(mockExecute).not.toHaveBeenCalled());
      unmount();

      appendChildSpy.mockRestore();
      appendChildSpy = mockScriptLoadSuccess();

      render(<RecaptchaWrapper action="contact_form" />);
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith("test-site-key", {
          action: "contact_form",
        });
      });
    });
  });

  describe("Lazy Loading", () => {
    let mockObserve: jest.Mock;
    let mockDisconnect: jest.Mock;
    let mockIntersectionObserver: jest.Mock;

    beforeEach(() => {
      mockObserve = jest.fn();
      mockDisconnect = jest.fn();
      mockIntersectionObserver = jest.fn(function (this: IntersectionObserver) {
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

      (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
        mockIntersectionObserver;
    });

    afterEach(() => {
      delete (global as { IntersectionObserver?: unknown }).IntersectionObserver;
    });

    it("should fallback to eager loading when IntersectionObserver is not supported", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      delete (global as { IntersectionObserver?: unknown }).IntersectionObserver;

      render(<RecaptchaWrapper action="contact_form" lazy />);

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith("test-site-key", {
          action: "contact_form",
        });
      });
    });

    it("should not load script immediately when lazy=true", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy />);

      await waitFor(() => {
        expect(mockExecute).not.toHaveBeenCalled();
      });

      expect(mockObserve).toHaveBeenCalled();
    });

    it("should set up IntersectionObserver with default root margin", () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
        rootMargin: "200px",
      });
    });

    it("should set up IntersectionObserver with custom root margin", () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy lazyRootMargin="400px" />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
        rootMargin: "400px",
      });
    });

    it("should load script when element becomes visible", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy />);

      expect(mockObserve).toHaveBeenCalled();

      const observerInstance = mockIntersectionObserver.mock.instances[0];
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      act(() => {
        observerCallback([{ isIntersecting: true }], observerInstance);
      });

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith("test-site-key", {
          action: "contact_form",
        });
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("should not load script when element is not intersecting", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(<RecaptchaWrapper action="contact_form" lazy />);

      expect(mockObserve).toHaveBeenCalled();

      const observerInstance = mockIntersectionObserver.mock.instances[0];
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];

      act(() => {
        observerCallback([{ isIntersecting: false }], observerInstance);
      });

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

      const originalGrecaptcha = window.grecaptcha;

      try {
        // @ts-expect-error -- deliberately deleting for the test
        delete window.grecaptcha;

        appendChildSpy.mockRestore();
        appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation((node) => {
          const script = node as HTMLScriptElement;
          setTimeout(() => {
            act(() => script.onload?.(new Event("load")));
            setTimeout(() => {
              Object.defineProperty(window, "grecaptcha", {
                value: { ready: mockReady, execute: mockExecute },
                writable: true,
                configurable: true,
              });
            }, 50);
          }, 0);
          return node;
        });

        render(<RecaptchaWrapper action="contact_form" lazy />);

        expect(mockObserve).toHaveBeenCalled();

        const observerInstance = mockIntersectionObserver.mock.instances[0];
        const observerCallback = mockIntersectionObserver.mock.calls[0][0];

        act(() => {
          observerCallback([{ isIntersecting: true }], observerInstance);
        });

        await waitFor(
          () => {
            expect(mockExecute).toHaveBeenCalledWith("test-site-key", {
              action: "contact_form",
            });
          },
          { timeout: 2500 },
        );
      } finally {
        if (typeof originalGrecaptcha !== "undefined") {
          window.grecaptcha = originalGrecaptcha;
        } else {
          // @ts-expect-error -- deliberately deleting for the test
          delete window.grecaptcha;
        }
      }
    });
  });

  describe("Singleton Script Loading", () => {
    beforeEach(() => {
      const observerCallbacks: Array<IntersectionObserverCallback> = [];
      (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = jest.fn(
        function (this: IntersectionObserver, callback: IntersectionObserverCallback) {
          observerCallbacks.push(callback);
          setTimeout(() => {
            callback([{ isIntersecting: true } as IntersectionObserverEntry], this);
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
        },
      );
    });

    afterEach(() => {
      delete (global as { IntersectionObserver?: unknown }).IntersectionObserver;
    });

    it("should only load script once for multiple components in lazy mode", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(
        <>
          <RecaptchaWrapper action="form1" lazy />
          <RecaptchaWrapper action="form2" lazy />
          <RecaptchaWrapper action="form3" lazy />
        </>,
      );

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(3);
      });

      const scriptCalls = appendChildSpy.mock.calls.filter(
        (call) => (call[0] as Element).tagName === "SCRIPT",
      );
      expect(scriptCalls.length).toBe(1);
    });

    it("should handle script load error in lazy mode", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      const onError = jest.fn();

      appendChildSpy.mockRestore();
      appendChildSpy = mockScriptLoadError();

      render(<RecaptchaWrapper action="contact_form" lazy onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Failed to load reCAPTCHA script",
          }),
        );
      });
    });

    it("should reuse an already-loaded script for a second, later-mounted instance", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // First instance loads and finishes.
      const { unmount: unmountFirst } = render(
        <RecaptchaWrapper action="contact_form" lazy={false} />,
      );
      await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1));

      const scriptCallsAfterFirst = appendChildSpy.mock.calls.filter(
        (call) => (call[0] as Element).tagName === "SCRIPT",
      );
      expect(scriptCallsAfterFirst.length).toBe(1);

      // A second instance mounts while the first is still up -- the ref
      // count is 2, so it reuses the already-loaded script rather than
      // appending a second one.
      render(<RecaptchaWrapper action="second_form" lazy={false} />);
      await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(2));

      const scriptCallsAfterSecond = appendChildSpy.mock.calls.filter(
        (call) => (call[0] as Element).tagName === "SCRIPT",
      );
      expect(scriptCallsAfterSecond.length).toBe(1);

      unmountFirst();
    });

    it("should maintain singleton behavior when mixing lazy and non-lazy instances", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      render(
        <>
          <RecaptchaWrapper action="hero_form" />
          <RecaptchaWrapper action="footer_form" lazy />
        </>,
      );

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(2);
      });

      const scriptCalls = appendChildSpy.mock.calls.filter(
        (call) => (call[0] as Element).tagName === "SCRIPT",
      );
      expect(scriptCalls.length).toBe(1);
    });
  });
});
