import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BoardScreen } from "./BoardScreen";

describe("BoardScreen", () => {
  it("lets students create activity reports only", () => {
    render(
      <BoardScreen
        posts={[
          {
            id: "notice-1",
            type: "notice",
            title: "Bring ID cards",
            body: "Check in at the office.",
            createdBy: "teacher-1",
            createdAt: "now",
            updatedAt: "now",
          },
          {
            id: "report-1",
            type: "activityReport",
            title: "My reading activity",
            body: "I helped with reading.",
            createdBy: "student-1",
            createdAt: "now",
            updatedAt: "now",
          },
          {
            id: "report-2",
            type: "activityReport",
            title: "Another student activity",
            body: "Helped with math.",
            createdBy: "student-2",
            createdAt: "now",
            updatedAt: "now",
          },
        ]}
        tier="student"
        userId="student-1"
      />,
    );

    expect(screen.getByRole("option", { name: "Activity Report" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Notice" })).not.toBeInTheDocument();
    expect(screen.getByText("Bring ID cards")).toBeInTheDocument();
    expect(screen.getByText("My reading activity")).toBeInTheDocument();
    expect(screen.queryByText("Another student activity")).not.toBeInTheDocument();
  });

  it("lets teachers create notices and see every activity report", () => {
    render(
      <BoardScreen
        posts={[
          {
            id: "report-1",
            type: "activityReport",
            title: "My reading activity",
            body: "I helped with reading.",
            createdBy: "student-1",
            createdAt: "now",
            updatedAt: "now",
          },
          {
            id: "report-2",
            type: "activityReport",
            title: "Another student activity",
            body: "Helped with math.",
            createdBy: "student-2",
            createdAt: "now",
            updatedAt: "now",
          },
        ]}
        tier="teacher"
        userId="teacher-1"
      />,
    );

    expect(screen.getByRole("option", { name: "Notice" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Activity Report" })).toBeInTheDocument();
    expect(screen.getByText("My reading activity")).toBeInTheDocument();
    expect(screen.getByText("Another student activity")).toBeInTheDocument();
  });
});
