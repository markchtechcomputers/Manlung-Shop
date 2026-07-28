import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadScript, setBody } from "./helpers/harness.js";

const COUNTDOWN_DOM = `
  <span id="days"></span>
  <span id="hours"></span>
  <span id="minutes"></span>
  <span id="seconds"></span>
`;

const RELEASE = "July 7, 2026 00:00:00";

function digits() {
  return ["days", "hours", "minutes", "seconds"].map(id => document.getElementById(id).innerText);
}

beforeEach(() => {
  vi.useFakeTimers();
  setBody(COUNTDOWN_DOM);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("countdown", () => {
  it("renders the remaining time zero-padded as soon as it loads", async () => {
    vi.setSystemTime(new Date("July 4, 2026 20:30:45"));

    await loadScript("js/countdown.js");

    expect(digits()).toEqual(["02", "03", "29", "15"]);
  });

  it("ticks once a second", async () => {
    vi.setSystemTime(new Date("July 6, 2026 23:59:50"));
    await loadScript("js/countdown.js");
    expect(digits()).toEqual(["00", "00", "00", "10"]);

    vi.advanceTimersByTime(5000);

    expect(digits()).toEqual(["00", "00", "00", "05"]);
  });

  it("shows all zeros once the release date has passed", async () => {
    vi.setSystemTime(new Date(new Date(RELEASE).getTime() + 1000));

    await loadScript("js/countdown.js");

    expect(digits()).toEqual(["00", "00", "00", "00"]);
  });

  it("waits for DOMContentLoaded when the document is still loading", async () => {
    vi.setSystemTime(new Date("July 6, 2026 00:00:00"));
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");

    await loadScript("js/countdown.js");
    expect(digits()).toEqual([undefined, undefined, undefined, undefined]);

    document.dispatchEvent(new window.Event("DOMContentLoaded"));

    expect(digits()).toEqual(["01", "00", "00", "00"]);
  });
});
