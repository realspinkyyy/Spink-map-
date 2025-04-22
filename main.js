const map = L.map('map').setView([54.5, -3], 6);  // Centered on the UK

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// Locate user on map
map.locate({ setView: true, maxZoom: 14 });

function onLocationFound(e) {
  L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
}

map.on('locationfound', onLocationFound);

// Report an issue at current location
function reportIssue(type) {
  map.locate();
  map.once('locationfound', function (e) {
    const marker = L.marker(e.latlng).addTo(map);
    marker.bindPopup(`Reported: ${type}`).openPopup();

    // Placeholder for backend or Firebase push
    console.log(`Reporting ${type} at `, e.latlng);
  });
}
