import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const guides = [
  { title: "Size Guide", description: "Choose a jersey size and understand the fit.", path: "/pages/size-guide" },
  { title: "Player Version vs Fan Version", description: "Compare the two common jersey fits and editions.", path: "/pages/player-version-vs-fan-version" },
  { title: "Buying Guide", description: "Things to check before choosing a football jersey.", path: "/pages/buying-guide" },
  { title: "Care Guide", description: "Wash and store your jersey with care.", path: "/pages/care-guide" },
  { title: "Materials Guide", description: "Learn about common jersey fabrics and finishes.", path: "/pages/materials-guide" },
  { title: "Shipping Guide", description: "Information about delivery and order tracking.", path: "/pages/shipping-guide" },
  { title: "Returns & Exchanges", description: "Read the current returns and exchange guidance.", path: "/pages/returns-guide" },
  { title: "Retro Guide", description: "Explore classic football shirt styles.", path: "/pages/retro-guide" },
];

export default function GuideIndex() {
  return (
    <main id="main-content" style={{ minHeight: "100vh", marginTop: 64, padding: "48px 20px 72px", background: "#0a0a0a", color: "#fff", fontFamily: "'Barlow', sans-serif" }}>
      <Helmet>
        <title>Jersey Guides | The Jersey Vault</title>
        <meta name="description" content="Browse The Jersey Vault’s guides to jersey sizing, versions, buying, care, materials, shipping, and exchanges." />
        <link rel="canonical" href="https://www.thejerseyvault.in/pages/guides" />
      </Helmet>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <nav aria-label="Breadcrumb" style={{ marginBottom: 20, fontSize: 13 }}>
          <Link to="/" style={{ color: "#39ff14", textDecoration: "none" }}>Home</Link>
          <span aria-hidden="true" style={{ margin: "0 8px", color: "#666" }}>/</span>
          <span aria-current="page" style={{ color: "#aaa" }}>Guides</span>
        </nav>
        <h1 style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: "clamp(36px, 6vw, 56px)", letterSpacing: 2, margin: "0 0 12px" }}>JERSEY GUIDES</h1>
        <p style={{ color: "#aaa", maxWidth: 680, lineHeight: 1.7, marginBottom: 32 }}>Browse practical information before choosing and caring for a football jersey. For product-specific measurements or policy details, check the relevant product and current policy pages.</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {guides.map((guide) => (
            <li key={guide.path}>
              <Link to={guide.path} style={{ display: "block", height: "100%", boxSizing: "border-box", padding: 20, border: "1px solid #252525", borderRadius: 6, background: "#111", color: "#fff", textDecoration: "none" }}>
                <h2 style={{ color: "#39ff14", fontSize: 19, margin: "0 0 8px" }}>{guide.title}</h2>
                <p style={{ color: "#aaa", lineHeight: 1.5, margin: 0, fontSize: 14 }}>{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
