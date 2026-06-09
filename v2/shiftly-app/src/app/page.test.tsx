import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Page racine", () => {
  it("rend le titre Shiftly v2", () => {
    render(<Home />);
    expect(screen.getByText("Shiftly v2")).toBeInTheDocument();
  });
});
