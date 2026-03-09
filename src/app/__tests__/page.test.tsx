import { render, screen } from "@testing-library/react";
import Home from "../page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
}));

jest.mock("@/components/WeeklyPicksSection", () => {
  return function MockWeeklyPicksSection() {
    return null;
  };
});

describe("Home", () => {
  it("renders the hero heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("どこでもいい");
  });

  it("renders the futatabito brand", () => {
    render(<Home />);
    const brandElements = screen.getAllByText("futa");
    expect(brandElements.length).toBeGreaterThan(0);
  });

  it("renders feature cards", () => {
    render(<Home />);
    expect(screen.getByText("タイムライン提案")).toBeInTheDocument();
    expect(screen.getByText("実在する店舗情報")).toBeInTheDocument();
    expect(screen.getByText("エリア別デートガイド")).toBeInTheDocument();
    expect(screen.getByText("パーソナライズ")).toBeInTheDocument();
  });

  it("renders how-it-works steps", () => {
    render(<Home />);
    expect(screen.getByText("シチュエーションを入力")).toBeInTheDocument();
    expect(screen.getByText("あなただけのプランを生成")).toBeInTheDocument();
    expect(screen.getByText("自信を持ってデートへ")).toBeInTheDocument();
  });

  it("renders CTA links to plan page", () => {
    render(<Home />);
    const planLinks = screen.getAllByRole("link", { name: /プラン|始める/ });
    expect(planLinks.length).toBeGreaterThan(0);
  });
});
