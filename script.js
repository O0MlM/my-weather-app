const apiKey = 'ca8c47bda33abdbac753c909fa7f454e';

const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherInfoContainer = document.querySelector('#weather-info-container');
const forecastContainer = document.querySelector('#forecast-container');
const historyList = document.querySelector('#history-list');

const MAX_HISTORY = 8;

function formatDateTime(dt_txt) {
    const date = new Date(dt_txt);
    const options = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    };
    return date.toLocaleString('th-TH', options);
}

function setTheme(weatherData) {
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    const icon = weatherData.weather[0].icon;

    document.body.className = '';

    const isDay = icon.endsWith('d');

    if (isDay) {
        if (weatherMain.includes('clear')) {
            document.body.classList.add('day-clear');
        } else if (weatherMain.includes('cloud')) {
            document.body.classList.add('day-clouds');
        } else if (
            weatherMain.includes('rain') ||
            weatherMain.includes('drizzle') ||
            weatherMain.includes('thunderstorm')
        ) {
            document.body.classList.add('day-rain');
        } else {
            document.body.classList.add('day-clear');
        }
    } else {
        if (weatherMain.includes('clear')) {
            document.body.classList.add('night-clear');
        } else if (weatherMain.includes('cloud')) {
            document.body.classList.add('night-clouds');
        } else if (
            weatherMain.includes('rain') ||
            weatherMain.includes('drizzle') ||
            weatherMain.includes('thunderstorm')
        ) {
            document.body.classList.add('night-rain');
        } else {
            document.body.classList.add('night-clear');
        }
    }
}

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const cityName = cityInput.value.trim();
    if (cityName) {
        getWeather(cityName);
    } else {
        alert('กรุณาป้อนชื่อเมือง');
    }
});

function saveHistory(city) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history = history.filter((c) => c.toLowerCase() !== city.toLowerCase());
    history.unshift(city);
    if (history.length > MAX_HISTORY) history.pop();
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<li style="cursor: default; background: rgba(255,255,255,0.1);">ยังไม่มีประวัติการค้นหา</li>';
        return;
    }
    history.forEach((city) => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('click', () => {
            cityInput.value = city;
            getWeather(city);
        });
        historyList.appendChild(li);
    });
}

async function getWeather(city) {
    weatherInfoContainer.innerHTML = `<p><span class="loading"></span>กำลังโหลดข้อมูล...</p>`;
    forecastContainer.innerHTML = '';

    try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            city
        )}&appid=${apiKey}&units=metric&lang=th`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('ไม่พบข้อมูลเมืองนี้');
        const data = await response.json();
        displayWeather(data);
        setTheme(data);

        localStorage.setItem('lastCity', city);
        saveHistory(city);

        getForecast(city);
    } catch (error) {
        weatherInfoContainer.innerHTML = `<p class="error">${error.message}</p>`;
        forecastContainer.innerHTML = '';
        document.body.className = '';
    }
}

function displayWeather(data) {
    const { name, main, weather } = data;
    const { temp, humidity } = main;
    const { description, icon } = weather[0];

    const weatherHtml = `
        <h2>${name}</h2>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
        <p class="temp">${temp.toFixed(1)}°C</p>
        <p>${description}</p>
        <p>ความชื้น: ${humidity}%</p>
    `;
    weatherInfoContainer.innerHTML = weatherHtml;
}

async function getForecast(city) {
    const apiForecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
    )}&appid=${apiKey}&units=metric&lang=th`;
    try {
        const response = await fetch(apiForecastUrl);
        if (!response.ok) throw new Error('ไม่พบข้อมูลพยากรณ์อากาศ');
        const forecastData = await response.json();

        displayForecast(forecastData);
    } catch (error) {
        forecastContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displayForecast(forecastData) {
    // เลือกข้อมูลเวลา 12:00 เท่านั้น เพื่อให้ได้พยากรณ์ 5 วัน
    const forecastByDay = forecastData.list.filter((entry) =>
        entry.dt_txt.includes('12:00:00')
    );

    if (forecastByDay.length === 0) {
        forecastContainer.innerHTML = `<p>ไม่พบข้อมูลพยากรณ์ล่วงหน้า</p>`;
        return;
    }

    forecastContainer.innerHTML = '';

    forecastByDay.forEach((day) => {
        const dateLabel = formatDateTime(day.dt_txt).split(' ')[0];
        const { temp } = day.main;
        const { icon, description } = day.weather[0];

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('forecast-day');

        dayDiv.innerHTML = `
            <div>${dateLabel}</div>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" />
            <div class="forecast-temp">${temp.toFixed(1)}°C</div>
        `;

        forecastContainer.appendChild(dayDiv);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    renderHistory();

    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        cityInput.value = lastCity;
        getWeather(lastCity);
    }
});