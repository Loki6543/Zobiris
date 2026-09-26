import { expect, it } from "vitest";
import { formatUtcDay } from "../ui/CompareLab";

it("labels Kraken midnight UTC candles by the exchange day, not the viewer's prior local day", () => {
  const stamp = "2026-09-25T00:00:00.000Z";
  expect(new Date(stamp).toLocaleDateString("en-US", { timeZone: "America/Phoenix" })).toBe("9/24/2026");
  expect(formatUtcDay(stamp)).toBe("2026-09-25");
  expect(formatUtcDay(Date.parse(stamp) / 1000)).toBe("2026-09-25");
});
