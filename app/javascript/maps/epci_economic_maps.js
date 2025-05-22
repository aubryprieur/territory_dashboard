/**
 * Ce fichier contient les fonctions pour initialiser les cartes des données économiques de l'EPCI
 * - Carte des revenus médians par commune
 * - Carte des taux de pauvreté par commune
 */

// Fonction pour initialiser la carte des revenus médians
function initializeRevenuesMap() {
  const mapElement = document.getElementById("communes-map-revenues");
  const geojsonElement = document.getElementById("communes-revenues-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des revenus");
    return;
  }

  // ✅ Vérification simple pour éviter la double initialisation
  if (mapElement._leaflet_id) {
    console.log("Carte des revenus déjà initialisée");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.median_revenue).filter(v => v > 0).sort((a, b) => a - b);

    // Utiliser des discrétisations de Jenks si possible
    const clusters = values.length >= 4 ? ss.ckmeans(values, 4) : [[0], [values[0] || 1], [values[Math.floor(values.length/2)] || 2], [values[values.length-1] || 3]];
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    // Palette de couleurs pour les revenus (du plus faible au plus élevé)
    const colors = ["#feebe2", "#fbb4b9", "#f768a1", "#7a0177"];

    function getColor(revenue) {
      return revenue > breaks[3] ? colors[3] :
             revenue > breaks[2] ? colors[2] :
             revenue > breaks[1] ? colors[1] :
                                colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.median_revenue),
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
          Revenu médian (${feature.properties.latest_year}) : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(feature.properties.median_revenue)}
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

    // Créer une légende pour la carte
    createRevenueLegend(breaks, "revenues-legend", colors);

    // ✅ Stocker l'instance de carte ET ses bounds initiaux
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    console.log("✅ Carte des revenus médians initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des revenus:", e);
  }
}

// Fonction pour créer la légende des revenus
function createRevenueLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const format = val => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const labels = [
    `≤ ${format(breaks[1] - 0.01)}`,
    `${format(breaks[1])} – ${format(breaks[2] - 0.01)}`,
    `${format(breaks[2])} – ${format(breaks[3] - 0.01)}`,
    `≥ ${format(breaks[3])}`
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

  legendContainer.appendChild(legend);
}

// Fonction pour initialiser la carte des taux de pauvreté
function initializePovertyMap() {
  const mapElement = document.getElementById("communes-map-poverty");
  const geojsonElement = document.getElementById("communes-revenues-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte de la pauvreté");
    return;
  }

  // ✅ Vérification simple pour éviter la double initialisation
  if (mapElement._leaflet_id) {
    console.log("Carte de la pauvreté déjà initialisée");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);

    // Filtrer les valeurs nulles pour la classification
    const povertyValues = geojsonData.features
      .map(f => f.properties.poverty_rate)
      .filter(v => v !== null && v > 0)
      .sort((a, b) => a - b);

    // Discrétisation et fonction de style
    let breaks, colors;

    if (povertyValues.length >= 4) {
      const clusters = ss.ckmeans(povertyValues, 4);
      breaks = clusters.map(c => c[0]);
      breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

      // Palette de couleurs pour les taux de pauvreté
      colors = ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"];
    } else {
      // Fallback si pas assez de données
      breaks = [0, 10, 20, 30, 40];
      colors = ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"];
    }

    function getColorForPoverty(rate) {
      if (rate === null) return "#e5e7eb"; // Gris pour les données manquantes
      return rate > breaks[3] ? colors[3] :
             rate > breaks[2] ? colors[2] :
             rate > breaks[1] ? colors[1] :
                               colors[0];
    }

    function stylePoverty(feature) {
      return {
        fillColor: getColorForPoverty(feature.properties.poverty_rate),
        weight: 1,
        opacity: 1,
        color: "white",
        fillOpacity: 0.7
      };
    }

    function onEachFeaturePoverty(feature, layer) {
      const popup = `
        <div class="text-sm">
          <strong>${feature.properties.name}</strong><br>
          ${feature.properties.poverty_rate !== null
            ? `Taux de pauvreté (${feature.properties.latest_year}) : ${feature.properties.poverty_rate.toFixed(1)}%`
            : 'Taux de pauvreté : Non disponible'}
        </div>
      `;
      layer.bindPopup(popup);
    }

    const map = L.map(mapElement);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const layer = L.geoJSON(geojsonData, {
      style: stylePoverty,
      onEachFeature: onEachFeaturePoverty,
      filter: function(feature) {
        return feature.properties !== undefined;
      }
    }).addTo(map);

    const bounds = layer.getBounds();
    map.fitBounds(bounds);

    // Créer une légende pour la carte
    createPovertyLegend(breaks, "poverty-legend", colors);

    // ✅ Stocker l'instance de carte ET ses bounds initiaux
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    console.log("✅ Carte des taux de pauvreté initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des taux de pauvreté:", e);
  }
}

// Fonction pour créer la légende des taux de pauvreté
function createPovertyLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const labels = [
    `≤ ${breaks[1].toFixed(1)}%`,
    `${breaks[1].toFixed(1)}% – ${breaks[2].toFixed(1)}%`,
    `${breaks[2].toFixed(1)}% – ${breaks[3].toFixed(1)}%`,
    `≥ ${breaks[3].toFixed(1)}%`
  ];

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

  // Ajouter les entrées pour les plages de valeurs
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

  legendContainer.appendChild(legend);
}

// Initialiser les cartes au chargement de la page
document.addEventListener("turbo:load", function() {
  initializeRevenuesMap();
  initializePovertyMap();
});

// Exporter les fonctions pour les rendre disponibles
export { initializeRevenuesMap, initializePovertyMap };
