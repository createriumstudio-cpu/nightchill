import { render, screen } from "@testing-library/react";
import NotFound from "../not-found";

describe("NotFound", () => {
  it("renders 404 code", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<NotFound />);
    expect(
      screen.getByText("お探しのページが見つかりません")
    ).toBeInTheDocument();
  });

  it("renders a link to home", () => {
    render(<NotFound />);
    const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders a link to plan page", () => {
    render(<NotFound />);
    const planLink = screen.getByRole("link", { name: "プランを作成する" });
    expect(planLink).toBeInTheDocument();
    expect(planLink).toHaveAttribute("href", "/plan");
  });

  it("uses dark theme colors", () => {
    render(<NotFound />);
    const container = screen.getByText("404").closest("div[class*='bg-']");
    expect(container?.className).toContain("bg-[#0f0f1a]");
  });
});
