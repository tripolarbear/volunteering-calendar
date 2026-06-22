import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BoardScreen } from "./BoardScreen";

describe("BoardScreen", () => {
  it("shows all schedule request titles before opening the writer and hides row bodies", async () => {
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
    expect(screen.getByText("Another student activity")).toBeInTheDocument();
    expect(screen.queryByText("I helped with reading.")).not.toBeInTheDocument();
    expect(screen.queryByText("Helped with math.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Write post" }));

    expect(screen.getByLabelText("Post type")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Schedule request" })).toBeInTheDocument();
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
    expect(screen.getByRole("option", { name: "Schedule request" })).toBeInTheDocument();
    expect(screen.getByText("My reading activity")).toBeInTheDocument();
    expect(screen.getByText("Another student activity")).toBeInTheDocument();
  });

  it("opens own schedule request content as a page-style detail", async () => {
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
        ]}
        tier="student"
        userId="student-1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open My reading activity" }));

    expect(screen.getByRole("article", { name: "Board post detail" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "My reading activity" })).toBeInTheDocument();
    expect(screen.getByText("I helped with reading.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to posts" }));

    expect(screen.getByRole("list", { name: "Board posts" })).toBeInTheDocument();
  });

  it("opens other students' schedule requests as secret posts for students", async () => {
    const user = userEvent.setup();
    render(
      <BoardScreen
        posts={[
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

    await user.click(screen.getByRole("button", { name: "Open Another student activity" }));

    expect(screen.getByRole("heading", { name: "Another student activity" })).toBeInTheDocument();
    expect(screen.getByText("비밀글입니다.")).toBeInTheDocument();
    expect(screen.queryByText("Helped with math.")).not.toBeInTheDocument();
  });
});
