import { render, screen } from "@testing-library/react";
import Home from "../page";

describe("Home", () => {
  it("renders the page", () => {
    render(<Home />);
    expect(screen.getByRole("img", { name: /next\.js logo/i })).toBeInTheDocument();
  });
});
