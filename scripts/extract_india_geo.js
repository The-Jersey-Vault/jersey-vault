const fs = require("fs");
const path = require("path");

console.log("Reading countries+states+cities.json...");
const raw = fs.readFileSync(".temp_geo_db/json/countries+states+cities.json", "utf8");
const countries = JSON.parse(raw);

const india = countries.find(c => c.iso2 === "IN" || c.name === "India");

if (!india) {
  console.error("India not found in dataset!");
  process.exit(1);
}

console.log(`Found India with ${india.states ? india.states.length : 0} states/UTs.`);

const stateMap = {};
let totalCities = 0;

for (const state of (india.states || [])) {
  const stateName = state.name;
  const cities = (state.cities || []).map(city => city.name).sort();
  const uniqueCities = Array.from(new Set(cities));
  stateMap[stateName] = uniqueCities;
  totalCities += uniqueCities.length;
}

const outputData = {
  country: {
    name: "India",
    iso2: "IN",
    iso3: "IND"
  },
  states: Object.keys(stateMap).sort(),
  citiesByState: stateMap,
  source: "https://github.com/dr5hn/countries-states-cities-database"
};

const clientDataDir = path.resolve("client/src/data");
if (!fs.existsSync(clientDataDir)) {
  fs.mkdirSync(clientDataDir, { recursive: true });
}

fs.writeFileSync(path.join(clientDataDir, "indiaLocations.json"), JSON.stringify(outputData, null, 2), "utf8");
console.log(`Saved client/src/data/indiaLocations.json with ${outputData.states.length} states and ${totalCities} cities.`);
