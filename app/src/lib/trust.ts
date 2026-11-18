export type TrustState = "mapped" | "claimed" | "active";

const SEVEN_DAYS_MS = 7 * 86_400_000;

export function confirmationIsFresh(lastConfirmedAt: Date | null | undefined, now = new Date()) {
  return Boolean(lastConfirmedAt && now.getTime() - lastConfirmedAt.getTime() <= SEVEN_DAYS_MS);
}

export function trustState(input: {
  verification: string;
  lastConfirmedAt: Date | null;
  openSupply: number;
}): TrustState {
  if (input.verification === "mapped") return "mapped";
  if (input.verification === "active" && input.openSupply > 0 && confirmationIsFresh(input.lastConfirmedAt)) {
    return "active";
  }
  return "claimed";
}

export const TRUST_COPY: Record<TrustState, { label: string; detail: string }> = {
  mapped: {
    label: "Mapped",
    detail: "Location from licensed map data. This place has not joined CityWalk.",
  },
  claimed: {
    label: "Claimed",
    detail: "Owner verified, but availability has not been confirmed in the last 7 days.",
  },
  active: {
    label: "Active",
    detail: "Owner confirmed availability in the last 7 days.",
  },
};

export type RequestKind = "intro" | "application" | "pg_visit";
export type RequestState = "sent" | "accepted" | "declined" | "withdrawn";

export function canTransition(input: {
  state: RequestState | string;
  kind: RequestKind | string;
  fromUserId: string;
  toUserId: string | null;
  actorId: string;
  action: "accept" | "decline" | "withdraw";
}) {
  if (input.state !== "sent") return false;
  if (input.action === "withdraw") return input.actorId === input.fromUserId;
  return input.actorId === input.toUserId;
}
