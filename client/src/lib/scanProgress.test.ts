import { describe, expect, it } from "vitest";
import { nextScanProgress, scanStages, stageForProgress } from "./scanProgress";

describe("scan progress UX", () => {
  it("advances smoothly but never claims completion while the request is pending", () => {
    expect(nextScanProgress(12)).toBe(19);
    expect(nextScanProgress(55)).toBe(58);
    expect(nextScanProgress(91)).toBe(92);
    expect(nextScanProgress(92)).toBe(92);
  });

  it("maps progress to the four visible scan stages", () => {
    expect(scanStages).toHaveLength(4);
    expect(stageForProgress(12)).toBe(0);
    expect(stageForProgress(30)).toBe(1);
    expect(stageForProgress(60)).toBe(2);
    expect(stageForProgress(88)).toBe(3);
  });
});
