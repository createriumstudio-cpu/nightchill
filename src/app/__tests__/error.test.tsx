import { render, screen, fireEvent } from "@testing-library/react";
import ErrorPage from "../error";

describe("ErrorPage", () => {
  it("renders error message", () => {
    const mockReset = jest.fn();
    render(
      <ErrorPage error={new Error("test") as Error & { digest?: string }} reset={mockReset} />
    );
    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
  });

  it("renders reload button that calls reset", () => {
    const mockReset = jest.fn();
    render(
      <ErrorPage error={new Error("test") as Error & { digest?: string }} reset={mockReset} />
    );
    const resetButton = screen.getByText("再読み込み");
    expect(resetButton).toBeInTheDocument();
    fireEvent.click(resetButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("renders link to home", () => {
    const mockReset = jest.fn();
    render(
      <ErrorPage error={new Error("test") as Error & { digest?: string }} reset={mockReset} />
    );
    const homeLink = screen.getByRole("link", { name: "トップに戻る" });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
