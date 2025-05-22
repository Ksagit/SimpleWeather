const OPENWEATHERMAP_API_KEY = "";

const weatherInfoDiv = document.getElementById("weather-info");
const locationDiv = document.getElementById("location");
const temperatureDiv = document.getElementById("temperature");
const descriptionDiv = document.getElementById("description");
const detailsDiv = document.getElementById("details");
const errorMessageDiv = document.getElementById("error-message");

const addFavoriteForm = document.getElementById("add-favorite-form");
const locationInput = document.getElementById("location-input");
const formErrorMessageDiv = document.getElementById("form-error-message");
const formSuccessMessageDiv = document.getElementById("form-success-message");

const favoriteListUl = document.getElementById("favorite-list");
const favoritesErrorMessageDiv = document.getElementById(
  "favorites-error-message"
);

const favoriteWeatherInfoSection = document.getElementById(
  "favorite-weather-info"
);
const favLocationDiv = document.getElementById("fav-location");
const favTemperatureDiv = document.getElementById("fav-temperature");
const favDescriptionDiv = document.getElementById("fav-description");
const favDetailsDiv = document.getElementById("fav-details");
const favErrorMessageDiv = document.getElementById("fav-error-message");

const DB_NAME = "weatherAppDB";
const DB_VERSION = 1;
let db;

function showGlobalError(message, targetDiv = errorMessageDiv) {
  if (targetDiv) {
    targetDiv.textContent = message;
    targetDiv.style.display = "block";
  }
}

function clearGlobalError(targetDiv = errorMessageDiv) {
  if (targetDiv) {
    targetDiv.textContent = "";
    targetDiv.style.display = "none";
  }
}

function showSuccess(message, targetDiv = formSuccessMessageDiv) {
  if (targetDiv) {
    targetDiv.textContent = message;
    targetDiv.style.display = "block";
    setTimeout(() => {
      targetDiv.style.display = "none";
      targetDiv.textContent = "";
    }, 3000);
  }
}

function fetchWeatherByCoords(latitude, longitude, targetElements = {}) {
  const {
    locDiv = locationDiv,
    tempDiv = temperatureDiv,
    descDiv = descriptionDiv,
    detDiv = detailsDiv,
    errDiv = errorMessageDiv,
    infoSection = weatherInfoDiv,
  } = targetElements;

  clearGlobalError(errDiv);
  if (locDiv) locDiv.textContent = "Pobieranie danych pogodowych...";
  if (tempDiv) tempDiv.textContent = "-";
  if (descDiv) descDiv.textContent = "-";
  if (detDiv) detDiv.innerHTML = "";
  if (infoSection) infoSection.classList.remove("hidden");

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=pl`;

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      displayWeather(data, targetElements);
    })
    .catch((error) => {
      console.error("Błąd podczas pobierania danych pogodowych:", error);
      showGlobalError(
        "Nie udało się pobrać danych pogodowych. Sprawdź połączenie lub spróbuj ponownie.",
        errDiv
      );
      if (locDiv) locDiv.textContent = "Błąd";
      if (tempDiv) tempDiv.textContent = "-";
      if (descDiv) descDiv.textContent = "-";
      if (detDiv) detDiv.innerHTML = "";
    });
}

function fetchWeatherByCity(city, targetElements = {}) {
  const {
    locDiv = locationDiv,
    tempDiv = temperatureDiv,
    descDiv = descriptionDiv,
    detDiv = detailsDiv,
    errDiv = errorMessageDiv,
    infoSection = weatherInfoDiv,
  } = targetElements;

  clearGlobalError(errDiv);
  if (locDiv)
    locDiv.textContent = `Pobieranie danych pogodowych dla ${city}...`;
  if (tempDiv) tempDiv.textContent = "-";
  if (descDiv) descDiv.textContent = "-";
  if (detDiv) detDiv.innerHTML = "";
  if (infoSection) infoSection.classList.remove("hidden");

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=pl`;

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Nie znaleziono miasta: ${city}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      displayWeather(data, targetElements);
    })
    .catch((error) => {
      console.error(
        `Błąd podczas pobierania danych pogodowych dla ${city}:`,
        error
      );
      showGlobalError(
        `Nie udało się pobrać danych pogodowych dla ${city}: ${error.message}`,
        errDiv
      );
      if (locDiv) locDiv.textContent = "Błąd";
      if (tempDiv) tempDiv.textContent = "-";
      if (descDiv) descDiv.textContent = "-";
      if (detDiv) detDiv.innerHTML = "";
    });
}

function displayWeather(data, targetElements = {}) {
  const {
    locDiv = locationDiv,
    tempDiv = temperatureDiv,
    descDiv = descriptionDiv,
    detDiv = detailsDiv,
  } = targetElements;

  if (locDiv) locDiv.textContent = `${data.name}, ${data.sys.country}`;
  if (tempDiv) tempDiv.textContent = `${Math.round(data.main.temp)}°C`;
  if (descDiv) descDiv.textContent = data.weather[0].description;

  if (detDiv) {
    detDiv.innerHTML = `
            <p>Odczuwalna: ${Math.round(data.main.feels_like)}°C</p>
            <p>Wilgotność: ${data.main.humidity}%</p>
            <p>Prędkość wiatru: ${data.wind.speed} m/s</p>
        `;
  }
}

function handlePositionSuccess(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  fetchWeatherByCoords(latitude, longitude);
}

function handlePositionError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      showGlobalError(
        "Brak zgody na dostęp do lokalizacji. Proszę włączyć usługi lokalizacyjne."
      );
      break;
    case error.POSITION_UNAVAILABLE:
      showGlobalError("Informacje o lokalizacji są niedostępne.");
      break;
    case error.TIMEOUT:
      showGlobalError(
        "Przekroczono czas oczekiwania na informację o lokalizacji."
      );
      break;
    case error.UNKNOWN_ERROR:
      showGlobalError("Wystąpił nieznany błąd.");
      break;
  }
  if (locationDiv) locationDiv.textContent = "Lokalizacja niedostępna";
  if (temperatureDiv) temperatureDiv.textContent = "-";
  if (descriptionDiv) descriptionDiv.textContent = "-";
  if (detailsDiv) detailsDiv.innerHTML = "";
}

function getLocationAndWeather() {
  if (navigator.geolocation) {
    if (locationDiv)
      locationDiv.textContent = "Pobieranie Twojej lokalizacji...";
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError
    );
  } else {
    showGlobalError("Twoja przeglądarka nie obsługuje Geolocation API.");
    if (locationDiv) locationDiv.textContent = "Geolocation niedostępna";
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.errorCode);
      showGlobalError(
        "Błąd podczas otwierania bazy danych. Funkcje ulubionych lokalizacji mogą nie działać.",
        favoritesErrorMessageDiv || formErrorMessageDiv
      );
      reject(event.target.errorCode);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains("favorites")) {
        db.createObjectStore("favorites", { keyPath: "name" });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
  });
}

function addFavoriteLocation(locationName) {
  if (!db) {
    console.error("IndexedDB not initialized.");
    showGlobalError(
      "Baza danych nie jest gotowa. Nie można dodać ulubionej lokalizacji.",
      formErrorMessageDiv
    );
    return;
  }

  clearGlobalError(formErrorMessageDiv);
  clearGlobalError(formSuccessMessageDiv);

  const transaction = db.transaction(["favorites"], "readwrite");
  const objectStore = transaction.objectStore("favorites");
  const favorite = { name: locationName };

  const request = objectStore.add(favorite);

  request.onsuccess = () => {
    console.log("Ulubiona lokalizacja dodana:", locationName);
    showSuccess(
      `Lokalizacja "${locationName}" została dodana do ulubionych.`,
      formSuccessMessageDiv
    );
    locationInput.value = "";
  };

  request.onerror = (event) => {
    console.error(
      "Błąd podczas dodawania ulubionej lokalizacji:",
      event.target.error
    );
    if (event.target.error.name === "ConstraintError") {
      showGlobalError(
        `Lokalizacja "${locationName}" jest już na liście ulubionych.`,
        formErrorMessageDiv
      );
    } else {
      showGlobalError(
        `Nie udało się dodać ulubionej lokalizacji "${locationName}".`,
        formErrorMessageDiv
      );
    }
  };
}

function getFavoriteLocations() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("IndexedDB not initialized.");
      return;
    }

    const transaction = db.transaction(["favorites"], "readonly");
    const objectStore = transaction.objectStore("favorites");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error(
        "Błąd podczas pobierania ulubionych lokalizacji:",
        event.target.error
      );
      showGlobalError(
        "Nie udało się pobrać ulubionych lokalizacji.",
        favoritesErrorMessageDiv
      );
      reject(event.target.error);
    };
  });
}

function displayFavoriteLocations() {
  if (!favoriteListUl) return;

  favoriteListUl.innerHTML = "";
  clearGlobalError(favoritesErrorMessageDiv);

  getFavoriteLocations()
    .then((favorites) => {
      if (favorites.length === 0) {
        favoriteListUl.innerHTML =
          '<li>Brak ulubionych lokalizacji. Dodaj je na stronie "Dodaj Ulubione".</li>';
        return;
      }
      favorites.forEach((favorite) => {
        const li = document.createElement("li");
        li.textContent = favorite.name;
        li.classList.add("favorite-item");
        li.dataset.locationName = favorite.name;
        favoriteListUl.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Could not display favorite locations:", error);
      showGlobalError(
        "Nie udało się wyświetlić ulubionych lokalizacji. Sprawdź konsolę.",
        favoritesErrorMessageDiv
      );
    });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        console.log("Service Worker registered successfully:", reg);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
        console.warn(
          "Service Worker registration failed. App may not work offline."
        );
      });
  } else {
    console.warn("Service Workers are not supported by this browser.");
    console.warn("Service Workers not supported. App will not work offline.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const currentYearSpan = document.getElementById("current-year");
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  registerServiceWorker();

  openDatabase()
    .then(() => {
      if (document.body.id === "index-page") {
        getLocationAndWeather();
      }

      if (document.body.id === "favorites-page") {
        displayFavoriteLocations();
        if (favoriteListUl) {
          favoriteListUl.addEventListener("click", (event) => {
            if (event.target.classList.contains("favorite-item")) {
              const locationName = event.target.dataset.locationName;
              const targetElements = {
                locDiv: favLocationDiv,
                tempDiv: favTemperatureDiv,
                descDiv: favDescriptionDiv,
                detDiv: favDetailsDiv,
                errDiv: favErrorMessageDiv,
                infoSection: favoriteWeatherInfoSection,
              };
              fetchWeatherByCity(locationName, targetElements);
            }
          });
        }
      }

      if (document.body.id === "add-favorite-page") {
        if (addFavoriteForm) {
          addFavoriteForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const locationName = locationInput.value.trim();
            if (locationName) {
              addFavoriteLocation(locationName);
            } else {
              showGlobalError("Wprowadź nazwę miasta.", formErrorMessageDiv);
            }
          });
        }
      }
    })
    .catch((error) => {
      console.error("Failed to initialize IndexedDB:", error);
      if (document.body.id === "favorites-page") {
        showGlobalError(
          "Nie udało się zainicjować bazy danych ulubionych. Ulubione mogą nie działać.",
          favoritesErrorMessageDiv
        );
      }
      if (document.body.id === "add-favorite-page") {
        showGlobalError(
          "Nie udało się zainicjować bazy danych ulubionych. Nie można dodawać lokalizacji.",
          formErrorMessageDiv
        );
      }
    });
});
