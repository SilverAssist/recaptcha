/**
 * Server-side validation tests
 */

import {
  validateRecaptcha,
  isRecaptchaEnabled,
  getRecaptchaToken,
} from "../src/server";

// Store original env
const originalEnv = process.env;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("validateRecaptcha", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockFetch.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return success for valid token with high score", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.9,
        action: "contact_form",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    const result = await validateRecaptcha("valid-token", "contact_form");

    expect(result.success).toBe(true);
    expect(result.score).toBe(0.9);
    expect(result.error).toBeUndefined();
  });

  it("should reject token with low score", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.2,
        action: "contact_form",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    const result = await validateRecaptcha("valid-token", "contact_form");

    expect(result.success).toBe(false);
    expect(result.score).toBe(0.2);
    expect(result.error).toContain("score too low");
  });

  it("should reject token with action mismatch", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.9,
        action: "different_action",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    const result = await validateRecaptcha("valid-token", "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("action mismatch");
  });

  it("should skip validation when secret key not configured", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;

    const result = await validateRecaptcha("any-token", "contact_form");

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.score).toBe(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return error when token is missing", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    const result = await validateRecaptcha(null, "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toBe("reCAPTCHA token is missing");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return error when token is undefined", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    const result = await validateRecaptcha(undefined, "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toBe("reCAPTCHA token is missing");
  });

  it("should handle Google API verification failure", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    });

    const result = await validateRecaptcha("invalid-token", "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("verification failed");
  });

  it("should handle network errors", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await validateRecaptcha("valid-token", "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });

  it("should handle HTTP errors", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await validateRecaptcha("valid-token", "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("500");
  });

  it("should use custom score threshold", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.6,
        action: "payment",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    // With default threshold (0.5), this should pass
    let result = await validateRecaptcha("valid-token", "payment");
    expect(result.success).toBe(true);

    // With higher threshold (0.7), this should fail
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.6,
        action: "payment",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    result = await validateRecaptcha("valid-token", "payment", {
      scoreThreshold: 0.7,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("score too low");
  });

  it("should use custom secret key from options", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.9,
        action: "test",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    const result = await validateRecaptcha("valid-token", "test", {
      secretKey: "custom-secret-key",
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams),
      })
    );
  });
});

describe("isRecaptchaEnabled", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return true when env secret key is set", () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";
    expect(isRecaptchaEnabled()).toBe(true);
  });

  it("should return false when env secret key is not set", () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    expect(isRecaptchaEnabled()).toBe(false);
  });

  it("should return true when explicit secret key is provided", () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    expect(isRecaptchaEnabled("explicit-key")).toBe(true);
  });

  it("should return false for empty string", () => {
    process.env.RECAPTCHA_SECRET_KEY = "";
    expect(isRecaptchaEnabled()).toBe(false);
  });
});

describe("getRecaptchaToken", () => {
  it("should extract token from FormData", () => {
    const formData = new FormData();
    formData.set("recaptchaToken", "test-token");

    const token = getRecaptchaToken(formData);

    expect(token).toBe("test-token");
  });

  it("should return null when token is not present", () => {
    const formData = new FormData();

    const token = getRecaptchaToken(formData);

    expect(token).toBeNull();
  });

  it("should use custom field name", () => {
    const formData = new FormData();
    formData.set("customToken", "custom-test-token");

    const token = getRecaptchaToken(formData, "customToken");

    expect(token).toBe("custom-test-token");
  });

  it("should return null for non-string values", () => {
    const formData = new FormData();
    const blob = new Blob(["test"], { type: "text/plain" });
    formData.set("recaptchaToken", blob);

    const token = getRecaptchaToken(formData);

    expect(token).toBeNull();
  });
});
