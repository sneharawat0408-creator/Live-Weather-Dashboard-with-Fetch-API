
const form = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const status = document.getElementById("status");
const currentWeather = document.getElementById("currentWeather");
const forecast = document.getElementById("forecast");

// Weather descriptions
const weatherCodes = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    80: "Rain Showers",
    81: "Moderate Showers",
    82: "Heavy Showers",
    95: "Thunderstorm"
};

// Find city coordinates
async function findCity(name) {

    const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(name)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Search service is not responding.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found!");
    }

    const city = data.results[0];

    return {
        name: city.name,
        country: city.country,
        lat: city.latitude,
        lon: city.longitude
    };
}

// Get weather data
async function getWeather(lat, lon) {

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not load weather data.");
    }

    return await response.json();
}

// Display current weather
function displayCurrentWeather(city, data) {

    const temp = data.current.temperature_2m;
    const code = data.current.weather_code;
    const description = weatherCodes[code] || "Unknown Weather";

    currentWeather.innerHTML = `
        <div class="weather-card">
            <h2>${city.name}, ${city.country}</h2>
            <div class="temperature">${temp}°C</div>
            <p class="weather-description">${description}</p>
        </div>
    `;
}

// Display 5-day forecast
function displayForecast(data) {

    forecast.innerHTML = "";

    const daily = data.daily;

    daily.time.forEach((date, index) => {

        const day = new Date(date + "T00:00:00")
            .toLocaleDateString("en-US", {
                weekday: "short"
            });

        const code = daily.weather_code[index];
        const description = weatherCodes[code] || "Unknown";

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <h3>${day}</h3>
            <p>${description}</p>
            <p>↑ ${daily.temperature_2m_max[index]}°C</p>
            <p>↓ ${daily.temperature_2m_min[index]}°C</p>
        `;

        forecast.appendChild(card);
    });
}

// Search form
form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const cityName = cityInput.value.trim();

    currentWeather.innerHTML = "";
    forecast.innerHTML = "";

    if (!cityName) {
        status.textContent = "Please enter a city name!";
        return;
    }

    status.textContent = "Loading weather...";
    searchBtn.disabled = true;

    try {

        const city = await findCity(cityName);

        const weather = await getWeather(
            city.lat,
            city.lon
        );

        displayCurrentWeather(city, weather);
        displayForecast(weather);

        status.textContent = "Weather loaded successfully!";

        localStorage.setItem("lastCity", cityName);

    } catch (error) {

        status.textContent = error.message;

    } finally {

        searchBtn.disabled = false;

    }
});

// Load last searched city when page opens
window.addEventListener("DOMContentLoaded", function () {

    const lastCity = localStorage.getItem("lastCity");

    if (lastCity) {
        cityInput.value = lastCity;
        form.dispatchEvent(new Event("submit"));
    }

});


