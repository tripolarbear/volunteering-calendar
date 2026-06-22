export type WindowEntry =
  | {
      kind: "url";
      value: string;
    }
  | {
      kind: "file";
      value: string;
    };

export function getWindowEntry(devServerUrl: string | undefined): WindowEntry {
  if (devServerUrl) {
    return {
      kind: "url",
      value: devServerUrl,
    };
  }

  return {
    kind: "file",
    value: "dist/index.html",
  };
}
