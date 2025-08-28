/**
 * Ce fichier contient les fonctions pour initialiser les cartes relatives à la scolarisation dans l'EPCI
 * - Carte des taux de scolarisation des enfants de 2 ans par commune
 * - Carte des taux de scolarisation des enfants de 3 à 5 ans par commune
 */

// Fonction pour initialiser la carte des taux de scolarisation à 2 ans
function initializeSchooling2yMap() {
  const mapElement = document.getElementById("communes-map-schooling-2y");
  const geojsonElement = document.getElementById("communes-schooling-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte de scolarisation à 2 ans");
    return;
  }

  // ✅ Vérification simple pour éviter la double initialisation
  if (mapElement._leaflet_id) {
    console.log("Carte de scolarisation à 2 ans déjà initialisée");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features
      .filter(f => f.properties.total_children_2y >= 5)
      .map(f => f.properties.schooling_rate_2y)
      .sort((a, b) => a - b);

    // Utiliser des discrétisations de Jenks si possible
    const clusters = values.length >= 4 ? ss.ckmeans(values, 4) : [[0], [25], [50], [75], [100]];
    const breaks = clusters.map(c => c[0]);
    breaks.push(clusters[clusters.length - 1].slice(-1)[0]);

    // Palette de couleurs pour le taux de scolarisation à 2 ans
    const colors = ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"];

    function getColor(rate) {
      return rate > breaks[4] ? colors[4] :
             rate > breaks[3] ? colors[3] :
             rate > breaks[2] ? colors[2] :
             rate > breaks[1] ? colors[1] :
                              colors[0];
    }

    function style(feature) {
      // Couleur grise pour les communes avec trop peu d'enfants
      if (feature.properties.total_children_2y < 5) {
        return {
          fillColor: "#e5e7eb",
          weight: 1,
          opacity: 1,
          color: "white",
          fillOpacity: 0.7
        };
      }

      return {
        fillColor: getColor(feature.properties.schooling_rate_2y),
        weight: 1,
        opacity: 1,
        color: "white",
        fillOpacity: 0.7
      };
    }

    function onEachFeature(feature, layer) {
      const props = feature.properties;
      const insignificantData = props.total_children_2y < 5;

      const popup = `
        <div class="text-sm">
          <strong>${props.name}</strong><br>
          ${insignificantData
            ? `<span class="text-gray-500">Données non significatives (moins de 5 enfants)</span><br>`
            : `Taux de scolarisation à 2 ans : <strong>${props.schooling_rate_2y.toFixed(1)}%</strong><br>`}
          Enfants de 2 ans : ${props.total_children_2y} enfants<br>
          Enfants de 2 ans scolarisés : ${props.schooled_children_2y} enfants
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
    createSchooling2yLegend(breaks, "schooling-2y-legend", colors);

    // ✅ Stocker l'instance de carte ET ses bounds initiaux
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    console.log("✅ Carte des taux de scolarisation à 2 ans initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte de scolarisation à 2 ans:", e);
  }
}

// Fonction pour créer la légende des taux de scolarisation à 2 ans
function createSchooling2yLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  // Ajouter une entrée pour les données non significatives
  const insignificantItem = document.createElement("div");
  insignificantItem.className = "flex items-center";
  const insignificantColorBox = document.createElement("div");
  insignificantColorBox.className = "w-4 h-4 rounded mr-2";
  insignificantColorBox.style.backgroundColor = "#e5e7eb";
  const insignificantLabel = document.createElement("span");
  insignificantLabel.textContent = "Données non significatives (<5 enfants)";
  insignificantItem.appendChild(insignificantColorBox);
  insignificantItem.appendChild(insignificantLabel);
  legend.appendChild(insignificantItem);

  const format = val => val.toFixed(1);

  const labels = [
    `≤ ${format(breaks[1])}%`,
    `${format(breaks[1])}% – ${format(breaks[2])}%`,
    `${format(breaks[2])}% – ${format(breaks[3])}%`,
    `${format(breaks[3])}% – ${format(breaks[4])}%`,
    `≥ ${format(breaks[4])}%`
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

// Fonction pour initialiser la carte des taux de scolarisation de 3 à 5 ans
function initializeSchooling35yMap() {
  const mapElement = document.getElementById("communes-map-schooling-3-5y");
  const geojsonElement = document.getElementById("communes-schooling-geojson");
  if (!mapElement || !geojsonElement || typeof L === "undefined" || typeof ss === "undefined") {
    console.warn("Éléments nécessaires non trouvés pour la carte de scolarisation 3-5 ans");
    return;
  }

  // ✅ Vérification simple pour éviter la double initialisation
  if (mapElement._leaflet_id) {
    console.log("Carte de scolarisation 3-5 ans déjà initialisée");
    return;
  }

  try {
    const geojsonData = JSON.parse(geojsonElement.textContent);
    const values = geojsonData.features
      .filter(f => f.properties.total_children_3_5y >= 10)
      .map(f => f.properties.schooling_rate_3_5y)
      .sort((a, b) => a - b);

    // Pour les 3-5 ans, utiliser des seuils adaptés (généralement plus élevés)
    const breaks = [0, 85, 90, 95, 100]; // Seuils fixes adaptés aux taux généralement élevés

    // Palette de couleurs pour le taux de scolarisation de 3 à 5 ans (teintes de vert)
    const colors = ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#238b45"];

    function getColor(rate) {
      return rate > breaks[4] ? colors[4] :
             rate > breaks[3] ? colors[3] :
             rate > breaks[2] ? colors[2] :
             rate > breaks[1] ? colors[1] :
                              colors[0];
    }

    function style(feature) {
      // Couleur grise pour les communes avec trop peu d'enfants
      if (feature.properties.total_children_3_5y < 10) {
        return {
          fillColor: "#e5e7eb",
          weight: 1,
          opacity: 1,
          color: "white",
          fillOpacity: 0.7
        };
      }

      return {
        fillColor: getColor(feature.properties.schooling_rate_3_5y),
        weight: 1,
        opacity: 1,
        color: "white",
        fillOpacity: 0.7
      };
    }

    function onEachFeature(feature, layer) {
      const props = feature.properties;
      const insignificantData = props.total_children_3_5y < 10;

      const popup = `
        <div class="text-sm">
          <strong>${props.name}</strong><br>
          ${insignificantData
            ? `<span class="text-gray-500">Données non significatives (moins de 10 enfants)</span><br>`
            : `Taux de scolarisation 3-5 ans : <strong>${props.schooling_rate_3_5y.toFixed(1)}%</strong><br>`}
          Enfants de 3 à 5 ans : ${props.total_children_3_5y} enfants<br>
          Enfants de 3 à 5 ans scolarisés : ${props.schooled_children_3_5y} enfants
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
    createSchooling35yLegend(breaks, "schooling-3-5y-legend", colors);

    // ✅ Stocker l'instance de carte
    if (!window.leafletMaps) {
      window.leafletMaps = new Map();
    }
    if (!window.mapBounds) {
      window.mapBounds = new Map();
    }

    window.leafletMaps.set(mapElement.id, map);
    window.mapBounds.set(mapElement.id, bounds);

    console.log("✅ Carte des taux de scolarisation 3-5 ans initialisée avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation de la carte de scolarisation 3-5 ans:", e);
  }
}

// Fonction pour créer la légende des taux de scolarisation de 3 à 5 ans
function createSchooling35yLegend(breaks, containerId, colors) {
  const legendContainer = document.getElementById(containerId);
  if (!legendContainer) return;

  legendContainer.innerHTML = "";

  const legend = document.createElement("div");
  legend.className = "flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-700";

  // Ajouter une entrée pour les données non significatives
  const insignificantItem = document.createElement("div");
  insignificantItem.className = "flex items-center";
  const insignificantColorBox = document.createElement("div");
  insignificantColorBox.className = "w-4 h-4 rounded mr-2";
  insignificantColorBox.style.backgroundColor = "#e5e7eb";
  const insignificantLabel = document.createElement("span");
  insignificantLabel.textContent = "Données non significatives (<10 enfants)";
  insignificantItem.appendChild(insignificantColorBox);
  insignificantItem.appendChild(insignificantLabel);
  legend.appendChild(insignificantItem);

  const labels = [
    `< 85%`,
    `85% – 90%`,
    `90% – 95%`,
    `95% – 100%`,
    `100%`
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

// 🚀 AJOUT CRITIQUE : Exposer l'objet pour le système asynchrone
window.EpciSchoolingMaps = {
  init() {
    console.log('🗺️ EpciSchoolingMaps.init() appelée');

    // Initialiser toutes les cartes de scolarisation
    initializeSchooling2yMap();
    initializeSchooling35yMap();
  }
};

// ✅ SUPPRIMÉ : L'écouteur turbo:load car maintenant géré par le système asynchrone
// document.addEventListener("turbo:load", function() {
//   initializeSchooling2yMap();
//   initializeSchooling35yMap();
// });

// Exporter les fonctions pour les rendre disponibles
export {
  initializeSchooling2yMap,
  initializeSchooling35yMap
};
