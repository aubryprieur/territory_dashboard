/**
 * Ce fichier contient les fonctions pour initialiser les cartes relatives à l'emploi des femmes dans l'EPCI
 * - Carte des taux d'activité des femmes par commune
 * - Carte des taux d'emploi des femmes par commune
 * - Carte des taux de temps partiel des femmes par commune
 */

// Fonction pour initialiser la carte des taux d'activité des femmes
function initializeWomenEmploymentMap() {
  const mapElement = document.getElementById("communes-map-women-employment");
  const geojsonElement = document.getElementById("communes-women-employment-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des taux d'activité des femmes");
    return;
  }

  const geojsonData = JSON.parse(geojsonElement.textContent);
  const values = geojsonData.features.map(f => f.properties.activity_rate).filter(v => v > 0).sort((a, b) => a - b);

  // Utiliser des discrétisations de Jenks si possible
  const clusters = values.length >= 4 ? ss.ckmeans(values, 5) : [[0], [55], [65], [75], [85]];
  const breaks = clusters.map(c => c[0]);
  breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

  // Palette de couleurs pour le taux d'activité (du plus faible au plus élevé)
  const colors = ["#fee0d2", "#fc9272", "#fb6a4a", "#de2d26", "#a50f15"];

  function getColor(rate) {
    return rate > breaks[4] ? colors[4] :
           rate > breaks[3] ? colors[3] :
           rate > breaks[2] ? colors[2] :
           rate > breaks[1] ? colors[1] :
                            colors[0];
  }

  function style(feature) {
    return {
      fillColor: getColor(feature.properties.activity_rate),
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7
    };
  }

  function onEachFeature(feature, layer) {
    const popup = `
      <div class="text-sm">
        <strong>${feature.properties.name}</strong><br>
        Taux d'activité : <strong>${feature.properties.activity_rate.toFixed(1)}%</strong><br>
        Taux d'emploi : ${feature.properties.employment_rate.toFixed(1)}%<br>
        Temps partiel : ${feature.properties.part_time_rate_15_64.toFixed(1)}%<br>
        Femmes 15-64 ans : ${feature.properties.women_15_64} habitantes
      </div>
    `;
    layer.bindPopup(popup);
  }

  const map = L.map(mapElement);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const layer = L.geoJSON(geojsonData, { style, onEachFeature }).addTo(map);
  map.fitBounds(layer.getBounds());

  // Créer une légende pour la carte
  createWomenEmploymentLegend(breaks, "women-employment-legend", colors);

  console.log("✅ Carte des taux d'activité des femmes initialisée avec succès");
}

// Fonction pour créer la légende des taux d'activité des femmes
function createWomenEmploymentLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const labels = [
    `< ${breaks[1].toFixed(1)}%`,
    `${breaks[1].toFixed(1)}% - ${breaks[2].toFixed(1)}%`,
    `${breaks[2].toFixed(1)}% - ${breaks[3].toFixed(1)}%`,
    `${breaks[3].toFixed(1)}% - ${breaks[4].toFixed(1)}%`,
    `> ${breaks[4].toFixed(1)}%`
  ];

  for (let i = 0; i < 5; i++) {
    const item = document.createElement("div");
    item.className = "flex items-center";

    const colorBox = document.createElement("div");
    colorBox.className = "w-4 h-4 rounded mr-2";
    colorBox.style.backgroundColor = colors[i];

    const label = document.createElement("span");
    label.textContent = labels[i];

    item.appendChild(colorBox);
    item.appendChild(label);
    legend.appendChild(item);
  }

  legendContainer.appendChild(legend);
}

// Fonction pour initialiser la carte des taux d'emploi des femmes
function initializeWomenEmploymentRateMap() {
  const mapElement = document.getElementById("communes-map-women-employment-rate");
  const geojsonElement = document.getElementById("communes-women-employment-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des taux d'emploi des femmes");
    return;
  }

  const geojsonData = JSON.parse(geojsonElement.textContent);
  const values = geojsonData.features.map(f => f.properties.employment_rate).filter(v => v > 0).sort((a, b) => a - b);

  // Utiliser des discrétisations de Jenks si possible
  const clusters = values.length >= 4 ? ss.ckmeans(values, 5) : [[0], [50], [60], [70], [80]];
  const breaks = clusters.map(c => c[0]);
  breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

  // Palette de couleurs pour le taux d'emploi (du plus faible au plus élevé)
  // Utilisation d'une palette différente pour distinguer des taux d'activité
  const colors = ["#edf8fb", "#b3cde3", "#8c96c6", "#8856a7", "#810f7c"];

  function getColor(rate) {
    return rate > breaks[4] ? colors[4] :
           rate > breaks[3] ? colors[3] :
           rate > breaks[2] ? colors[2] :
           rate > breaks[1] ? colors[1] :
                            colors[0];
  }

  function style(feature) {
    return {
      fillColor: getColor(feature.properties.employment_rate),
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7
    };
  }

  function onEachFeature(feature, layer) {
    const popup = `
      <div class="text-sm">
        <strong>${feature.properties.name}</strong><br>
        Taux d'emploi : <strong>${feature.properties.employment_rate.toFixed(1)}%</strong><br>
        Taux d'activité : ${feature.properties.activity_rate.toFixed(1)}%<br>
        Écart : ${(feature.properties.activity_rate - feature.properties.employment_rate).toFixed(1)} points<br>
        Femmes 15-64 ans : ${feature.properties.women_15_64} habitantes
      </div>
    `;
    layer.bindPopup(popup);
  }

  const map = L.map(mapElement);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const layer = L.geoJSON(geojsonData, { style, onEachFeature }).addTo(map);
  map.fitBounds(layer.getBounds());

  // Créer une légende pour la carte
  createWomenEmploymentRateLegend(breaks, "women-employment-rate-legend", colors);

  console.log("✅ Carte des taux d'emploi des femmes initialisée avec succès");
}

// Fonction pour créer la légende des taux d'emploi des femmes
function createWomenEmploymentRateLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const labels = [
    `< ${breaks[1].toFixed(1)}%`,
    `${breaks[1].toFixed(1)}% - ${breaks[2].toFixed(1)}%`,
    `${breaks[2].toFixed(1)}% - ${breaks[3].toFixed(1)}%`,
    `${breaks[3].toFixed(1)}% - ${breaks[4].toFixed(1)}%`,
    `> ${breaks[4].toFixed(1)}%`
  ];

  for (let i = 0; i < 5; i++) {
    const item = document.createElement("div");
    item.className = "flex items-center";

    const colorBox = document.createElement("div");
    colorBox.className = "w-4 h-4 rounded mr-2";
    colorBox.style.backgroundColor = colors[i];

    const label = document.createElement("span");
    label.textContent = labels[i];

    item.appendChild(colorBox);
    item.appendChild(label);
    legend.appendChild(item);
  }

  legendContainer.appendChild(legend);
}

// Fonction pour initialiser la carte des taux de temps partiel des femmes
function initializeWomenPartTimeMap() {
  const mapElement = document.getElementById("communes-map-women-part-time");
  const geojsonElement = document.getElementById("communes-women-employment-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des taux de temps partiel des femmes");
    return;
  }

  const geojsonData = JSON.parse(geojsonElement.textContent);
  const values = geojsonData.features.map(f => f.properties.part_time_rate_15_64).filter(v => v > 0).sort((a, b) => a - b);

  // Utiliser des discrétisations de Jenks si possible
  const clusters = values.length >= 4 ? ss.ckmeans(values, 5) : [[0], [25], [30], [35], [40]];
  const breaks = clusters.map(c => c[0]);
  breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

  // Palette de couleurs pour le taux de temps partiel (du plus faible au plus élevé)
  // Utilisation d'une palette violette pour distinguer des autres indicateurs
  const colors = ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1"];

  function getColor(rate) {
    return rate > breaks[4] ? colors[4] :
           rate > breaks[3] ? colors[3] :
           rate > breaks[2] ? colors[2] :
           rate > breaks[1] ? colors[1] :
                            colors[0];
  }

  function style(feature) {
    return {
      fillColor: getColor(feature.properties.part_time_rate_15_64),
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7
    };
  }

  function onEachFeature(feature, layer) {
    const popup = `
      <div class="text-sm">
        <strong>${feature.properties.name}</strong><br>
        Taux de temps partiel : <strong>${feature.properties.part_time_rate_15_64.toFixed(1)}%</strong><br>
        Taux d'emploi : ${feature.properties.employment_rate.toFixed(1)}%<br>
        Taux d'activité : ${feature.properties.activity_rate.toFixed(1)}%<br>
        Femmes 15-64 ans : ${feature.properties.women_15_64} habitantes
      </div>
    `;
    layer.bindPopup(popup);
  }

  const map = L.map(mapElement);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const layer = L.geoJSON(geojsonData, { style, onEachFeature }).addTo(map);
  map.fitBounds(layer.getBounds());

  // Créer une légende pour la carte
  createWomenPartTimeLegend(breaks, "women-part-time-legend", colors);

  console.log("✅ Carte des taux de temps partiel des femmes initialisée avec succès");
}

// Fonction pour créer la légende des taux de temps partiel des femmes
function createWomenPartTimeLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const labels = [
    `< ${breaks[1].toFixed(1)}%`,
    `${breaks[1].toFixed(1)}% - ${breaks[2].toFixed(1)}%`,
    `${breaks[2].toFixed(1)}% - ${breaks[3].toFixed(1)}%`,
    `${breaks[3].toFixed(1)}% - ${breaks[4].toFixed(1)}%`,
    `> ${breaks[4].toFixed(1)}%`
  ];

  for (let i = 0; i < 5; i++) {
    const item = document.createElement("div");
    item.className = "flex items-center";

    const colorBox = document.createElement("div");
    colorBox.className = "w-4 h-4 rounded mr-2";
    colorBox.style.backgroundColor = colors[i];

    const label = document.createElement("span");
    label.textContent = labels[i];

    item.appendChild(colorBox);
    item.appendChild(label);
    legend.appendChild(item);
  }

  legendContainer.appendChild(legend);
}

// Initialiser les cartes au chargement de la page
document.addEventListener("turbo:load", function() {
  initializeWomenEmploymentMap();
  initializeWomenEmploymentRateMap();
  initializeWomenPartTimeMap();
});

// Également initialiser au chargement initial pour les pages non chargées via Turbo
document.addEventListener("DOMContentLoaded", function() {
  initializeWomenEmploymentMap();
  initializeWomenEmploymentRateMap();
  initializeWomenPartTimeMap();
});

// Exporter les fonctions pour les rendre disponibles
export {
  initializeWomenEmploymentMap,
  initializeWomenEmploymentRateMap,
  initializeWomenPartTimeMap
};
