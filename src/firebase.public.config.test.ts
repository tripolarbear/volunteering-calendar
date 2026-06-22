import { describe, expect, it } from "vitest";

import { firebaseConfig } from "./firebase.public.config";

describe("firebaseConfig", () => {
  it("keeps Firebase web app configuration in an explicit public config module", () => {
    expect(firebaseConfig).toEqual({
      apiKey: expect.any(String),
      authDomain: expect.any(String),
      projectId: expect.any(String),
      storageBucket: expect.any(String),
      messagingSenderId: expect.any(String),
      appId: expect.any(String),
    });
  });
});
