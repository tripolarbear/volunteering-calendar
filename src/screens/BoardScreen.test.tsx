import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BoardScreen } from "./BoardScreen";

describe("BoardScreen", () => {
  it("lets students create introduction and lesson plan posts", () => {
    render(<BoardScreen posts={[]} tier="student" userId="student-1" />);

    expect(screen.getByRole("option", { name: "Volunteer intro" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lesson plan" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Notice" })).not.toBeInTheDocument();
  });

  it("lets teachers create notices", () => {
    render(<BoardScreen posts={[]} tier="teacher" userId="teacher-1" />);

    expect(screen.getByRole("option", { name: "Notice" })).toBeInTheDocument();
  });
});
