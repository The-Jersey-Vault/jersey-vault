import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { render, screen } from "@testing-library/react";
import GuideIndex from "./pages/guides/GuideIndex";
import NotFoundPage from "./pages/NotFoundPage";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
}), { virtual: true });

function renderPage(ui) {
  return render(<HelmetProvider>{ui}</HelmetProvider>);
}

test("unknown-page screen offers working navigation destinations", () => {
  renderPage(<NotFoundPage />);

  expect(screen.getByRole("heading", { name: /this page is offside/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "HOME" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "BROWSE TEAMS" })).toHaveAttribute("href", "/teams");
});

test("guide index links to the declared foundational guide routes", () => {
  renderPage(<GuideIndex />);

  expect(screen.getByRole("heading", { name: "JERSEY GUIDES" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /size guide/i })).toHaveAttribute("href", "/pages/size-guide");
  expect(screen.getByRole("link", { name: /player version vs fan version/i })).toHaveAttribute(
    "href",
    "/pages/player-version-vs-fan-version"
  );
});
