const API_KEY = "f9f668594c6524a990e868705f2f8c40";

const ulElement = document.querySelector(".weather__info-hours-list");
const form = document.getElementById("weather-form");
const input = document.querySelector(".weather-input");
const headerTitle = document.querySelector(".header__title");
const weatherContainer = document.querySelector(".weather__cards");
const checkbox = document.querySelector('input[type="checkbox"]');
const headerTime = document.querySelector(".header__subtitle");

let lastValidCity = "Moscow";

let lastUnits = "metric";

async function getWeather(city = lastValidCity, units = lastUnits) {
  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${units}`,
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${units}`,
      ),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error("City not found");
    }

    lastValidCity = city;
    checkbox.disabled = false;

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    renderWeatherCard(currentData, units);
    renderWeatherHours(forecastData.list.slice(0, 7));
    saveCityToLocalStorage(currentData.name);
  } catch (error) {
    lastUnits = "metric";
    checkbox.disabled = true;
    checkbox.checked = false;
    weatherContainer.innerHTML = `
      <div class="weather__card-error"><p class="weather__card-error-title">Ошибка! Повторите попытку позже</p></div>`;
    ulElement.innerHTML = "";
    console.error(error);
  } finally {
  }
}

function renderWeatherHours(data) {
  ulElement.innerHTML = "";
  data.forEach((weather) => {
    const liEl = document.createElement("li");
    liEl.classList.add("weather__info-hour-item");
    const {
      dt,
      main: { temp },
      weather: [{ main: weatherStatus }],
    } = weather;

    liEl.innerHTML = `
      <div class="weather__info-hour-container">
        <p class="weather__hour-title">${formatDate(dt)}</p>
        <img
          class="weather__hour-img"
          src="/img/weather_icon/${formatIconWeather(weatherStatus)}.png"
          alt=""
        />
        <p class="weather__hour-temp">${formatTemp(temp)}°</p>
      </div>
    `;
    ulElement.appendChild(liEl);
  });
}

function renderWeatherCard(data, units = "metric") {
  const {
    name: nameCity,
    main: { temp, humidity, pressure },
    wind: { speed },
    visibility,
    dt,
    weather: [{ main: weatherStatus }],
  } = data;

  const tempNum = parseInt(temp);
  const date = new Date(dt * 1000);
  const weatherDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  headerTime.textContent = formatDate(dt);

  const tempSymbol = units === "metric" ? "°C" : "°F";

  weatherContainer.innerHTML = `
    <div class="weather__card">
      <div class="weather__loc">
        <p class="weather__city">${nameCity}</p>
        <img src="/img/loc.png" alt="" />
      </div>
      <div class="weather__info">
        <img class="weather__icon-temp" src="/img/temp.png" alt="" />
        <p class="weather__temp">${tempNum}${tempSymbol}</p>
        <img
          class="weather__icon"
          src="/img/weather_icon/${formatIconWeather(weatherStatus)}_big.png"
          alt=""
        />
      </div>
      <div class="weather__date">
        <p class="weather__date-title">${weatherDate}</p>
      </div>
      <ul class="weather__info-list">
        <li class="weather__info-item">
          <p class="weather__info-item-desc">Humidity</p>
          <p class="weather__info-item-value">${humidity}%</p>
        </li>
        <li class="weather__info-item">
          <p class="weather__info-item-desc">Visiblity</p>
          <p class="weather__info-item-value">${visibility / 1000}km</p>
        </li>
        <li class="weather__info-item">
          <p class="weather__info-item-desc">Air Pressure</p>
          <p class="weather__info-item-value">${pressure}hPa</p>
        </li>
        <li class="weather__info-item">
          <p class="weather__info-item-desc">Wind</p>
          <p class="weather__info-item-value">${speed}mph</p>
        </li>
      </ul>
    </div>
  `;
  changeTheme(weatherStatus);
}

function formatDate(date) {
  const dateFormat = new Date(date * 1000);
  return dateFormat
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

function formatTemp(temp) {
  return Math.round(temp);
}

function formatIconWeather(weatherStatus) {
  switch (weatherStatus) {
    case "Clear":
      return "sunny";
    case "Clouds":
      return "cloudly";
    case "Rain":
    case "Drizzle":
      return "rain";
    case "Thunderstorm":
      return "storm";
    case "Snow":
      return "snow";
    default:
      return "cloudly";
  }
}

checkbox.addEventListener("change", function () {
  const currentUnits = this.checked ? "imperial" : "metric";
  lastUnits = currentUnits;
  getWeather(lastValidCity, currentUnits);
});

function celToFar(value) {
  return Math.round(value * 1.8 + 32);
}

function farToCel(value) {
  return Math.round((value - 32) / 1.8);
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const city = input.value.trim();
  if (city) {
    getWeather(city);
    input.value = "";
  }
});

headerTitle.addEventListener("click", () => {
  getWeather(lastValidCity);
});

function changeTheme(weatherStatus) {
  const themes = {
    Clear: "#1e3c72",
    Clouds: "#2b323c",
    Rain: "#141e30",
    Drizzle: "#141e30",
    Thunderstorm: "#1f1c2c",
    Snow: "#2c3e50",
  };
  document.body.style.background =
    themes[weatherStatus] || "var(--background-color)";
}

function saveCityToLocalStorage(city) {
  if (!city) return;
  const saved = localStorage.getItem("weatherHistory");
  let history = [];
  if (saved && saved !== "undefined") {
    try {
      history = JSON.parse(saved);
    } catch (e) {
      history = [];
    }
  }
  if (!history.includes(city)) {
    history.push(city);
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  }
}

getWeather();
