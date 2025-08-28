/**
 * Ce fichier contient les fonctions pour initialiser les cartes relatives aux structures familiales de l'EPCI
 * - Carte des couples avec enfants par commune
 * - Carte des familles monoparentales par commune
 * - Carte des familles nombreuses par commune
 */

// Fonction pour initialiser la carte des couples avec enfants
function initializeFamiliesMap() {
  const mapElement = document.getElementById("communes-map-families");
  const geojsonElement = document.getElementById("communes-families-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des familles");
    return;
  }

  // ✅ Vérification simple pour éviter la double initialisation
  if (mapElement._leaflet_id) {
    console.log("Carte des familles déjà initialisée");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.couples_percentage).filter(v => v > 0).sort((a, b) => a - b);

    // Utiliser des discrétisations de Jenks si possible
    const clusters = values.length >= 4 ? ss.ckmeans(values, 4) : [[0], [values[0] || 25], [values[Math.floor(values.length/2)] || 35], [values[values.length-1] || 50]];
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    // Palette de couleurs pour les couples avec enfants
    const colors = ["#ccebc5", "#a8ddb5", "#7bccc4", "#43a2ca"];

    function getColor(percentage) {
      return percentage > breaks[3] ? colors[3] :
             percentage > breaks[2] ? colors[2] :
             percentage > breaks[1] ? colors[1] :
                                   colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.couples_percentage),
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
          Couples avec enfants : ${feature.properties.couples_percentage.toFixed(2)}%<br>
          Nombre : ${feature.properties.couples_count} couples<br>
          Total ménages : ${feature.properties.total_households}
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
    createFamiliesLegend(breaks, "families-legend", colors);

    // ✅ Stocker l'instance de carte ET ses bounds initiaux
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    console.log("✅ Carte des couples avec enfants initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des couples avec enfants:", e);
  }
}

// Fonction pour créer la légende des couples avec enfants
function createFamiliesLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const labels = [
    `≤ ${breaks[1].toFixed(2)}%`,
    `${breaks[1].toFixed(2)}% – ${breaks[2].toFixed(2)}%`,
    `${breaks[2].toFixed(2)}% – ${breaks[3].toFixed(2)}%`,
    `≥ ${breaks[3].toFixed(2)}%`
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

// Fonction pour initialiser la carte des familles monoparentales
function initializeSingleParentMap() {
  const mapElement = document.getElementById("communes-map-single-parent");
  const geojsonElement = document.getElementById("communes-single-parent-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des familles monoparentales");
    return;
  }

  // ✅ Vérification simple pour éviter la double initialisation
  if (mapElement._leaflet_id) {
    console.log("Carte des familles monoparentales déjà initialisée");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.single_parent_percentage).filter(v => v > 0).sort((a, b) => a - b);

    // Utiliser des discrétisations de Jenks si possible
    const clusters = values.length >= 4 ? ss.ckmeans(values, 4) : [[0], [values[0] || 10], [values[Math.floor(values.length/2)] || 20], [values[values.length-1] || 30]];
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    // Palette de couleurs pour les familles monoparentales (teintes de violet)
    const colors = ["#f2d4f7", "#dcb0e3", "#c77dcd", "#9945b0"];

    function getColor(percentage) {
      return percentage > breaks[3] ? colors[3] :
             percentage > breaks[2] ? colors[2] :
             percentage > breaks[1] ? colors[1] :
                                   colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.single_parent_percentage),
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
          Familles monoparentales : ${feature.properties.single_parent_percentage.toFixed(2)}%<br>
          Nombre : ${feature.properties.single_parent_count} familles<br>
          Pères seuls : ${feature.properties.single_fathers_percentage.toFixed(2)}%<br>
          Mères seules : ${feature.properties.single_mothers_percentage.toFixed(2)}%<br>
          Total ménages : ${feature.properties.total_households}
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
    createSingleParentLegend(breaks, "single-parent-legend", colors);

    // ✅ Stocker l'instance de carte
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    console.log("✅ Carte des familles monoparentales initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des familles monoparentales:", e);
  }
}

// Fonction pour créer la légende des familles monoparentales
function createSingleParentLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const labels = [
    `≤ ${breaks[1].toFixed(2)}%`,
    `${breaks[1].toFixed(2)}% – ${breaks[2].toFixed(2)}%`,
    `${breaks[2].toFixed(2)}% – ${breaks[3].toFixed(2)}%`,
    `≥ ${breaks[3].toFixed(2)}%`
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

// Fonction pour initialiser la carte des familles nombreuses
function initializeLargeFamiliesMap() {
  const mapElement = document.getElementById("communes-map-large-families");
  const geojsonElement = document.getElementById("communes-large-families-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des familles nombreuses");
    return;
  }

  // ✅ Vérification simple pour éviter la double initialisation
  if (mapElement._leaflet_id) {
    console.log("Carte des familles nombreuses déjà initialisée");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.large_families_percentage).filter(v => v > 0).sort((a, b) => a - b);

    // Utiliser des discrétisations de Jenks si possible
    const clusters = values.length >= 4 ? ss.ckmeans(values, 4) : [[0], [values[0] || 5], [values[Math.floor(values.length/2)] || 10], [values[values.length-1] || 15]];
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    // Palette de couleurs pour les familles nombreuses (teintes de bleu/vert)
    const colors = ["#f1faee", "#a8dadc", "#457b9d", "#1d3557"];

    function getColor(percentage) {
      return percentage > breaks[3] ? colors[3] :
             percentage > breaks[2] ? colors[2] :
             percentage > breaks[1] ? colors[1] :
                                    colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.large_families_percentage),
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
          Familles nombreuses : ${feature.properties.large_families_percentage.toFixed(2)}%<br>
          Nombre : ${feature.properties.large_families_count} familles<br>
          3 enfants : ${feature.properties.families_3_children_percentage.toFixed(2)}%<br>
          4 enfants ou + : ${feature.properties.families_4_plus_percentage.toFixed(2)}%<br>
          Total ménages : ${feature.properties.total_households}
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
    createLargeFamiliesLegend(breaks, "large-families-legend", colors);

    // ✅ Stocker l'instance de carte
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    console.log("✅ Carte des familles nombreuses initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des familles nombreuses:", e);
  }
}

// Fonction pour créer la légende des familles nombreuses
function createLargeFamiliesLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const labels = [
    `≤ ${breaks[1].toFixed(2)}%`,
    `${breaks[1].toFixed(2)}% – ${breaks[2].toFixed(2)}%`,
    `${breaks[2].toFixed(2)}% – ${breaks[3].toFixed(2)}%`,
    `≥ ${breaks[3].toFixed(2)}%`
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

// 🚀 AJOUT CRITIQUE : Exposer l'objet pour le système asynchrone
window.EpciFamiliesMaps = {
  init() {
    console.log('🗺️ EpciFamiliesMaps.init() appelée');

    // Initialiser toutes les cartes des familles
    initializeFamiliesMap();
    initializeSingleParentMap();
    initializeLargeFamiliesMap();
  }
};

// ✅ SUPPRIMÉ : L'écouteur turbo:load car maintenant géré par le système asynchrone
// document.addEventListener("turbo:load", function() {
//   initializeFamiliesMap();
//   initializeSingleParentMap();
//   initializeLargeFamiliesMap();
// });

// Exporter les fonctions pour les rendre disponibles
export {
  initializeFamiliesMap,
  initializeSingleParentMap,
  initializeLargeFamiliesMap
};
