import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BoardScreen } from "./BoardScreen";

describe("BoardScreen", () => {
  it("shows notices and student-owned activity reports before opening the writer", async () => {
    const user = userEvent.setup();
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

    expect(screen.queryByLabelText("Post type")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Notices" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "My activity reports" })).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Board posts" })).toBeInTheDocument();
    expect(screen.getByLabelText("Notice post")).toHaveClass("board-row--notice");
    expect(screen.getByText("Bring ID cards")).toBeInTheDocument();
    expect(screen.getByText("My reading activity")).toBeInTheDocument();
    expect(screen.queryByText("Another student activity")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Write post" }));

    expect(screen.getByLabelText("Post type")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Activity Report" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Notice" })).not.toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Write board post" })).toHaveClass("board-writer");
  });

  it("lets teachers write notices and see every activity report", async () => {
    const user = userEvent.setup();
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

    expect(screen.queryByLabelText("Post type")).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Board posts" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "All activity reports" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Write post" }));

    expect(screen.getByRole("option", { name: "Notice" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Activity Report" })).toBeInTheDocument();
    expect(screen.getByText("My reading activity")).toBeInTheDocument();
    expect(screen.getByText("Another student activity")).toBeInTheDocument();
  });
});
