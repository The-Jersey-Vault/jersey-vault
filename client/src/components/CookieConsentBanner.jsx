import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "jv_cookie_consent_v1";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch (_) {}
  }, []);

  const handleChoice = (accepted) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, accepted ? "accepted" : "declined");
    } catch (_) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10, 10, 10, 0.96)",
        borderTop: "1px solid #222",
        backdropFilter: "blur(8px)",
        padding: "16px 24px",
        zIndex: 9999,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        fontFamily: "'Barlow', sans-serif",
        color: "#ccc",
        fontSize: "13px",
      }}
    >
      <div style={{ maxWidth: "780px", lineHeight: "1.5" }}>
        We use essential cookies to maintain your shopping cart and secure your session, and anonymous analytics to improve your experience. See our{" "}
        <Link to="/privacy" style={{ color: "#39ff14", textDecoration: "underline", fontWeight: 600 }}>
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link to="/terms" style={{ color: "#39ff14", textDecoration: "underline", fontWeight: 600 }}>
          Terms of Service
        </Link>.
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => handleChoice(false)}
          style={{
            background: "transparent",
            color: "#aaa",
            border: "1px solid #444",
            padding: "8px 16px",
            borderRadius: "4px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            letterSpacing: "1px",
            cursor: "pointer",
            fontSize: "13px",
            textTransform: "uppercase",
          }}
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={() => handleChoice(true)}
          style={{
            background: "#39ff14",
            color: "#000",
            border: "none",
            padding: "8px 18px",
            borderRadius: "4px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            letterSpacing: "1px",
            cursor: "pointer",
            fontSize: "13px",
            textTransform: "uppercase",
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
