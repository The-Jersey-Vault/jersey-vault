import React, { useMemo } from "react";
import SearchableCombobox from "./SearchableCombobox";
import locationData from "../data/indiaLocations.json";

/**
 * Reusable Dependent Address Selector Component:
 * Country (Single supported country: India, clear & explicit)
 *   └─> State/Region (Populated based on Country, searchable)
 *        └─> City (Populated based on selected State, searchable)
 *
 * Rules:
 * - Country options match actual business shipping destinations (India only).
 * - Changing Country clears State and City.
 * - Changing State clears City immediately.
 * - State is disabled until Country is selected.
 * - City is disabled until State is selected.
 * - Supports legacy values seamlessly if not in dataset.
 */
export default function AddressSelector({
  country = "India",
  state = "",
  city = "",
  onCountryChange,
  onStateChange,
  onCityChange,
  errors = {},
  disabled = false,
  required = true
}) {
  // Supported delivery destinations (India-focused business with Delhivery delivery)
  const countryOptions = useMemo(() => [
    { value: "India", label: "India (Supported Delivery Destination)" }
  ], []);

  // Available states for selected country
  const stateOptions = useMemo(() => {
    if (country === "India") {
      return locationData.states || [];
    }
    return [];
  }, [country]);

  // Available cities for selected state
  const cityOptions = useMemo(() => {
    if (country === "India" && state && locationData.citiesByState[state]) {
      return locationData.citiesByState[state];
    }
    return [];
  }, [country, state]);

  // Handle Country selection
  const handleCountrySelect = (newCountry) => {
    if (newCountry !== country) {
      if (onCountryChange) onCountryChange(newCountry);
      if (onStateChange) onStateChange("");
      if (onCityChange) onCityChange("");
    }
  };

  // Handle State selection
  const handleStateSelect = (newState) => {
    if (newState !== state) {
      if (onStateChange) onStateChange(newState);
      if (onCityChange) onCityChange("");
    }
  };

  // Handle City selection
  const handleCitySelect = (newCity) => {
    if (onCityChange) onCityChange(newCity);
  };

  return (
    <div style={{ display: "contents" }}>
      {/* 1. Country Selector */}
      <div style={{ gridColumn: "1/-1" }}>
        <SearchableCombobox
          id="address-country"
          label="COUNTRY"
          required={required}
          value={country}
          options={countryOptions.map(c => c.value)}
          onChange={handleCountrySelect}
          disabled={disabled}
          placeholder="Select Country..."
          error={errors.country}
          helperText="Currently delivering exclusively across India via Delhivery Express."
        />
      </div>

      {/* 2. State/Region Selector */}
      <div>
        <SearchableCombobox
          id="address-state"
          label="STATE / REGION"
          required={required}
          value={state}
          options={stateOptions}
          onChange={handleStateSelect}
          disabled={disabled || !country}
          placeholder="Select or search state..."
          disabledPlaceholder="Select a country first"
          error={errors.state}
          helperText={!country ? "Select a country first" : `${stateOptions.length} States & UTs available`}
        />
      </div>

      {/* 3. City Selector */}
      <div>
        <SearchableCombobox
          id="address-city"
          label="CITY"
          required={required}
          value={city}
          options={cityOptions}
          onChange={handleCitySelect}
          disabled={disabled || !state}
          placeholder="Select or search city..."
          disabledPlaceholder="Select a state first"
          error={errors.city}
          helperText={!state ? "Select a state/region first" : `${cityOptions.length} cities available`}
        />
      </div>
    </div>
  );
}
