import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the internal app scaffold", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Volunteer Calendar" })).toBeInTheDocument();
    expect(screen.getByText("Internal app scaffold is ready.")).toBeInTheDocument();
  });
});
