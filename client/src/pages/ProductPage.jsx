import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "../supabase";
import { express } from "../express";
import BrandLogo from "../components/BrandLogo";
import laliga26Video from "../assets/Laliga26.mp4.mp4";
import { getProductImages, getFirstImage } from "../utils/imageHelpers";
import { fetchProductReviews, addProductReview, uploadReviewImage } from "../utils/reviews";
import ProductSEO from "../components/ProductSEO";
import { generateProductSlug } from "../utils/product-slugs";
import ReactGA from "react-ga4";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// Image Carousel for Product Cards & Gallery
const ProductGallery = memo(function ProductGallery({ imageUrl, alt, onImageClick }) {
  const images = useMemo(() => getProductImages(imageUrl), [imageUrl]);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images.length) {
    return (
      <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0d", fontSize: 64 }}>
        👕
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Main Preview */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#0f0f0f", borderRadius: 4, overflow: "hidden", border: "1px solid #1a1a1a" }}>
        <img
          src={images[activeIdx] || images[0]}
          alt={alt}
          onClick={() => onImageClick && onImageClick(images[activeIdx] || images[0])}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "zoom-in", transition: "transform 0.3s ease" }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        />

        {/* Scanline Animation */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.3), transparent)", animation: "scanline 3s linear infinite" }} />
        </div>

        {/* Previous / Next Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev - 1 + images.length) % images.length); }}
              aria-label="Previous image"
              style={{
                position: "absolute",
                top: "50%",
                left: 10,
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                transition: "background 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#39ff14"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(0,0,0,0.75)"}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev + 1) % images.length); }}
              aria-label="Next image"
              style={{
                position: "absolute",
                top: "50%",
                right: 10,
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                transition: "background 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#39ff14"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(0,0,0,0.75)"}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              style={{
                width: 68,
                height: 68,
                flexShrink: 0,
                padding: 0,
                background: "#111",
                border: idx === activeIdx ? "2px solid #39ff14" : "1px solid #222",
                borderRadius: 4,
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <img src={img} alt={`${alt} thumbnail ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Core Product States
  const [product, setProduct] = useState(null);
  const [team, setTeam] = useState(null);
  const [relatableJerseys, setRelatableJerseys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // User & Auth States
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selection & Purchase States
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Reviews States
  const [jerseyReviews, setJerseyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showWriteReviewForm, setShowWriteReviewForm] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewPhotos, setNewReviewPhotos] = useState([]);
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);
  const [submittingCustomerReview, setSubmittingCustomerReview] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState("");
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [previewReviewPhoto, setPreviewReviewPhoto] = useState(null);

  // Cart & Toast
  const [cart, setCart] = useState(() => {
    try {
      const saved = sessionStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + (item.qty || 1), 0), [cart]);

  // Sync Cart to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("cart", JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user;
      if (u) {
        const nav = u.email?.toLowerCase() === "navneeldutta@gmail.com";
        setUser({ ...u, role: nav ? "admin" : "customer" });
        setIsAdmin(nav);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      if (u) {
        const nav = u.email?.toLowerCase() === "navneeldutta@gmail.com";
        setUser({ ...u });
        setIsAdmin(nav);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Body Scroll Locking for modals
  useEffect(() => {
    if (cartOpen || previewReviewPhoto || showSizeChart) {
      document.body.style.overflow = "hidden";
    } else if (!mobileMenuOpen) {
      document.body.style.overflow = "";
    }
  }, [cartOpen, previewReviewPhoto, showSizeChart, mobileMenuOpen]);

  // Helper to compute size stock
  const getSizeStock = useCallback((j, size) => {
    if (!j) return 0;
    let sStock = j.size_stock;
    if (typeof sStock === "string") {
      try { sStock = JSON.parse(sStock); } catch (_) { sStock = null; }
    }
    if (sStock && typeof sStock === "object") {
      const upper = size.toUpperCase();
      if (sStock[upper] !== undefined) return Number(sStock[upper]) || 0;
      if (sStock[size] !== undefined) return Number(sStock[size]) || 0;
    }
    return j.stock !== undefined ? Number(j.stock) : 0;
  }, []);

  // Fetch Main Product & Relatable Jerseys
  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setLoadError(false);
    setProduct(null);
    setTeam(null);
    setRelatableJerseys([]);
    window.scrollTo({ top: 0, behavior: "smooth" });

    (async () => {
      try {
        // 1. Fetch all products to find slug or id match
        const { data: allProducts, error: pErr } = await express.from("products")
          .select("id,name,price,stock,size_stock,image_url,status,type,team_id,category,sub_category,description,featured")
          .eq("status", "active");

        if (pErr) {
          if (active) {
            setLoadError(true);
            setLoading(false);
          }
          return;
        }

        if (!allProducts || allProducts.length === 0) {
          if (active) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const matched = allProducts.find(
          (p) => generateProductSlug(p.name) === slug || String(p.id) === slug
        );

        if (!matched) {
          if (active) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (active) {
          setProduct(matched);

          // Auto-select first in-stock size
          let bestSize = "M";
          for (const s of SIZES) {
            if (getSizeStock(matched, s) > 0) {
              bestSize = s;
              break;
            }
          }
          setSelectedSize(bestSize);
          setQuantity(1);

          // Track Google Analytics View Item
          ReactGA.event("view_item", {
            currency: "INR",
            value: matched.price,
            items: [{
              item_id: matched.id,
              item_name: matched.name,
              price: matched.price,
              item_category: matched.type
            }]
          });

          // 2. Fetch Team Details & Relatable Jerseys
          if (matched.team_id) {
            try {
              const { data: tData } = await express.from("teams")
                .select("id,name,logo_url")
                .eq("id", matched.team_id)
                .single();
              if (tData && active) setTeam(tData);
            } catch (_) {}

            // Filter relatable jerseys of the same team
            const sameTeamJerseys = allProducts.filter(
              (p) => p.id !== matched.id && p.team_id === matched.team_id
            );
            if (active) setRelatableJerseys(sameTeamJerseys);
          } else {
            // Fallback: match by similar name keywords (e.g. "Madrid", "Barcelona", "Arsenal")
            const words = matched.name.split(" ").filter(w => w.length > 3);
            const similar = allProducts.filter(p => {
              if (p.id === matched.id) return false;
              return words.some(w => p.name.toLowerCase().includes(w.toLowerCase()));
            });
            if (active) setRelatableJerseys(similar.slice(0, 6));
          }
        }
      } catch (err) {
        console.error("ProductPage load error:", err);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug, getSizeStock]);

  // Fetch Reviews when product loads
  useEffect(() => {
    if (!product?.id) {
      setJerseyReviews([]);
      return;
    }
    setLoadingReviews(true);
    fetchProductReviews(product.id)
      .then((revs) => {
        const published = (revs || []).filter((r) => r.is_published !== false);
        setJerseyReviews(published);
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err);
        setJerseyReviews([]);
      })
      .finally(() => setLoadingReviews(false));
  }, [product?.id]);

  // Handle Review Image Upload
  const handleReviewPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReviewPhoto(true);
    setReviewSubmitError("");
    try {
      const url = await uploadReviewImage(file);
      if (url) {
        setNewReviewPhotos((prev) => [...prev, url]);
      } else {
        setReviewSubmitError("Could not process image upload.");
      }
    } catch (_) {
      setReviewSubmitError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingReviewPhoto(false);
    }
  };

  // Handle Submit Customer Review
  const handlePostCustomerReview = async (e) => {
    e.preventDefault();
    if (!product) return;
    if (!newReviewComment.trim()) {
      setReviewSubmitError("Please enter your review feedback.");
      return;
    }
    setSubmittingCustomerReview(true);
    setReviewSubmitError("");
    setReviewSubmitSuccess("");
    try {
      const updated = await addProductReview(product.id, {
        reviewer_name: newReviewerName.trim() || "Customer",
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        photos: newReviewPhotos,
      });
      const published = (updated || []).filter((r) => r.is_published !== false);
      setJerseyReviews(published);
      setReviewSubmitSuccess("✓ Thank you! Your review has been posted successfully.");
      setNewReviewComment("");
      setNewReviewPhotos([]);
      setShowWriteReviewForm(false);
    } catch (_) {
      setReviewSubmitError("Failed to submit review. Please try again.");
    } finally {
      setSubmittingCustomerReview(false);
    }
  };

  // Add to Cart
  const handleAddToCart = () => {
    if (!product) return;
    const stockAvailable = getSizeStock(product, selectedSize);
    if (stockAvailable === 0) {
      showToast("Selected size is currently out of stock.");
      return;
    }

    setCart((prev) => {
      const key = `${product.id}-${selectedSize}`;
      const existing = prev.find((item) => `${item.id}-${item.size}` === key);
      if (existing) {
        const newQty = Math.min(existing.qty + quantity, stockAvailable);
        return prev.map((item) =>
          `${item.id}-${item.size}` === key ? { ...item, qty: newQty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          size: selectedSize,
          qty: quantity,
          image_url: getFirstImage(product.image_url),
          type: product.type || "FAN VERSION",
        },
      ];
    });

    ReactGA.event("add_to_cart", {
      currency: "INR",
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: quantity,
        item_category: selectedSize,
      }],
    });

    showToast(`✓ Added ${quantity}x ${product.name} (${selectedSize}) to cart!`);
    setCartOpen(true);
  };

  // Share Actions
  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("✓ Product link copied to clipboard!");
      });
    } else {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showToast("✓ Product link copied to clipboard!");
    }
  };

  const handleWhatsAppShare = () => {
    if (!product) return;
    const text = `🔥 Check out the ${product.name} on The Jersey Vault for ₹${product.price}!\n\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const selectedSizeStock = product ? getSizeStock(product, selectedSize) : 0;
  const isOutOfStock = product ? product.stock === 0 : false;
  const isPlayerVersion = product?.name?.toUpperCase().includes("PLAYER") || product?.type?.toUpperCase().includes("PLAYER");

  return (
    <div style={{ background: "#070707", color: "#fff", minHeight: "100vh", fontFamily: "'Barlow', sans-serif" }}>
      <Helmet>
        <title>{product ? `${product.name} | The Jersey Vault` : "Jersey Product | The Jersey Vault"}</title>
        <meta name="description" content={product?.description || "Shop official football and cricket jerseys in India. Authentic Thailand Dry-Fit quality, COD available with fast nationwide shipping."} />
      </Helmet>

      {/* STYLES & ANIMATIONS */}
      <style>{`
        @keyframes scanline { 0% { top:-10%; } 100% { top:110%; } }
        @keyframes marquee { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .pdp-nav { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:64px; background:#070707; border-bottom:1px solid #141414; position:sticky; top:0; z-index:900; }
        .pdp-nav-link { color:#ccc; text-decoration:none; font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:14px; letter-spacing:2px; transition:color 0.2s; text-transform:uppercase; }
        .pdp-nav-link:hover { color:#39ff14; }
        .pdp-container { max-width:1200px; margin:0 auto; padding:24px 20px 80px; animation:fadeIn 0.4s ease; }
        .pdp-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; margin-top:20px; }
        .pdp-relatable-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; margin-top:20px; }
        .pdp-card { background:#0a0a0a; border:1px solid #181818; border-radius:4px; overflow:hidden; transition:transform 0.25s, border-color 0.25s, box-shadow 0.25s; cursor:pointer; display:flex; flex-direction:column; }
        .pdp-card:hover { transform:translateY(-4px); border-color:#39ff14; box-shadow:0 8px 24px rgba(57,255,20,0.15); }
        .icon-cart-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; padding:0; background:transparent; border:none; color:#fff; cursor:pointer; }
        .icon-cart-btn:hover { color:#39ff14; }
        .cart-icon-badge { position:absolute; top:0px; right:1px; min-width:18px; height:18px; padding:0 4px; background:#39ff14; color:#000; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:900; line-height:1; border-radius:999px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(57,255,20,0.7); border:1.5px solid #070707; pointer-events:none; }
        .pdp-cta-btn { background:#39ff14; color:#000; border:none; padding:16px 24px; font-family:'Bebas Neue','Barlow Condensed',sans-serif; font-size:22px; font-weight:900; letter-spacing:2px; cursor:pointer; width:100%; border-radius:4px; transition:transform 0.15s, background 0.2s, box-shadow 0.2s; box-shadow:0 0 16px rgba(57,255,20,0.35); text-transform:uppercase; }
        .pdp-cta-btn:hover:not(:disabled) { background:#32e012; transform:translateY(-1px); box-shadow:0 0 24px rgba(57,255,20,0.6); }
        .pdp-cta-btn:active:not(:disabled) { transform:scale(0.99); }
        .pdp-cta-btn:disabled { background:#222; color:#555; cursor:not-allowed; box-shadow:none; }
        .pdp-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); z-index:2000; display:flex; align-items:center; justify-content:center; padding:16px; }
        .pdp-modal-dim { position:absolute; inset:0; background:transparent; border:none; cursor:pointer; }
        .pdp-modal { background:#0a0a0a; border:1px solid #222; border-radius:4px; max-height:92vh; overflow-y:auto; width:100%; position:relative; z-index:2001; }
        .pdp-modal-close { position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10; }
        .pdp-modal-close:hover { background:#39ff14; color:#000; }
        .cart-overlay { position:fixed; inset:0; z-index:2500; display:flex; justify-content:flex-end; }
        .cart-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); border:none; cursor:pointer; }
        .cart-panel { position:relative; width:100%; max-width:420px; height:100%; background:#0a0a0a; border-left:1px solid #222; display:flex; flex-direction:column; z-index:2501; animation:slideLeft 0.3s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideLeft { from { transform:translateX(100%); } to { transform:translateX(0); } }
        @media(max-width:768px) {
          .pdp-desktop-links { display:none !important; }
          .pdp-hamburger { display:flex !important; }
        }
        @media(max-width:868px) {
          .pdp-grid { grid-template-columns:1fr; gap:28px; }
          .pdp-relatable-grid { grid-template-columns:repeat(2, 1fr); gap:12px; }
        }
        @media(max-width:480px) {
          .pdp-container { padding:16px 14px 60px; }
          .pdp-relatable-grid { grid-template-columns:repeat(2, 1fr); gap:10px; }
        }
      `}</style>

      {/* TOP ANNOUNCEMENT TICKER */}
      <div style={{ background: "#39ff14", color: "#000", padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", animation: "marquee 20s linear infinite" }}>
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ display: "inline-flex" }}>
              {["★ FREE SHIPPING ABOVE ₹1099", "★ PREMIUM FAN & PLAYER EDITIONS", "★ EASY 30-DAY RETURNS", "★ COD AVAILABLE", "★ SIZES XS TO XXL"].map(t => (
                <span key={t} style={{ fontWeight: 900, letterSpacing: 2, fontSize: 13, padding: "0 28px" }}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="pdp-nav">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label="Toggle menu"
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "none" }}
          className="pdp-hamburger"
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none"><line x1="2" y1="2" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="2" x2="2" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>

        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <BrandLogo />
        </Link>

        <div className="pdp-desktop-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link to="/" className="pdp-nav-link">HOME</Link>
          <Link to="/#shop" className="pdp-nav-link">SHOP</Link>
          <Link to="/teams" className="pdp-nav-link" style={{ color: "#39ff14" }}>TEAMS</Link>
          <Link to="/tracking" className="pdp-nav-link">TRACK</Link>
          {user ? (
            <button
              type="button"
              className="pdp-nav-link"
              onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              LOGOUT
            </button>
          ) : (
            <Link to="/auth" className="pdp-nav-link">LOGIN</Link>
          )}
          {isAdmin && (
            <button
              type="button"
              className="pdp-nav-link"
              style={{ color: "#39ff14", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onClick={() => navigate("/admin")}
            >
              ⚙ ADMIN
            </button>
          )}

          {/* 26/27 Kits Mini Video */}
          <div
            onClick={() => navigate("/?cat=" + encodeURIComponent("26/27 KITS"))}
            style={{ cursor: "pointer", height: 32, width: 52, borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="26/27 Kits"
          >
            <video
              ref={el => { if (el) { el.muted = true; el.play?.().catch(() => {}); } }}
              src={laliga26Video}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Cart Icon Button */}
          <button
            type="button"
            aria-label="View cart"
            onClick={() => setCartOpen(true)}
            className="icon-cart-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="cart-icon-badge">{cartCount}</span>}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div style={{
          display: mobileMenuOpen ? "flex" : "none",
          flexDirection: "column",
          gap: 16,
          position: "fixed",
          top: 56,
          left: 0,
          right: 0,
          bottom: 0,
          background: "#080808",
          padding: "24px 20px",
          borderTop: "1px solid #1a1a1a",
          zIndex: 9999
        }}>
          <Link to="/" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 18 }}>HOME</Link>
          <Link to="/#shop" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 18 }}>SHOP ALL JERSEYS</Link>
          <Link to="/teams" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ color: "#39ff14", fontSize: 18 }}>TEAMS & CLUBS</Link>
          <Link to="/tracking" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 18 }}>TRACK ORDER</Link>
          {user ? (
            <button
              type="button"
              className="pdp-nav-link"
              onClick={async () => { await supabase.auth.signOut(); setUser(null); setMobileMenuOpen(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontSize: 18 }}
            >
              LOGOUT
            </button>
          ) : (
            <Link to="/auth" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 18 }}>LOGIN / SIGN UP</Link>
          )}
          {isAdmin && (
            <button
              type="button"
              className="pdp-nav-link"
              style={{ color: "#39ff14", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontSize: 18 }}
              onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
            >
              ⚙ ADMIN DASHBOARD
            </button>
          )}
        </div>
      </nav>

      {/* TOAST ALERT */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#39ff14",
          color: "#000",
          padding: "10px 22px",
          borderRadius: "4px",
          fontWeight: 900,
          fontSize: "14px",
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: "1px",
          boxShadow: "0 4px 20px rgba(57,255,20,0.4)",
          zIndex: 9999
        }}>
          {toast}
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="pdp-container">
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div style={{ display: "inline-block", width: 44, height: 44, border: "3px solid #222", borderTopColor: "#39ff14", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }`}</style>
            <p style={{ marginTop: 16, color: "#888", letterSpacing: 2, fontSize: 13 }}>LOADING PRODUCT DETAILS...</p>
          </div>
        ) : loadError ? (
          <div role="alert" style={{ textAlign: "center", padding: "100px 20px" }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginTop: 12 }}>PRODUCT COULD NOT BE LOADED</h1>
            <p style={{ color: "#aaa", fontSize: 14, maxWidth: 440, margin: "10px auto 24px" }}>We couldn’t retrieve this product just now. Please try again, or return to the shop.</p>
            <button type="button" onClick={() => window.location.reload()} style={{ background: "#39ff14", color: "#000", border: 0, fontWeight: 900, fontSize: 14, letterSpacing: 2, padding: "12px 28px", borderRadius: 4, cursor: "pointer", marginRight: 10 }}>TRY AGAIN</button>
            <Link to="/" style={{ display: "inline-block", color: "#39ff14", textDecoration: "none", fontWeight: 900, fontSize: 14, letterSpacing: 2, padding: "12px 20px" }}>RETURN TO HOME</Link>
          </div>
        ) : notFound || !product ? (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{ fontSize: 56 }}>🔍</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginTop: 12 }}>JERSEY NOT FOUND</h1>
            <p style={{ color: "#888", fontSize: 14, maxWidth: 440, margin: "10px auto 24px" }}>
              The jersey you are looking for does not exist or has been retired.
            </p>
            <Link
              to="/"
              style={{
                display: "inline-block",
                background: "#39ff14",
                color: "#000",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 2,
                padding: "12px 28px",
                borderRadius: 4
              }}
            >
              RETURN TO HOME
            </Link>
          </div>
        ) : (
          <>
            {/* BREADCRUMBS */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#777", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16, flexWrap: "wrap" }}>
              <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>HOME</Link>
              <span>/</span>
              <Link to="/teams" style={{ color: "#aaa", textDecoration: "none" }}>TEAMS</Link>
              {team && (
                <>
                  <span>/</span>
                  <span style={{ color: "#39ff14" }}>{team.name}</span>
                </>
              )}
              <span>/</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{product.name}</span>
            </div>

            {/* PRODUCT HERO GRID */}
            <div className="pdp-grid">
              {/* LEFT: IMAGE GALLERY */}
              <div>
                <ProductGallery
                  imageUrl={product.image_url}
                  alt={product.name}
                  onImageClick={(photo) => setPreviewReviewPhoto(photo)}
                />
              </div>

              {/* RIGHT: BUYING ACTIONS & SPECS */}
              <div>
                {/* Version Badge & Stock */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{
                    background: isPlayerVersion ? "rgba(255, 68, 68, 0.15)" : "rgba(57, 255, 20, 0.12)",
                    border: isPlayerVersion ? "1px solid rgba(255, 68, 68, 0.4)" : "1px solid #39ff14",
                    color: isPlayerVersion ? "#ff4444" : "#39ff14",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 2,
                    padding: "4px 10px",
                    borderRadius: 3,
                    fontFamily: "'Barlow Condensed', sans-serif"
                  }}>
                    {product.type || (isPlayerVersion ? "PLAYER VERSION" : "FAN VERSION")}
                  </span>

                  {isOutOfStock ? (
                    <span style={{ color: "#ff4444", fontSize: 12, fontWeight: 800, letterSpacing: 1.5, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      ● SOLD OUT
                    </span>
                  ) : selectedSizeStock <= 3 && selectedSizeStock > 0 ? (
                    <span style={{ color: "#ffaa00", fontSize: 12, fontWeight: 800, letterSpacing: 1.5, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      🔥 ONLY {selectedSizeStock} LEFT IN SIZE {selectedSize}!
                    </span>
                  ) : (
                    <span style={{ color: "#39ff14", fontSize: 12, fontWeight: 800, letterSpacing: 1.5, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      ● IN STOCK & READY TO SHIP
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 4vw, 44px)", letterSpacing: 2, lineHeight: 1.05, margin: "0 0 12px", color: "#fff" }}>
                  {product.name}
                </h1>

                {/* Rating Preview */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ color: "#39ff14", fontSize: 14 }}>★★★★★</span>
                  <span style={{ color: "#aaa", fontSize: 13, fontWeight: 600 }}>
                    {jerseyReviews.length > 0
                      ? `${(jerseyReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / jerseyReviews.length).toFixed(1)} (${jerseyReviews.length} reviews)`
                      : "5.0 (Customer Favorite)"}
                  </span>
                </div>

                {/* Price Display */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: "#39ff14", letterSpacing: 1 }}>
                    ₹{product.price}
                  </span>
                  <span style={{ fontSize: 18, color: "#666", textDecoration: "line-through", fontFamily: "'Bebas Neue', sans-serif" }}>
                    ₹{Math.round(product.price * 1.5)}
                  </span>
                  <span style={{ background: "rgba(57,255,20,0.15)", color: "#39ff14", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 3, letterSpacing: 1 }}>
                    33% OFF
                  </span>
                </div>

                {/* Size Selection */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#ccc", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>
                      SELECT SIZE: <span style={{ color: "#39ff14" }}>{selectedSize}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      style={{ background: "none", border: "none", color: "#39ff14", fontSize: 12, fontWeight: 800, letterSpacing: 1, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                    >
                      📏 SIZE CHART
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {SIZES.map((sz) => {
                      const stock = getSizeStock(product, sz);
                      const isSelected = selectedSize === sz;
                      const isAvail = stock > 0;
                      return (
                        <button
                          key={sz}
                          type="button"
                          disabled={!isAvail}
                          onClick={() => setSelectedSize(sz)}
                          style={{
                            minWidth: 52,
                            height: 44,
                            padding: "0 12px",
                            background: isSelected ? "#39ff14" : isAvail ? "#111" : "#0d0d0d",
                            color: isSelected ? "#000" : isAvail ? "#fff" : "#444",
                            border: isSelected ? "2px solid #39ff14" : isAvail ? "1px solid #282828" : "1px dashed #222",
                            borderRadius: 4,
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: 15,
                            fontWeight: 900,
                            letterSpacing: 1,
                            cursor: isAvail ? "pointer" : "not-allowed",
                            transition: "all 0.15s ease",
                            position: "relative"
                          }}
                        >
                          {sz}
                          {!isAvail && (
                            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 11 }}>
                              ✕
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {isPlayerVersion && (
                    <p style={{ fontSize: 12, color: "#888", marginTop: 8, lineHeight: 1.4 }}>
                      ℹ <strong>Fit Tip:</strong> Player version jerseys have an athletic, slim-fit cut. We recommend choosing one size larger than your regular t-shirt size.
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#ccc", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", marginBottom: 8 }}>
                    QUANTITY:
                  </label>
                  <div style={{ display: "inline-flex", alignItems: "center", background: "#111", border: "1px solid #282828", borderRadius: 4, overflow: "hidden" }}>
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{ width: 40, height: 40, background: "transparent", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      −
                    </button>
                    <span style={{ width: 40, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900 }}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= selectedSizeStock || isOutOfStock}
                      onClick={() => setQuantity(q => q + 1)}
                      style={{ width: 40, height: 40, background: "transparent", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* ADD TO CART ACTION BUTTON */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  <button
                    type="button"
                    disabled={isOutOfStock || selectedSizeStock === 0}
                    onClick={handleAddToCart}
                    className="pdp-cta-btn"
                  >
                    {isOutOfStock || selectedSizeStock === 0 ? "SOLD OUT IN THIS SIZE" : "ADD TO CART"}
                  </button>

                  {/* Share buttons */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      style={{
                        flex: 1,
                        background: "#128C7E",
                        color: "#fff",
                        border: "none",
                        padding: "10px 14px",
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: 1,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontFamily: "'Barlow Condensed', sans-serif"
                      }}
                    >
                      <span>💬</span> SHARE ON WHATSAPP
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      style={{
                        background: "#1a1a1a",
                        color: "#ccc",
                        border: "1px solid #333",
                        padding: "10px 16px",
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        letterSpacing: 1
                      }}
                      title="Copy Link"
                    >
                      🔗 COPY LINK
                    </button>
                  </div>
                </div>

                {/* PERKS / TRUST STRIP */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "16px 0", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#ccc" }}>
                    <span style={{ fontSize: 18, color: "#39ff14" }}>✓</span>
                    <span><strong>Free Shipping</strong> above ₹1099</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#ccc" }}>
                    <span style={{ fontSize: 18, color: "#39ff14" }}>✓</span>
                    <span><strong>COD Available</strong> Pan-India</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#ccc" }}>
                    <span style={{ fontSize: 18, color: "#39ff14" }}>✓</span>
                    <span><strong>Easy 30-Day</strong> Size Exchange</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#ccc" }}>
                    <span style={{ fontSize: 18, color: "#39ff14" }}>✓</span>
                    <span><strong>100% Thailand Master</strong> Fabric</span>
                  </div>
                </div>

                {/* DESCRIPTION */}
                {product.description && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      PRODUCT DETAILS
                    </h3>
                    <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RELATABLE / MORE FROM TEAM */}
            {relatableJerseys.length > 0 && (
              <div style={{ marginTop: 64, borderTop: "1px solid #1a1a1a", paddingTop: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                  <div>
                    <p style={{ color: "#39ff14", fontSize: 12, fontWeight: 900, letterSpacing: 2, margin: 0, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      DISCOVER MORE
                    </p>
                    <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, margin: "4px 0 0", color: "#fff" }}>
                      {team ? `MORE ${team.name.toUpperCase()} JERSEYS` : "SIMILAR POPULAR JERSEYS"}
                    </h2>
                  </div>
                  <Link
                    to={team ? `/teams/${team.name.toLowerCase().replace(/\s+/g, "-")}` : "/#shop"}
                    style={{ color: "#39ff14", fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textDecoration: "none", fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    VIEW ALL →
                  </Link>
                </div>

                <div className="pdp-relatable-grid">
                  {relatableJerseys.slice(0, 6).map((rj) => {
                    const rjSlug = generateProductSlug(rj.name);
                    const rjImg = getFirstImage(rj.image_url);
                    return (
                      <div
                        key={rj.id}
                        className="pdp-card"
                        onClick={() => navigate(`/product/${rjSlug}`)}
                      >
                        <div style={{ width: "100%", aspectRatio: "1/1", background: "#111", overflow: "hidden", position: "relative" }}>
                          {rjImg ? (
                            <img src={rjImg} alt={rj.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>👕</div>
                          )}
                          <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.75)", color: "#39ff14", fontSize: 10, fontWeight: 900, padding: "2px 6px", borderRadius: 2, letterSpacing: 1 }}>
                            {rj.type || "FAN VERSION"}
                          </span>
                        </div>
                        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 6 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
                            {rj.name}
                          </h3>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ color: "#39ff14", fontWeight: 900, fontSize: 15 }}>₹{rj.price}</span>
                            <span style={{ color: "#666", fontSize: 11, textDecoration: "line-through" }}>₹{Math.round(rj.price * 1.5)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* REVIEWS & VERIFIED CUSTOMER EXPERIENCE */}
            <div style={{ marginTop: 64, borderTop: "1px solid #1a1a1a", paddingTop: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, margin: 0, color: "#fff" }}>
                    CUSTOMER REVIEWS & PHOTOS
                  </h2>
                  <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>
                    Verified feedback from real customers across India.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWriteReviewForm((s) => !s)}
                  style={{
                    background: showWriteReviewForm ? "#222" : "#39ff14",
                    color: showWriteReviewForm ? "#fff" : "#000",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 4,
                    fontWeight: 900,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: 1.5,
                    cursor: "pointer"
                  }}
                >
                  {showWriteReviewForm ? "CANCEL" : "★ WRITE A REVIEW"}
                </button>
              </div>

              {/* WRITE A REVIEW ACCORDION */}
              {showWriteReviewForm && (
                <form
                  onSubmit={handlePostCustomerReview}
                  style={{
                    background: "#0c0c0c",
                    border: "1px solid #222",
                    borderRadius: 6,
                    padding: 20,
                    marginBottom: 32,
                    maxWidth: 600
                  }}
                >
                  <h3 style={{ margin: "0 0 16px", fontSize: 18, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, color: "#39ff14" }}>
                    SHARE YOUR EXPERIENCE
                  </h3>

                  {reviewSubmitError && (
                    <div style={{ background: "rgba(255,68,68,0.15)", border: "1px solid #ff4444", color: "#ff4444", padding: "8px 12px", borderRadius: 4, fontSize: 13, marginBottom: 12 }}>
                      {reviewSubmitError}
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#ccc", marginBottom: 6, letterSpacing: 1 }}>
                      YOUR RATING:
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: 24,
                            cursor: "pointer",
                            color: star <= newReviewRating ? "#39ff14" : "#444",
                            padding: 0
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#ccc", marginBottom: 6, letterSpacing: 1 }}>
                      YOUR NAME (OPTIONAL):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul S."
                      value={newReviewerName}
                      onChange={(e) => setNewReviewerName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "#161616",
                        border: "1px solid #333",
                        borderRadius: 4,
                        color: "#fff",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Comment */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#ccc", marginBottom: 6, letterSpacing: 1 }}>
                      YOUR REVIEW:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="How is the quality, fabric, fit, and delivery?"
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "#161616",
                        border: "1px solid #333",
                        borderRadius: 4,
                        color: "#fff",
                        fontSize: 14,
                        outline: "none",
                        resize: "vertical",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Photo Upload */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#ccc", marginBottom: 6, letterSpacing: 1 }}>
                      ADD PHOTOS (OPTIONAL):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingReviewPhoto}
                      onChange={handleReviewPhotoUpload}
                      style={{ fontSize: 12, color: "#aaa" }}
                    />
                    {uploadingReviewPhoto && <span style={{ marginLeft: 8, fontSize: 12, color: "#39ff14" }}>Uploading photo...</span>}
                    {newReviewPhotos.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {newReviewPhotos.map((url, i) => (
                          <img key={i} src={url} alt="Uploaded review preview" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, border: "1px solid #39ff14" }} />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingCustomerReview}
                    style={{
                      background: "#39ff14",
                      color: "#000",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: 4,
                      fontWeight: 900,
                      fontFamily: "'Bebas Neue', sans-serif",
                      letterSpacing: 1.5,
                      fontSize: 16,
                      cursor: submittingCustomerReview ? "not-allowed" : "pointer"
                    }}
                  >
                    {submittingCustomerReview ? "SUBMITTING..." : "SUBMIT REVIEW"}
                  </button>
                </form>
              )}

              {reviewSubmitSuccess && (
                <div style={{ background: "rgba(57,255,20,0.12)", border: "1px solid #39ff14", color: "#39ff14", padding: "10px 16px", borderRadius: 4, fontSize: 14, marginBottom: 20 }}>
                  {reviewSubmitSuccess}
                </div>
              )}

              {/* Reviews List */}
              {loadingReviews ? (
                <p style={{ color: "#666", fontSize: 14 }}>Loading reviews...</p>
              ) : jerseyReviews.length === 0 ? (
                <div style={{ padding: "32px 20px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 4, textAlign: "center" }}>
                  <p style={{ color: "#888", fontSize: 14, margin: "0 0 12px" }}>
                    Be the first verified fan to review the {product.name}!
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowWriteReviewForm(true)}
                    style={{ background: "#1a1a1a", border: "1px solid #333", color: "#39ff14", padding: "8px 16px", borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: 1 }}
                  >
                    LEAVE THE FIRST REVIEW
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {jerseyReviews.map((rev, idx) => (
                    <div key={idx} style={{ background: "#0c0c0c", border: "1px solid #181818", borderRadius: 4, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#39ff14", fontSize: 13 }}>
                          {"★".repeat(rev.rating || 5)}
                          <span style={{ color: "#444" }}>{"★".repeat(5 - (rev.rating || 5))}</span>
                        </span>
                        <span style={{ fontSize: 11, color: "#666" }}>
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString("en-IN") : "Verified Purchase"}
                        </span>
                      </div>
                      <p style={{ color: "#ddd", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                        "{rev.comment}"
                      </p>
                      {rev.photos && rev.photos.length > 0 && (
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          {rev.photos.map((p, pIdx) => (
                            <img
                              key={pIdx}
                              src={p}
                              alt="Customer review photo"
                              onClick={() => setPreviewReviewPhoto(p)}
                              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4, border: "1px solid #222", cursor: "zoom-in" }}
                            />
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid #151515", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#39ff14", fontSize: 12 }}>✓</span>
                        <span style={{ fontSize: 11, color: "#888", fontWeight: 700, letterSpacing: 0.5 }}>
                          {rev.reviewer_name || "Verified Fan"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMPREHENSIVE SEO & SCHEMA LAYER */}
            <ProductSEO jersey={product} reviews={jerseyReviews} />
          </>
        )}
      </div>

      {/* SIZE CHART MODAL */}
      {showSizeChart && (
        <div className="pdp-modal-bg">
          <button type="button" className="pdp-modal-dim" aria-label="Close modal" onClick={() => setShowSizeChart(false)} />
          <div className="pdp-modal" style={{ maxWidth: 600, padding: 24 }}>
            <button type="button" className="pdp-modal-close" onClick={() => setShowSizeChart(false)}>✕</button>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, margin: "0 0 8px", color: "#39ff14" }}>
              JERSEY SIZE GUIDE (INCHES)
            </h2>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 20px" }}>
              Measurements refer to body width (chest pit-to-pit) and jersey length.
            </p>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left", marginBottom: 20 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333", color: "#aaa" }}>
                  <th style={{ padding: "8px 12px" }}>SIZE</th>
                  <th style={{ padding: "8px 12px" }}>CHEST (IN)</th>
                  <th style={{ padding: "8px 12px" }}>LENGTH (IN)</th>
                  <th style={{ padding: "8px 12px" }}>BODY WEIGHT (KG)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: "XS", c: "36 - 38", l: "26", w: "50 - 58" },
                  { s: "S", c: "38 - 40", l: "27", w: "58 - 66" },
                  { s: "M", c: "40 - 42", l: "28", w: "66 - 75" },
                  { s: "L", c: "42 - 44", l: "29", w: "75 - 84" },
                  { s: "XL", c: "44 - 46", l: "30", w: "84 - 92" },
                  { s: "XXL", c: "46 - 48", l: "31", w: "92 - 102" }
                ].map((row) => (
                  <tr key={row.s} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "10px 12px", color: "#39ff14", fontWeight: 900 }}>{row.s}</td>
                    <td style={{ padding: "10px 12px", color: "#ddd" }}>{row.c}</td>
                    <td style={{ padding: "10px 12px", color: "#ddd" }}>{row.l}</td>
                    <td style={{ padding: "10px 12px", color: "#888" }}>{row.w}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: "#111", padding: 14, borderRadius: 4, border: "1px solid #222", fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 6px", color: "#fff", fontWeight: 700 }}>Version Comparison:</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li><strong>Fan Version:</strong> Standard relaxed cut. Order your regular size.</li>
                <li><strong>Player Version:</strong> Ultra-slim athletic cut. Order 1 size up.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* FULL RESOLUTION REVIEW PHOTO PREVIEW */}
      {previewReviewPhoto && (
        <div className="pdp-modal-bg" onClick={() => setPreviewReviewPhoto(null)}>
          <button type="button" className="pdp-modal-dim" aria-label="Close image preview" />
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", zIndex: 2001 }}>
            <button
              type="button"
              className="pdp-modal-close"
              onClick={() => setPreviewReviewPhoto(null)}
              style={{ top: -16, right: -16 }}
            >
              ✕
            </button>
            <img
              src={previewReviewPhoto}
              alt="Full view"
              style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 4, boxShadow: "0 0 30px rgba(0,0,0,0.9)" }}
            />
          </div>
        </div>
      )}

      {/* SLIDE-OUT CART PANEL */}
      {cartOpen && (
        <div className="cart-overlay">
          <button
            type="button"
            className="cart-backdrop"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          />
          <div className="cart-panel">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, margin: 0, color: "#fff" }}>
                YOUR CART ({cartCount})
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                style={{ background: "none", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer", padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Free Shipping Progress */}
            {(() => {
              const subtotal = cart.reduce((s, it) => s + (it.price * (it.qty || 1)), 0);
              const remaining = Math.max(0, 1099 - subtotal);
              const pct = Math.min(100, (subtotal / 1099) * 100);
              return (
                <div style={{ background: "#111", padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, letterSpacing: 1, color: remaining === 0 ? "#39ff14" : "#ccc", marginBottom: 6 }}>
                    <span>{remaining === 0 ? "🎉 YOU QUALIFY FOR FREE SHIPPING!" : `ADD ₹${remaining} MORE FOR FREE SHIPPING`}</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ width: "100%", height: 4, background: "#222", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#39ff14", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })()}

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#666" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>YOUR CART IS EMPTY</p>
                  <p style={{ margin: "6px 0 16px", fontSize: 13, color: "#888" }}>Explore our latest club and national team drops.</p>
                  <button
                    type="button"
                    onClick={() => { setCartOpen(false); navigate("/#shop"); }}
                    style={{ background: "#39ff14", color: "#000", border: "none", padding: "10px 20px", borderRadius: 4, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, cursor: "pointer" }}
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${item.size}-${idx}`} style={{ display: "flex", gap: 12, paddingBottom: 14, borderBottom: "1px solid #161616" }}>
                    <img src={item.image_url} alt={item.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4, background: "#111" }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5 }}>
                        {item.name}
                      </h4>
                      <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>
                        Size: <span style={{ color: "#39ff14", fontWeight: 700 }}>{item.size}</span> · ₹{item.price}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #282828", borderRadius: 3, background: "#0e0e0e" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setCart(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(1, (it.qty || 1) - 1) } : it));
                            }}
                            style={{ width: 26, height: 26, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}
                          >
                            −
                          </button>
                          <span style={{ width: 24, textAlign: "center", fontSize: 12, fontWeight: 800 }}>{item.qty || 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCart(prev => prev.map((it, i) => i === idx ? { ...it, qty: (it.qty || 1) + 1 } : it));
                            }}
                            style={{ width: 26, height: 26, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCart(prev => prev.filter((_, i) => i !== idx));
                          }}
                          style={{ background: "none", border: "none", color: "#ff4444", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ padding: "16px 20px", borderTop: "1px solid #1a1a1a", background: "#0d0d0d" }}>
                {(() => {
                  const subtotal = cart.reduce((s, it) => s + (it.price * (it.qty || 1)), 0);
                  const isFreeShip = subtotal >= 1099;
                  const shipping = isFreeShip ? 0 : 99;
                  const total = subtotal + shipping;
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 6 }}>
                        <span>Subtotal</span>
                        <span style={{ color: "#fff", fontWeight: 700 }}>₹{subtotal}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 12 }}>
                        <span>Estimated Shipping</span>
                        <span style={{ color: isFreeShip ? "#39ff14" : "#fff", fontWeight: 700 }}>
                          {isFreeShip ? "FREE" : `₹${shipping}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#fff", fontWeight: 900, marginBottom: 16, borderTop: "1px solid #1f1f1f", paddingTop: 10, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        <span>TOTAL</span>
                        <span style={{ color: "#39ff14" }}>₹{total}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCartOpen(false);
                          navigate("/checkout");
                        }}
                        className="pdp-cta-btn"
                        style={{ fontSize: 18, padding: "14px 20px" }}
                      >
                        PROCEED TO CHECKOUT →
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
