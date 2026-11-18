import { describe, expect, it } from "vitest";
import { canTransition, confirmationIsFresh, trustState } from "./trust";

const now = new Date("2026-11-17T10:00:00Z");
const fresh = new Date("2026-11-15T10:00:00Z");
const stale = new Date("2026-11-01T10:00:00Z");

describe("trustState", () => {
  it("treats mapped geometry as mapped regardless of supply", () => {
    expect(trustState({ verification: "mapped", lastConfirmedAt: fresh, openSupply: 9 })).toBe("mapped");
  });

  it("requires verification, open supply and a fresh confirmation for active", () => {
    expect(trustState({ verification: "active", lastConfirmedAt: fresh, openSupply: 1 })).toBe("active");
    expect(trustState({ verification: "active", lastConfirmedAt: stale, openSupply: 1 })).toBe("claimed");
    expect(trustState({ verification: "active", lastConfirmedAt: fresh, openSupply: 0 })).toBe("claimed");
    expect(trustState({ verification: "active", lastConfirmedAt: null, openSupply: 1 })).toBe("claimed");
  });

  it("never upgrades an unverified claim to active", () => {
    expect(trustState({ verification: "claimed", lastConfirmedAt: fresh, openSupply: 5 })).toBe("claimed");
  });
});

describe("confirmationIsFresh", () => {
  it("is fresh within seven days and stale after", () => {
    expect(confirmationIsFresh(new Date(now.getTime() - 6 * 86_400_000), now)).toBe(true);
    expect(confirmationIsFresh(new Date(now.getTime() - 8 * 86_400_000), now)).toBe(false);
    expect(confirmationIsFresh(null, now)).toBe(false);
  });
});

describe("canTransition", () => {
  const base = { state: "sent", kind: "intro", fromUserId: "sender", toUserId: "owner", action: "accept" as const };

  it("lets only the recipient accept or decline", () => {
    expect(canTransition({ ...base, actorId: "owner" })).toBe(true);
    expect(canTransition({ ...base, actorId: "sender" })).toBe(false);
    expect(canTransition({ ...base, actorId: "owner", action: "decline" })).toBe(true);
  });

  it("lets only the sender withdraw", () => {
    expect(canTransition({ ...base, actorId: "sender", action: "withdraw" })).toBe(true);
    expect(canTransition({ ...base, actorId: "owner", action: "withdraw" })).toBe(false);
  });

  it("rejects transitions on closed requests", () => {
    for (const state of ["accepted", "declined", "withdrawn"]) {
      expect(canTransition({ ...base, state, actorId: "owner" })).toBe(false);
      expect(canTransition({ ...base, state, actorId: "sender", action: "withdraw" })).toBe(false);
    }
  });

  it("rejects an unowned listing (no recipient)", () => {
    expect(canTransition({ ...base, toUserId: null, actorId: "sender" })).toBe(false);
  });
});
