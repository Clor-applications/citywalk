export function money(value: number | null | undefined) {
  if (value == null) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

export function payLabel(input: { payMin: number | null; payMax: number | null; payPeriod: string | null }) {
  if (input.payMin == null) return "Pay not listed";
  const period = input.payPeriod === "month" ? "/month" : input.payPeriod === "day" ? "/day" : "";
  if (input.payMax != null && input.payMax !== input.payMin) {
    return `${money(input.payMin)}–${money(input.payMax)}${period}`;
  }
  return `${money(input.payMin)}${period}`;
}

export function distanceLabel(metres: number) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export const KIND_LABEL: Record<string, string> = {
  company: "Company",
  pg: "PG",
  hotel: "Hotel",
  cafe: "Food",
  cowork: "Cowork / events",
  osm: "Mapped place",
};

export const KIND_ORDER = ["company", "pg", "hotel", "cafe", "cowork", "osm"];

export const REQUEST_KIND_LABEL: Record<string, string> = {
  intro: "Intro request",
  application: "Job application",
  pg_visit: "PG visit request",
};

export const REQUEST_STATE_LABEL: Record<string, string> = {
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export function requestStateClass(state: string) {
  if (state === "accepted") return "chip chip-ok";
  if (state === "declined") return "chip chip-warn";
  if (state === "withdrawn") return "chip";
  return "chip chip-info";
}

export function trustChipClass(state: string) {
  if (state === "active") return "chip chip-ok";
  if (state === "claimed") return "chip chip-warn";
  return "chip";
}

export function timeAgo(date: Date | string | null | undefined) {
  if (!date) return "never";
  const then = typeof date === "string" ? new Date(date) : date;
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}
