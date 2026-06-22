import { describe, expect, it } from "vitest";
import { getWindowEntry } from "./windowConfig";

describe("getWindowEntry", () => {
  it("uses the Vite dev server when a dev URL is provided", () => {
    expect(getWindowEntry("http://localhost:5173")).toEqual({
      kind: "url",
      value: "http://localhost:5173",
    });
  });

  it("uses the built app file when no dev URL is provided", () => {
    expect(getWindowEntry(undefined)).toEqual({
      kind: "file",
      value: "dist/index.html",
    });
  });
});
