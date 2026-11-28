import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main id="main-content" style={{ minHeight: "100vh", background: "#070707", color: "#fff", display: "grid", placeItems: "center", padding: 24, textAlign: "center", fontFamily: "'Barlow', sans-serif" }}>
      <div>
        <p style={{ color: "#39ff14", fontWeight: 800, letterSpacing: 3 }}>404 · PAGE NOT FOUND</p>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, margin: "12px 0" }}>THIS PAGE IS OFFSIDE</h1>
        <p style={{ color: "#aaa", maxWidth: 440, lineHeight: 1.6 }}>That address doesn’t match a page on The Jersey Vault. Head home or browse the teams and collections.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <Link to="/" style={{ background: "#39ff14", color: "#000", padding: "12px 20px", fontWeight: 800, textDecoration: "none" }}>HOME</Link>
          <Link to="/teams" style={{ border: "1px solid #39ff14", color: "#39ff14", padding: "12px 20px", fontWeight: 800, textDecoration: "none" }}>BROWSE TEAMS</Link>
        </div>
      </div>
    </main>
  );
}
