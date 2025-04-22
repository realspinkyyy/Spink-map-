import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDWDk_p33Y_jgPNJPHoJApEmo0W7Q9BhxA",
  authDomain: "spinktweet.firebaseapp.com",
  projectId: "spinktweet",
  storageBucket: "spinktweet.firebasestorage.app",
  messagingSenderId: "848866063079",
  appId: "1:848866063079:web:be2efce9b4c5ecc3956842",
  measurementId: "G-81YMX6VBK4",
  databaseURL: "https://spinktweet-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Map setup
const map = L.map('map').setView([54.5, -3], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// User ID
const userId = `user_${Math.random().toString(36).substring(2, 10)}`;
let userMarker = null;
let liveMarkers = {};

function updateLocation() {
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    set(ref(db, `users/${userId}`), {
      lat: latitude,
      lng: longitude,
      timestamp: Date.now()
    });

    if (!userMarker) {
      userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup("You");
      map.setView([latitude, longitude], 14);
    } else {
      userMarker.setLatLng([latitude, longitude]);
    }
  });
}
setInterval(updateLocation, 5000);

// Show other users
onValue(ref(db, 'users'), (snapshot) => {
  const users = snapshot.val();
  for (const id in users) {
    if (id === userId) continue;
    const { lat, lng } = users[id];

    if (!liveMarkers[id]) {
      liveMarkers[id] = L.marker([lat, lng]).addTo(map).bindPopup(`User: ${id}`);
    } else {
      liveMarkers[id].setLatLng([lat, lng]);
    }
  }
});

// Report system
function reportIssue(type) {
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`Reported: ${type}`).openPopup();
  });
}

// Routing
let routeLayer = null;

function routeTo() {
  const dest = document.getElementById('destination').value;
  const mode = document.getElementById('travelMode').value;

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const start = `${pos.coords.longitude},${pos.coords.latitude}`;

    // Geocode destination
    const geoRes = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf6248d993cca169454e52ba4a6bbedaa2b0c3&text=${encodeURIComponent(dest)}`);
    const geoData = await geoRes.json();
    const endCoords = geoData.features[0].geometry.coordinates;
    const end = `${endCoords[0]},${endCoords[1]}`;

    // Routing
    const routeRes = await fetch(`https://api.openrouteservice.org/v2/directions/${mode}?api_key=5b3ce3597851110001cf6248d993cca169454e52ba4a6bbedaa2b0c3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [
          [parseFloat(pos.coords.longitude), parseFloat(pos.coords.latitude)],
          [endCoords[0], endCoords[1]]
        ]
      })
    });
    const routeData = await routeRes.json();
    const coords = routeData.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
    const distance = (routeData.features[0].properties.summary.distance / 1000).toFixed(2);
    const duration = Math.round(routeData.features[0].properties.summary.duration / 60); // in mins

    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline(coords, { color: 'blue' }).addTo(map);
    map.fitBounds(routeLayer.getBounds());

    const eta = new Date(Date.now() + duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('routeInfo').innerText = `Distance: ${distance} km | Time: ${duration} min | ETA: ${eta}`;
  });
}
window.reportIssue = reportIssue;
window.routeTo = routeTo;
