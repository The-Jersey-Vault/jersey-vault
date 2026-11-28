import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { render, screen } from "@testing-library/react";
import GuideIndex from "./pages/guides/GuideIndex";
import NotFoundPage from "./pages/NotFoundPage";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
  useNavigate: () => jest.fn(),
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

test("robots.txt crawler rules allow search bots while protecting private routes", () => {
  const fs = require("fs");
  const path = require("path");
  const robots = fs.readFileSync(path.join(__dirname, "../public/robots.txt"), "utf8").replace(/\r\n/g, "\n");

  expect(robots).toContain("User-agent: *");
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Disallow: /myorders");
  expect(robots).toContain("User-agent: GPTBot\nDisallow: /");
  expect(robots).toContain("User-agent: OAI-SearchBot\nAllow: /");
  expect(robots).toContain("Sitemap: https://www.thejerseyvault.in/sitemap.xml");
});

test("cookie consent banner renders accessible choice controls", () => {
  const CookieConsentBanner = require("./components/CookieConsentBanner").default;
  renderPage(<CookieConsentBanner />);

  expect(screen.getByRole("region", { name: /cookie consent banner/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /accept all/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /essential only/i })).toBeInTheDocument();
});

test("privacy policy page renders account deletion and erasure rights", () => {
  const Privacy = require("./pages/Privacy").default;
  renderPage(<Privacy />);

  expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
  expect(screen.getByText(/your rights & account deletion/i)).toBeInTheDocument();
  expect(screen.getByText(/right to erasure \(account deletion\)/i)).toBeInTheDocument();
});
