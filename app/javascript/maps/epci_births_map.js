/**
 * Initialise la carte des naissances par commune
 * Affiche une carte choroplèthe avec le nombre de naissances par commune
 */
function initializeBirthsCountMap() {
  const mapElement = document.getElementById("communes-map-births");
  const geojsonElement = document.getElementById("communes-births-geojson");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires pour la carte des naissances manquants");
    return;
  }

  // ✅ Vérification simple pour éviter la double initialisation
  if (mapElement._leaflet_id) {
    console.log("Carte des naissances déjà initialisée");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.births_count).filter(v => v > 0).sort((a, b) => a - b);

    // Utiliser des discrétisations de Jenks si possible
    const clusters = values.length >= 4 ? ss.ckmeans(values, 4) : [[0], [values[0] || 1], [values[Math.floor(values.length/2)] || 2], [values[values.length-1] || 3]];
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    // Palette de couleurs pour les naissances (du plus faible au plus élevé)
    const colors = ["#feebe2", "#fbb4b9", "#f768a1", "#ae017e"];

    function getColor(count) {
      return count > breaks[3] ? colors[3] :
             count > breaks[2] ? colors[2] :
             count > breaks[1] ? colors[1] :
                                colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.births_count),
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
          Naissances (${feature.properties.latest_year}) : ${feature.properties.births_count}
        </div>
      `;
      layer.bindPopup(popup);
    }

    const map = L.map(mapElement);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const layer = L.geoJSON(geojsonData, { style, onEachFeature }).addTo(map);
    const bounds = layer.getBounds();
    map.fitBounds(bounds);

    createLegend(breaks, "births-count-legend", colors);

    // ✅ Stocker l'instance de carte ET ses bounds initiaux
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    console.log("✅ Carte des naissances initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des naissances:", e);
  }
}

/**
 * Crée une légende pour une carte choroplèthe
 */
function createLegend(breaks, containerId, colors) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const labels = [
    `≤ ${Math.round(breaks[1])}`,
    `${Math.round(breaks[1])} – ${Math.round(breaks[2])}`,
    `${Math.round(breaks[2])} – ${Math.round(breaks[3])}`,
    `≥ ${Math.round(breaks[3])}`
  ];

  for (let i = 0; i < 4; i++) {
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

// 🚀 AJOUT : Exposer l'objet pour le système asynchrone
window.EpciBirthsMap = {
  init() {
    console.log('🗺️ EpciBirthsMap.init() appelée');
    initializeBirthsCountMap();
  }
};

// ✅ Retirer l'écouteur turbo:load car maintenant géré par le système asynchrone
// document.addEventListener("turbo:load", function() {
//   initializeBirthsCountMap();
// });

// Exporter les fonctions pour les rendre disponibles
export { initializeBirthsCountMap, createLegend };
