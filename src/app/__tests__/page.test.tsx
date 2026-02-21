import { render, screen } from "@testing-library/react";
import Home from "../page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
}));

describe("Home", () => {
  it("renders the hero heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("ふたりの時間");
    expect(heading.textContent).toContain("おもしろく");
  });

  it("renders the futatabito brand", () => {
    render(<Home />);
    const brandElements = screen.getAllByText("futa");
    expect(brandElements.length).toBeGreaterThan(0);
  });

  it("renders feature cards", () => {
    render(<Home />);
    expect(screen.getByText("Howを提案")).toBeInTheDocument();
    expect(screen.getByText("パーソナライズ")).toBeInTheDocument();
    expect(screen.getByText("雰囲気づくり")).toBeInTheDocument();
    expect(screen.getByText("シーン別アドバイス")).toBeInTheDocument();
  });

  it("renders how-it-works steps", () => {
    render(<Home />);
    expect(screen.getByText("シチュエーションを入力")).toBeInTheDocument();
    expect(screen.getByText("あなただけのプランを生成")).toBeInTheDocument();
    expect(screen.getByText("デートを楽しむ")).toBeInTheDocument();
  });

  it("renders CTA links to plan page", () => {
    render(<Home />);
    const planLinks = screen.getAllByRole("link", { name: /プラン|始める/ });
    expect(planLinks.length).toBeGreaterThan(0);
  });
});
