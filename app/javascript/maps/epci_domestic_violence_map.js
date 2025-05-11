// Fonction pour initialiser la carte des violences intrafamiliales
function initializeDomesticViolenceMap() {
  const mapElement = document.getElementById("communes-map-violence");
  const geojsonElement = document.getElementById("communes-domestic-violence-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") return;

  const geojsonData = JSON.parse(geojsonElement.textContent);
  const values = geojsonData.features
    .map(f => f.properties.violence_rate)
    .filter(v => v !== null && v > 0)
    .sort((a, b) => a - b);

  // Utiliser des discrétisations de Jenks si possible
  const clusters = values.length >= 4 ? ss.ckmeans(values, 5) : [[0], [2], [4], [6], [8]];
  const breaks = clusters.map(c => c[0]);
  breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

  // Palette de couleurs pour le taux de violences (du plus faible au plus élevé)
  const colors = ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"];

  function getColor(rate) {
    if (rate === null) return "#e5e7eb"; // Gris pour les données manquantes
    return rate > breaks[4] ? colors[4] :
           rate > breaks[3] ? colors[3] :
           rate > breaks[2] ? colors[2] :
           rate > breaks[1] ? colors[1] :
                            colors[0];
  }

  function style(feature) {
    return {
      fillColor: getColor(feature.properties.violence_rate),
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7
    };
  }

  function onEachFeature(feature, layer) {
    const props = feature.properties;
    const popup = `
      <div class="text-sm">
        <strong>${props.name}</strong><br>
        ${props.violence_rate !== null ?
          `Taux (${props.latest_year}) : <strong>${props.violence_rate.toFixed(2)}‰</strong><br>
           Taux moyen (2016-${props.latest_year.slice(-2)}) : ${props.average_rate.toFixed(2)}‰`
          : 'Données non disponibles pour cette année'}<br>
        Population : ${props.population.toLocaleString('fr-FR')} habitants
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
  renderMapLegend(breaks, "violence-map-legend", colors, "‰");
}

// Fonction de rendu de légende générique
function renderMapLegend(breaks, containerId, colors, unit = "‰") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  // Ajouter une entrée pour les données manquantes
  const noDataItem = document.createElement("div");
  noDataItem.className = "flex items-center";
  const noDataColorBox = document.createElement("div");
  noDataColorBox.className = "w-4 h-4 rounded mr-2";
  noDataColorBox.style.backgroundColor = "#e5e7eb";
  const noDataLabel = document.createElement("span");
  noDataLabel.textContent = "Données non disponibles";
  noDataItem.appendChild(noDataColorBox);
  noDataItem.appendChild(noDataLabel);
  legend.appendChild(noDataItem);

  const format = val => val.toFixed(2);

  const labels = [
    `< ${format(breaks[1])}${unit}`,
    `${format(breaks[1])}${unit} – ${format(breaks[2])}${unit}`,
    `${format(breaks[2])}${unit} – ${format(breaks[3])}${unit}`,
    `${format(breaks[3])}${unit} – ${format(breaks[4])}${unit}`,
    `> ${format(breaks[4])}${unit}`
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

  container.appendChild(legend);
}

// Initialiser la carte au chargement de la page
document.addEventListener("turbo:load", function() {
  initializeDomesticViolenceMap();
});

// Également initialiser au chargement initial pour les pages non chargées via Turbo
document.addEventListener("DOMContentLoaded", function() {
  initializeDomesticViolenceMap();
});

// Exporter les fonctions pour les rendre disponibles
export { initializeDomesticViolenceMap, renderMapLegend };
