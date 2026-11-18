import { describe, expect, it } from "vitest";
import { generateOtp, hashOtp, hashToken, verifyOtpHash } from "./crypto";

const SECRET = "test-secret-that-is-long-enough-000000";

describe("generateOtp", () => {
  it("always returns six digits", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtp / verifyOtpHash", () => {
  it("binds the code to the email", () => {
    const code = "123456";
    const hash = hashOtp(SECRET, "a@example.com", code);
    expect(verifyOtpHash(SECRET, "a@example.com", code, hash)).toBe(true);
    expect(verifyOtpHash(SECRET, "b@example.com", code, hash)).toBe(false);
    expect(verifyOtpHash(SECRET, "a@example.com", "654321", hash)).toBe(false);
  });

  it("rejects hashes of a different length instead of throwing", () => {
    expect(verifyOtpHash(SECRET, "a@example.com", "123456", "short")).toBe(false);
  });
});

describe("hashToken", () => {
  it("is a stable sha256 hex digest", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});
