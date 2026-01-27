/**
 * Integration tests for complete form submission flow
 */

import {
  validateRecaptcha,
  getRecaptchaToken,
  isRecaptchaEnabled,
} from "../src/server";

// Store original env
const originalEnv = process.env;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Integration: Complete Form Submission Flow", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";
    mockFetch.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should successfully validate a form submission", async () => {
    // Simulate form data from client
    const formData = new FormData();
    formData.set("recaptchaToken", "valid-client-token");
    formData.set("email", "user@example.com");
    formData.set("message", "Hello, this is a test message");

    // Mock successful Google API response
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

    // Extract and validate token
    const token = getRecaptchaToken(formData);
    expect(token).toBe("valid-client-token");

    const result = await validateRecaptcha(token, "contact_form");

    expect(result.success).toBe(true);
    expect(result.score).toBe(0.9);
    expect(result.error).toBeUndefined();
  });

  it("should reject bot submission with low score", async () => {
    const formData = new FormData();
    formData.set("recaptchaToken", "bot-token");
    formData.set("email", "bot@spam.com");

    // Mock Google API response with low score (bot detected)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.1, // Very low score = likely bot
        action: "contact_form",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    const token = getRecaptchaToken(formData);
    const result = await validateRecaptcha(token, "contact_form");

    expect(result.success).toBe(false);
    expect(result.score).toBe(0.1);
    expect(result.error).toContain("score too low");
  });

  it("should prevent action mismatch attacks", async () => {
    // Attacker tries to reuse a token generated for a different action
    const formData = new FormData();
    formData.set("recaptchaToken", "stolen-token");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.9,
        action: "newsletter_signup", // Token was for different action
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    const token = getRecaptchaToken(formData);
    const result = await validateRecaptcha(token, "admin_login"); // Expected action

    expect(result.success).toBe(false);
    expect(result.error).toContain("action mismatch");
  });

  it("should handle expired/reused token", async () => {
    const formData = new FormData();
    formData.set("recaptchaToken", "expired-token");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      }),
    });

    const token = getRecaptchaToken(formData);
    const result = await validateRecaptcha(token, "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("timeout-or-duplicate");
  });

  it("should apply different thresholds for different form types", async () => {
    const formData = new FormData();
    formData.set("recaptchaToken", "valid-token");

    // Response with medium score
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        score: 0.6,
        action: "payment",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    };

    // Low-risk form (newsletter) - should pass with 0.3 threshold
    mockFetch.mockResolvedValueOnce(mockResponse);
    let token = getRecaptchaToken(formData);
    let result = await validateRecaptcha(token, "payment", {
      scoreThreshold: 0.3,
    });
    expect(result.success).toBe(true);

    // Standard form - should pass with 0.5 threshold
    mockFetch.mockResolvedValueOnce(mockResponse);
    result = await validateRecaptcha(token, "payment", {
      scoreThreshold: 0.5,
    });
    expect(result.success).toBe(true);

    // High-risk form (payment) - should fail with 0.7 threshold
    mockFetch.mockResolvedValueOnce(mockResponse);
    result = await validateRecaptcha(token, "payment", {
      scoreThreshold: 0.7,
    });
    expect(result.success).toBe(false);
  });

  it("should work without action verification", async () => {
    const formData = new FormData();
    formData.set("recaptchaToken", "valid-token");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.8,
        action: "any_action",
        challenge_ts: "2024-01-01T00:00:00Z",
        hostname: "localhost",
      }),
    });

    const token = getRecaptchaToken(formData);
    // No expectedAction provided
    const result = await validateRecaptcha(token);

    expect(result.success).toBe(true);
    expect(result.score).toBe(0.8);
  });

  it("should handle missing token gracefully in production", async () => {
    const formData = new FormData();
    // No recaptchaToken set

    const token = getRecaptchaToken(formData);
    expect(token).toBeNull();

    const result = await validateRecaptcha(token, "contact_form");

    expect(result.success).toBe(false);
    expect(result.error).toBe("reCAPTCHA token is missing");
  });

  it("should skip validation in development when not configured", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;

    expect(isRecaptchaEnabled()).toBe(false);

    const formData = new FormData();
    formData.set("recaptchaToken", "any-token");

    const token = getRecaptchaToken(formData);
    const result = await validateRecaptcha(token, "contact_form");

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should include raw response for debugging", async () => {
    const formData = new FormData();
    formData.set("recaptchaToken", "valid-token");

    const rawResponse = {
      success: true,
      score: 0.85,
      action: "contact_form",
      challenge_ts: "2024-01-01T12:00:00Z",
      hostname: "example.com",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => rawResponse,
    });

    const token = getRecaptchaToken(formData);
    const result = await validateRecaptcha(token, "contact_form");

    expect(result.rawResponse).toEqual(rawResponse);
  });
});
