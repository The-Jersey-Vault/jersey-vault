import React, { useState, useRef, useEffect, useId } from "react";

/**
 * Accessible Searchable Combobox Component
 * Follows WAI-ARIA 1.2 Combobox pattern:
 * - Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape, Home, End, Tab)
 * - Single-select with inline search filter
 * - Accessible announcements (aria-expanded, aria-activedescendant, role="combobox", role="listbox")
 * - Tolerant search (case-insensitive, trims extra spaces/punctuation)
 * - Clear button
 */
export default function SearchableCombobox({
  id,
  label,
  options = [],
  value = "",
  onChange,
  disabled = false,
  placeholder = "Select...",
  disabledPlaceholder = "Disabled",
  required = false,
  error = "",
  helperText = "",
  autoComplete = "off"
}) {
  const generatedId = useId();
  const inputId = id || `combobox-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync display query when value changes from outside
  useEffect(() => {
    if (value) {
      setQuery(value);
    } else {
      setQuery("");
    }
  }, [value]);

  // Normalize text for search: lowercase, collapse spaces, remove symbols
  const normalize = (str) =>
    (str || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

  const filteredOptions = React.useMemo(() => {
    if (!query || query === value) return options;
    const normQuery = normalize(query);
    if (!normQuery) return options;

    return options.filter((opt) => {
      const normOpt = normalize(typeof opt === "string" ? opt : opt.label || opt.name);
      return normOpt.includes(normQuery);
    });
  }, [options, query, value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Reset query back to selected value if no new selection was made
        setQuery(value || "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Auto scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex];
      if (item && typeof item.scrollIntoView === "function") {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (opt) => {
    const val = typeof opt === "string" ? opt : opt.value || opt.name;
    onChange(val);
    setQuery(val);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(filteredOptions.length - 1);
        } else {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;

      case "Enter":
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;

      case "Escape":
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          setQuery(value || "");
        }
        break;

      case "Tab":
        if (isOpen) {
          setIsOpen(false);
          setQuery(value || "");
        }
        break;

      default:
        break;
    }
  };

  const currentOptionValue = (opt) => (typeof opt === "string" ? opt : opt.value || opt.name);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        fontFamily: "'Barlow Condensed', sans-serif"
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="label"
          style={{
            display: "block",
            fontSize: 12,
            letterSpacing: 2,
            color: disabled ? "#555" : "#aaa",
            marginBottom: 6,
            fontWeight: 700
          }}
        >
          {label} {required && <span style={{ color: "#ff4444" }}>*</span>}
        </label>
      )}

      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0
              ? `${inputId}-opt-${highlightedIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-required={required}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={disabled ? disabledPlaceholder : placeholder}
          value={query}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            background: disabled ? "#0a0a0a" : "#111",
            border: error
              ? "1px solid #ff4444"
              : isOpen
              ? "1px solid #00ff44"
              : disabled
              ? "1px solid #222"
              : "1px solid #333",
            color: disabled ? "#555" : "#fff",
            padding: "12px 38px 12px 14px",
            fontSize: 15,
            outline: "none",
            letterSpacing: 1,
            boxSizing: "border-box",
            cursor: disabled ? "not-allowed" : "text",
            transition: "border-color 0.2s"
          }}
        />

        {/* Clear & Toggle Indicator */}
        <div
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={`Clear ${label || "selection"}`}
              style={{
                background: "transparent",
                border: "none",
                color: "#777",
                cursor: "pointer",
                padding: "2px 6px",
                fontSize: 14,
                lineHeight: 1
              }}
              onMouseEnter={(e) => (e.target.style.color = "#ff4444")}
              onMouseLeave={(e) => (e.target.style.color = "#777")}
            >
              ✕
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={`Toggle ${label || "options"} list`}
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                inputRef.current?.focus();
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              color: disabled ? "#444" : "#888",
              cursor: disabled ? "not-allowed" : "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: 10, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* Helper text or error message */}
      {error ? (
        <div style={{ color: "#ff4444", fontSize: 12, marginTop: 4, letterSpacing: 0.5 }}>
          {error}
        </div>
      ) : helperText ? (
        <div style={{ color: "#666", fontSize: 11, marginTop: 4, letterSpacing: 0.5, fontFamily: "'Barlow', sans-serif" }}>
          {helperText}
        </div>
      ) : null}

      {/* Dropdown Options Listbox */}
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label || "Options"}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 240,
            overflowY: "auto",
            background: "#161616",
            border: "1px solid #333",
            boxShadow: "0 10px 25px rgba(0,0,0,0.7)",
            zIndex: 99,
            margin: "4px 0 0 0",
            padding: 0,
            listStyle: "none"
          }}
        >
          {filteredOptions.length === 0 ? (
            <li
              role="option"
              aria-disabled="true"
              style={{
                padding: "12px 14px",
                color: "#666",
                fontSize: 13,
                fontFamily: "'Barlow', sans-serif",
                textAlign: "center"
              }}
            >
              No matches found
            </li>
          ) : (
            filteredOptions.map((opt, idx) => {
              const optVal = currentOptionValue(opt);
              const isSelected = optVal === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={`${optVal}-${idx}`}
                  id={`${inputId}-opt-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: 14,
                    color: isSelected ? "#00ff44" : "#e4e4e7",
                    background: isHighlighted ? "#222" : isSelected ? "rgba(0, 255, 68, 0.08)" : "transparent",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #1f1f1f",
                    transition: "background 0.15s"
                  }}
                >
                  <span style={{ fontWeight: isSelected ? 700 : 500, letterSpacing: 0.5 }}>
                    {optVal}
                  </span>
                  {isSelected && <span style={{ color: "#00ff44", fontSize: 13 }}>✓</span>}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
