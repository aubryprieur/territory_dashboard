function initializeChildcareMap() {
  const mapElement = document.getElementById("communes-map-childcare");
  const geojsonElement = document.getElementById("communes-childcare-geojson");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires pour la carte de couverture petite enfance manquants");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.global_coverage_rate).filter(v => v > 0).sort((a, b) => a - b);

    // Utiliser des discrétisations de Jenks si possible
    const clusters = values.length >= 4 ? ss.ckmeans(values, 5) : [[0], [30], [60], [90], [120]];
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    // Palette de couleurs pour le taux de couverture (du plus faible au plus élevé)
    const colors = ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"];

    function getColor(rate) {
      return rate > breaks[4] ? colors[4] :
             rate > breaks[3] ? colors[3] :
             rate > breaks[2] ? colors[2] :
             rate > breaks[1] ? colors[1] :
                              colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.global_coverage_rate),
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
          Taux de couverture : <strong>${feature.properties.global_coverage_rate.toFixed(1)}%</strong><br>
          Année : ${feature.properties.year}
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
    createLegend(breaks, "childcare-legend", colors);

    console.log("✅ Carte des taux de couverture petite enfance initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des taux de couverture:", e);
  }
}

// Fonction pour créer la légende de la carte
function createLegend(breaks, containerId, colors) {
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

// Initialiser la carte au chargement de la page
document.addEventListener("turbo:load", function() {
  initializeChildcareMap();
});

// Également initialiser au chargement initial pour les pages non chargées via Turbo
document.addEventListener("DOMContentLoaded", function() {
  // Vérifier si la page a déjà été chargée par Turbo
  if (!window.childcareMapInitialized) {
    initializeChildcareMap();
  }
});

// Exporter les fonctions pour les rendre disponibles
export { initializeChildcareMap, createLegend };
