import { describe, expect, it } from "vitest";
import { distanceLabel, money, payLabel, requestStateClass, timeAgo } from "./format";

describe("payLabel", () => {
  it("formats salaries, ranges and missing pay honestly", () => {
    expect(payLabel({ payMin: 850000, payMax: 1200000, payPeriod: "month" })).toBe("₹8,50,000–₹12,00,000/month");
    expect(payLabel({ payMin: 30000, payMax: 30000, payPeriod: "month" })).toBe("₹30,000/month");
    expect(payLabel({ payMin: null, payMax: null, payPeriod: null })).toBe("Pay not listed");
  });

  it("formats Indian digit grouping", () => {
    expect(money(125000)).toBe("₹1,25,000");
    expect(money(null)).toBe("—");
  });
});

describe("distanceLabel", () => {
  it("switches from metres to kilometres", () => {
    expect(distanceLabel(0)).toBe("0 m");
    expect(distanceLabel(812)).toBe("812 m");
    expect(distanceLabel(1540)).toBe("1.5 km");
  });
});

describe("timeAgo", () => {
  it("describes recent dates without claiming precision it lacks", () => {
    expect(timeAgo(null)).toBe("never");
    expect(timeAgo(new Date())).toBe("today");
    expect(timeAgo(new Date(Date.now() - 3 * 86_400_000))).toBe("3 days ago");
  });
});

describe("requestStateClass", () => {
  it("maps each state to a distinct chip", () => {
    expect(requestStateClass("accepted")).toBe("chip chip-ok");
    expect(requestStateClass("declined")).toBe("chip chip-warn");
    expect(requestStateClass("withdrawn")).toBe("chip");
    expect(requestStateClass("sent")).toBe("chip chip-info");
  });
});
