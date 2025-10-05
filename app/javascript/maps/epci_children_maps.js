/**
 * Ce fichier contient les fonctions pour initialiser les cartes relatives aux enfants de l'EPCI
 * - Carte des effectifs d'enfants <3 ans par commune
 * - Carte des taux d'enfants <3 ans par commune
 * - Carte des effectifs d'enfants 3-5 ans par commune
 * - Carte des taux d'enfants 3-5 ans par commune
 */

// Système de garde global pour éviter les initialisations multiples
if (!window.childrenMapsGuard) {
  window.childrenMapsGuard = {
    initialized: new Set(),
    inProgress: new Set()
  };
}

/**
 * Initialise la carte des effectifs d'enfants de moins de 3 ans par commune
 */
function initializeMapEffectifs() {
  const mapId = 'communes-map-effectifs';

  // Protection contre les initialisations multiples
  if (window.childrenMapsGuard.initialized.has(mapId) ||
      window.childrenMapsGuard.inProgress.has(mapId)) {
    console.log(`Carte ${mapId} déjà initialisée ou en cours`);
    return;
  }

  window.childrenMapsGuard.inProgress.add(mapId);

  const mapElement = document.getElementById(mapId);
  const geojsonElement = document.getElementById("communes-geojson");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires pour la carte des effectifs d'enfants <3 ans manquants");
    window.childrenMapsGuard.inProgress.delete(mapId);
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.children_under3).sort((a, b) => a - b);
    const clusters = ss.ckmeans(values, 4);
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    const colors = ["#6baed6", "#fed976", "#fd8d3c", "#e31a1c"];

    function getColor(count) {
      return count > breaks[3] ? colors[3] :
             count > breaks[2] ? colors[2] :
             count > breaks[1] ? colors[1] :
                                 colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.children_under3),
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
          Enfants < 3 ans : ${feature.properties.children_under3}<br>
          Taux : ${feature.properties.under3_rate.toFixed(2)}%<br>
          Population : ${feature.properties.population.toLocaleString('fr-FR')}
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

    renderLegend(breaks, "effectif-legend", colors);

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
    window.childrenMapsGuard.initialized.add(mapId);
    console.log("✅ Carte des effectifs d'enfants <3 ans initialisée avec succès");

  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des effectifs d'enfants <3 ans:", e);
  } finally {
    window.childrenMapsGuard.inProgress.delete(mapId);
  }
}

/**
 * Initialise la carte des taux d'enfants de moins de 3 ans par commune
 */
function initializeMapTaux() {
  const mapId = 'communes-map';

  // Protection contre les initialisations multiples
  if (window.childrenMapsGuard.initialized.has(mapId) ||
      window.childrenMapsGuard.inProgress.has(mapId)) {
    console.log(`Carte ${mapId} déjà initialisée ou en cours`);
    return;
  }

  window.childrenMapsGuard.inProgress.add(mapId);

  const mapElement = document.getElementById(mapId);
  const geojsonElement = document.getElementById("communes-geojson");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires pour la carte des taux d'enfants <3 ans manquants");
    window.childrenMapsGuard.inProgress.delete(mapId);
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.under3_rate).sort((a, b) => a - b);
    const clusters = ss.ckmeans(values, 4);
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    const colors = ["#6baed6", "#fed976", "#fd8d3c", "#e31a1c"];

    function getColor(rate) {
      return rate > breaks[3] ? colors[3] :
             rate > breaks[2] ? colors[2] :
             rate > breaks[1] ? colors[1] :
                                colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.under3_rate),
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
          Taux d'enfants < 3 ans : ${feature.properties.under3_rate.toFixed(2)}%<br>
          Enfants : ${feature.properties.children_under3}<br>
          Population : ${feature.properties.population.toLocaleString('fr-FR')}
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

    renderLegend(breaks, "taux-legend", colors, " %");

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
    window.childrenMapsGuard.initialized.add(mapId);
    console.log("✅ Carte des taux d'enfants <3 ans initialisée avec succès");

  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des taux d'enfants <3 ans:", e);
  } finally {
    window.childrenMapsGuard.inProgress.delete(mapId);
  }
}

/**
 * Initialise la carte des effectifs d'enfants de 3 à 5 ans par commune
 */
function initializeMapEffectifs3to5() {
  const mapId = 'communes-map-effectifs-3to5';

  // Protection contre les initialisations multiples
  if (window.childrenMapsGuard.initialized.has(mapId) ||
      window.childrenMapsGuard.inProgress.has(mapId)) {
    console.log(`Carte ${mapId} déjà initialisée ou en cours`);
    return;
  }

  window.childrenMapsGuard.inProgress.add(mapId);

  const mapElement = document.getElementById(mapId);
  const geojsonElement = document.getElementById("communes-geojson-3to5");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires pour la carte des effectifs d'enfants 3-5 ans manquants");
    window.childrenMapsGuard.inProgress.delete(mapId);
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.children_3to5).sort((a, b) => a - b);
    const clusters = ss.ckmeans(values, 4);
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    const colors = ["#6baed6", "#fed976", "#fd8d3c", "#e31a1c"];

    function getColor(count) {
      return count > breaks[3] ? colors[3] :
             count > breaks[2] ? colors[2] :
             count > breaks[1] ? colors[1] :
                                 colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.children_3to5),
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
          Enfants 3-5 ans : ${feature.properties.children_3to5}<br>
          Taux : ${feature.properties.rate_3to5.toFixed(2)}%<br>
          Population : ${feature.properties.population.toLocaleString('fr-FR')}
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

    renderLegend(breaks, "effectif-legend-3to5", colors);

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
    window.childrenMapsGuard.initialized.add(mapId);
    console.log("✅ Carte des effectifs d'enfants 3-5 ans initialisée avec succès");

  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des effectifs d'enfants 3-5 ans:", e);
  } finally {
    window.childrenMapsGuard.inProgress.delete(mapId);
  }
}

/**
 * Initialise la carte des taux d'enfants de 3 à 5 ans par commune
 */
function initializeMapTaux3to5() {
  const mapId = 'communes-map-3to5';

  // Protection contre les initialisations multiples
  if (window.childrenMapsGuard.initialized.has(mapId) ||
      window.childrenMapsGuard.inProgress.has(mapId)) {
    console.log(`Carte ${mapId} déjà initialisée ou en cours`);
    return;
  }

  window.childrenMapsGuard.inProgress.add(mapId);

  const mapElement = document.getElementById(mapId);
  const geojsonElement = document.getElementById("communes-geojson-3to5");

  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires pour la carte des taux d'enfants 3-5 ans manquants");
    window.childrenMapsGuard.inProgress.delete(mapId);
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features.map(f => f.properties.rate_3to5).sort((a, b) => a - b);
    const clusters = ss.ckmeans(values, 4);
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    const colors = ["#6baed6", "#fed976", "#fd8d3c", "#e31a1c"];

    function getColor(rate) {
      return rate > breaks[3] ? colors[3] :
             rate > breaks[2] ? colors[2] :
             rate > breaks[1] ? colors[1] :
                                colors[0];
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.rate_3to5),
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
          Taux d'enfants 3-5 ans : ${feature.properties.rate_3to5.toFixed(2)}%<br>
          Enfants : ${feature.properties.children_3to5}<br>
          Population : ${feature.properties.population.toLocaleString('fr-FR')}
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

    renderLegend(breaks, "taux-legend-3to5", colors, " %");

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
    window.childrenMapsGuard.initialized.add(mapId);
    console.log("✅ Carte des taux d'enfants 3-5 ans initialisée avec succès");

  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte des taux d'enfants 3-5 ans:", e);
  } finally {
    window.childrenMapsGuard.inProgress.delete(mapId);
  }
}

/**
 * Crée une légende pour les cartes
 * @param {Array} breaks - Les points de rupture pour la discrétisation
 * @param {string} containerId - L'ID du conteneur HTML pour la légende
 * @param {Array} colors - Les couleurs à utiliser pour la légende
 * @param {string} unit - L'unité à afficher (% ou vide pour les effectifs)
 */
function renderLegend(breaks, containerId, colors, unit = "") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Conteneur de légende #${containerId} non trouvé`);
    return;
  }

  container.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  const format = val => {
    if (unit.includes("%")) return val.toFixed(2);
    return Math.round(val);
  };

  const labels = [
    `≤ ${format(breaks[1] - 0.01)}${unit}`,
    `${format(breaks[1])} – ${format(breaks[2] - 0.01)}${unit}`,
    `${format(breaks[2])} – ${format(breaks[3] - 0.01)}${unit}`,
    `≥ ${format(breaks[3])}${unit}`
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

// Exposer les fonctions individuelles
window.initializeMapEffectifs = initializeMapEffectifs;
window.initializeMapTaux = initializeMapTaux;
window.initializeMapEffectifs3to5 = initializeMapEffectifs3to5;
window.initializeMapTaux3to5 = initializeMapTaux3to5;

// Créer la fonction globale avec séquencement
window.initializeChildrenMaps = function() {
  // Protection globale contre les appels multiples
  if (window.childrenMapsGuard.globalInit) {
    console.log('🛡️ initializeChildrenMaps() déjà appelé, protection activée');
    return;
  }

  window.childrenMapsGuard.globalInit = true;
  console.log('🗺️ initializeChildrenMaps() - Initialisation de toutes les cartes enfants');

  // Séquencer les initialisations avec délais
  setTimeout(() => initializeMapEffectifs(), 100);
  setTimeout(() => initializeMapTaux(), 300);
  setTimeout(() => initializeMapEffectifs3to5(), 500);
  setTimeout(() => initializeMapTaux3to5(), 700);

  // Réinitialiser le garde global après un délai
  setTimeout(() => {
    window.childrenMapsGuard.globalInit = false;
  }, 2000);
};

// Objet EpciChildrenMaps pour compatibilité avec async_section_loader.js
window.EpciChildrenMaps = {
  _initialized: false,
  init() {
    if (this._initialized) {
      console.log('🛡️ EpciChildrenMaps.init() - Déjà initialisé');
      return;
    }

    console.log('🗺️ EpciChildrenMaps.init() appelée');
    window.initializeChildrenMaps();
    this._initialized = true;  // ✅ CORRECTION: marqué comme initialisé APRÈS l'appel
  }
};

// Exporter les fonctions pour les rendre disponibles
export {
  initializeMapEffectifs,
  initializeMapTaux,
  initializeMapEffectifs3to5,
  initializeMapTaux3to5,
  renderLegend
};
