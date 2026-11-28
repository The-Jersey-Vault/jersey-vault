import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchableCombobox from "./SearchableCombobox";
import AddressSelector from "./AddressSelector";

describe("SearchableCombobox Component", () => {
  const options = ["West Bengal", "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi"];

  test("renders label and placeholder with accessibility roles", () => {
    render(
      <SearchableCombobox
        id="test-state"
        label="STATE"
        options={options}
        placeholder="Select state..."
        value=""
        onChange={jest.fn()}
      />
    );

    const combobox = screen.getByRole("combobox", { name: "STATE" });
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute("placeholder", "Select state...");
    expect(combobox).toHaveAttribute("aria-expanded", "false");
  });

  test("opens options listbox on focus or click and filters options case-insensitively", () => {
    render(
      <SearchableCombobox
        id="test-state"
        label="STATE"
        options={options}
        value=""
        onChange={jest.fn()}
      />
    );

    const combobox = screen.getByRole("combobox", { name: "STATE" });
    fireEvent.focus(combobox);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "West Bengal" })).toBeInTheDocument();

    // Type query to filter
    fireEvent.change(combobox, { target: { value: "karn" } });
    expect(screen.getByRole("option", { name: "Karnataka" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "West Bengal" })).not.toBeInTheDocument();
  });

  test("shows 'No matches found' when search has no results", () => {
    render(
      <SearchableCombobox
        id="test-state"
        label="STATE"
        options={options}
        value=""
        onChange={jest.fn()}
      />
    );

    const combobox = screen.getByRole("combobox", { name: "STATE" });
    fireEvent.focus(combobox);
    fireEvent.change(combobox, { target: { value: "xyznonexistent" } });

    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  test("keyboard navigation: arrow keys and Enter select an option", () => {
    const handleChange = jest.fn();
    render(
      <SearchableCombobox
        id="test-state"
        label="STATE"
        options={options}
        value=""
        onChange={handleChange}
      />
    );

    const combobox = screen.getByRole("combobox", { name: "STATE" });
    fireEvent.focus(combobox);
    fireEvent.keyDown(combobox, { key: "ArrowDown" });
    fireEvent.keyDown(combobox, { key: "Enter" });

    expect(handleChange).toHaveBeenCalledWith(options[0]);
  });

  test("clear button clears the selected value", () => {
    const handleChange = jest.fn();
    render(
      <SearchableCombobox
        id="test-state"
        label="STATE"
        options={options}
        value="Maharashtra"
        onChange={handleChange}
      />
    );

    const clearBtn = screen.getByRole("button", { name: "Clear STATE" });
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith("");
  });
});

describe("AddressSelector Component (Country -> State -> City Hierarchy)", () => {
  function TestWrapper() {
    const [country, setCountry] = useState("India");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");

    return (
      <AddressSelector
        country={country}
        state={state}
        city={city}
        onCountryChange={setCountry}
        onStateChange={setState}
        onCityChange={setCity}
      />
    );
  }

  test("preselects India and offers India as the only supported delivery country", () => {
    render(<TestWrapper />);

    const countryInput = screen.getByRole("combobox", { name: /country/i });
    expect(countryInput).toHaveValue("India");
    expect(screen.getByText(/Currently delivering exclusively across India via Delhivery Express/i)).toBeInTheDocument();
  });

  test("state is populated after country is selected; city is disabled until state is selected", () => {
    render(<TestWrapper />);

    const stateInput = screen.getByRole("combobox", { name: /state \/ region/i });
    const cityInput = screen.getByRole("combobox", { name: /city/i });

    expect(stateInput).not.toBeDisabled();
    expect(cityInput).toBeDisabled();
    expect(cityInput).toHaveAttribute("placeholder", "Select a state first");

    // Select a state
    fireEvent.focus(stateInput);
    fireEvent.change(stateInput, { target: { value: "West Bengal" } });
    const wbOption = screen.getByRole("option", { name: "West Bengal" });
    fireEvent.click(wbOption);

    // Now city should be enabled and contain cities of West Bengal
    expect(cityInput).not.toBeDisabled();
    fireEvent.focus(cityInput);
    expect(screen.getByRole("option", { name: "Kolkata" })).toBeInTheDocument();
  });

  test("changing state clears city immediately", () => {
    render(<TestWrapper />);

    const stateInput = screen.getByRole("combobox", { name: /state \/ region/i });
    const cityInput = screen.getByRole("combobox", { name: /city/i });

    // Pick West Bengal -> Kolkata
    fireEvent.focus(stateInput);
    fireEvent.change(stateInput, { target: { value: "West Bengal" } });
    fireEvent.click(screen.getByRole("option", { name: "West Bengal" }));

    fireEvent.focus(cityInput);
    fireEvent.click(screen.getByRole("option", { name: "Kolkata" }));
    expect(cityInput).toHaveValue("Kolkata");

    // Change State to Maharashtra
    fireEvent.focus(stateInput);
    fireEvent.change(stateInput, { target: { value: "Maharashtra" } });
    fireEvent.click(screen.getByRole("option", { name: "Maharashtra" }));

    // City should be cleared
    expect(cityInput).toHaveValue("");
    fireEvent.focus(cityInput);
    expect(screen.getByRole("option", { name: "Mumbai" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Kolkata" })).not.toBeInTheDocument();
  });
});
