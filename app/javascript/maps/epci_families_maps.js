/**
 * Ce fichier contient les fonctions pour initialiser les cartes relatives aux structures familiales de l'EPCI
 * - Carte des couples avec enfants par commune
 * - Carte des familles monoparentales par commune
 * - Carte des familles nombreuses par commune
 */

// Système de garde global pour éviter les initialisations multiples
if (!window.familiesMapsGuard) {
  window.familiesMapsGuard = {
    initialized: new Set(),
    inProgress: new Set()
  };
}

// Fonction pour initialiser la carte des couples avec enfants
function initializeFamiliesMap() {
  const mapId = 'communes-map-families';

  // Protection contre les initialisations multiples
  if (window.familiesMapsGuard.initialized.has(mapId) ||
      window.familiesMapsGuard.inProgress.has(mapId)) {
    console.log(`Carte ${mapId} déjà initialisée ou en cours`);
    return;
  }

  window.familiesMapsGuard.inProgress.add(mapId);

  const mapElement = document.getElementById(mapId);
  const geojsonElement = document.getElementById("communes-families-geojson");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des familles");
    window.familiesMapsGuard.inProgress.delete(mapId);
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

    // Stocker l'instance de carte
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    // Marquer comme initialisé
    window.familiesMapsGuard.initialized.add(mapId);
    console.log("✅ Carte des couples avec enfants initialisée avec succès");

  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des couples avec enfants:", e);
  } finally {
    window.familiesMapsGuard.inProgress.delete(mapId);
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
  const mapId = 'communes-map-single-parent';

  // Protection contre les initialisations multiples
  if (window.familiesMapsGuard.initialized.has(mapId) ||
      window.familiesMapsGuard.inProgress.has(mapId)) {
    console.log(`Carte ${mapId} déjà initialisée ou en cours`);
    return;
  }

  window.familiesMapsGuard.inProgress.add(mapId);

  const mapElement = document.getElementById(mapId);
  const geojsonElement = document.getElementById("communes-single-parent-geojson");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des familles monoparentales");
    window.familiesMapsGuard.inProgress.delete(mapId);
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
          Total familles : ${feature.properties.total_families}
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

    // Stocker l'instance de carte
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    // Marquer comme initialisé
    window.familiesMapsGuard.initialized.add(mapId);
    console.log("✅ Carte des familles monoparentales initialisée avec succès");

  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des familles monoparentales:", e);
  } finally {
    window.familiesMapsGuard.inProgress.delete(mapId);
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
  const mapId = 'communes-map-large-families';

  // Protection contre les initialisations multiples
  if (window.familiesMapsGuard.initialized.has(mapId) ||
      window.familiesMapsGuard.inProgress.has(mapId)) {
    console.log(`Carte ${mapId} déjà initialisée ou en cours`);
    return;
  }

  window.familiesMapsGuard.inProgress.add(mapId);

  const mapElement = document.getElementById(mapId);
  const geojsonElement = document.getElementById("communes-large-families-geojson");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte des familles nombreuses");
    window.familiesMapsGuard.inProgress.delete(mapId);
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.large_families_percentage).filter(v => v > 0).sort((a, b) => a - b);

    // Utiliser des discrétisations de Jenks si possible
    const clusters = values.length >= 4 ? ss.ckmeans(values, 4) : [[0], [values[0] || 5], [values[Math.floor(values.length/2)] || 10], [values[values.length-1] || 15]];
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    // Palette de couleurs pour les familles nombreuses (teintes d'orange)
    const colors = ["#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"];

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
          Total familles : ${feature.properties.total_families}
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

    // Stocker l'instance de carte
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    // Marquer comme initialisé
    window.familiesMapsGuard.initialized.add(mapId);
    console.log("✅ Carte des familles nombreuses initialisée avec succès");

  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des familles nombreuses:", e);
  } finally {
    window.familiesMapsGuard.inProgress.delete(mapId);
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

window.initializeFamiliesMap = initializeFamiliesMap;
window.initializeSingleParentMap = initializeSingleParentMap;
window.initializeLargeFamiliesMap = initializeLargeFamiliesMap;

// Créer aussi la fonction globale générale
window.initializeFamiliesMaps = function() {
  // Protection globale contre les appels multiples
  if (window.familiesMapsGuard.globalInit) {
    console.log('🛡️ initializeFamiliesMaps() déjà appelé, protection activée');
    return;
  }

  window.familiesMapsGuard.globalInit = true;
  console.log('🗺️ initializeFamiliesMaps() - Initialisation de toutes les cartes familles');

  // Séquencer les initialisations avec délais
  setTimeout(() => initializeFamiliesMap(), 100);
  setTimeout(() => initializeSingleParentMap(), 300);
  setTimeout(() => initializeLargeFamiliesMap(), 500);

  // Réinitialiser le garde global après un délai
  setTimeout(() => {
    window.familiesMapsGuard.globalInit = false;
  }, 2000);
};

// Garder aussi l'objet EpciFamiliesMaps pour compatibilité
window.EpciFamiliesMaps = {
  _initialized: false,
  init() {
    if (this._initialized) {
      console.log('🛡️ EpciFamiliesMaps.init() - Déjà initialisé');
      return;
    }

    console.log('🗺️ EpciFamiliesMaps.init() appelée');
    this._initialized = true;
    window.initializeFamiliesMaps();
  }
};

// Exporter les fonctions pour les rendre disponibles
export {
  initializeFamiliesMap,
  initializeSingleParentMap,
  initializeLargeFamiliesMap
};
