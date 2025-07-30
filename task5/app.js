// -------- Helpers --------
const $ = (sel) => document.querySelector(sel);

const WMO_CODES = new Map([
  [0, "Clear sky ☀️"],
  [1, "Mainly clear 🌤️"], [2, "Partly cloudy ⛅"], [3, "Overcast ☁️"],
  [45, "Fog 🌫️"], [48, "Rime fog 🌫️"],
  [51, "Light drizzle 🌦️"], [53, "Moderate drizzle 🌦️"], [55, "Dense drizzle 🌧️"],
  [56, "Light freezing drizzle 🧊"], [57, "Dense freezing drizzle 🧊"],
  [61, "Slight rain 🌧️"], [63, "Moderate rain 🌧️"], [65, "Heavy rain 🌧️"],
  [66, "Light freezing rain 🧊"], [67, "Heavy freezing rain 🧊"],
  [71, "Slight snow 🌨️"], [73, "Moderate snow 🌨️"], [75, "Heavy snow ❄️"],
  [77, "Snow grains ❄️"],
  [80, "Slight rain showers 🌦️"], [81, "Moderate rain showers 🌦️"], [82, "Violent rain showers 🌧️"],
  [85, "Slight snow showers 🌨️"], [86, "Heavy snow showers ❄️"],
  [95, "Thunderstorm ⛈️"], [96, "Thunderstorm with hail ⛈️"], [99, "Severe thunderstorm with hail ⛈️"]
]);

function degToCompass(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE",
                "S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function showStatus(msg) {
  $("#status").textContent = msg || "";
}

function showCard(show) {
  $("#weatherCard").classList.toggle("hidden", !show);
}

// -------- Fetchers (Open-Meteo: no API key) --------
async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error("City not found");
  const r = data.results[0];
  return {
    lat: r.latitude,
    lon: r.longitude,
    place: `${r.name}${r.admin1 ? ", " + r.admin1 : ""}${r.country ? ", " + r.country : ""}`
  };
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
              `wind_speed_10m,wind_direction_10m,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API failed");
  return res.json();
}

// -------- Renderers --------
function renderWeather(place, data) {
  const c = data.current;

  $("#placeName").textContent = place;
  $("#temperature").textContent = Math.round(c.temperature_2m);
  $("#feelsLike").textContent = Math.round(c.apparent_temperature);
  $("#humidity").textContent = c.relative_humidity_2m;
  $("#windSpeed").textContent = Math.round(c.wind_speed_10m);
  $("#windDir").textContent = c.wind_direction_10m;
  $("#condition").textContent = WMO_CODES.get(c.weather_code) || `Code ${c.weather_code}`;

  const updated = new Date(c.time);
  $("#updatedAt").textContent = `Updated: ${updated.toLocaleString()}`;

  showCard(true);
}

// -------- Actions --------
async function handleCitySearch(e) {
  e.preventDefault();
  const name = $("#cityInput").value.trim();
  if (!name) { showStatus("Please enter a city name."); return; }

  try {
    showStatus("Searching city…");
    const { lat, lon, place } = await geocodeCity(name);

    showStatus("Fetching weather…");
    const data = await fetchWeather(lat, lon);

    renderWeather(place, data);
    showStatus("");
  } catch (err) {
    showCard(false);
    showStatus(err.message || "Something went wrong.");
  }
}

function handleGeo() {
  if (!navigator.geolocation) {
    showStatus("Geolocation is not supported in this browser.");
    return;
  }

  showStatus("Getting your location…");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Reverse geocode (best-effort, using same API)
      let place = "Your Location";
      try {
        const rev = await fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`
        );
        if (rev.ok) {
          const data = await rev.json();
          if (data && data.results && data.results[0]) {
            const r = data.results[0];
            place = `${r.name}${r.admin1 ? ", " + r.admin1 : ""}${r.country ? ", " + r.country : ""}`;
          }
        }
      } catch {}

      showStatus("Fetching weather…");
      const weather = await fetchWeather(lat, lon);
      renderWeather(place, weather);
      showStatus("");
    } catch (err) {
      showCard(false);
      showStatus(err.message || "Failed to fetch weather.");
    }
  }, (err) => {
    showStatus(err.message || "Unable to get your location.");
  }, { enableHighAccuracy: true, timeout: 10000 });
}

// -------- Wire-up --------
document.getElementById("searchForm").addEventListener("submit", handleCitySearch);
document.getElementById("geoBtn").addEventListener("click", handleGeo);

