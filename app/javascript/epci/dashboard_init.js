// app/javascript/epci/dashboard_init.js

import { initializeCommuneSearch } from "epci/commune_search";
import { initializeTabsScroll } from "epci/tabs_scroll";

// Fonction d'initialisation principale du dashboard EPCI
function initializeEpciDashboard() {
  console.log("🚀 Initialisation du dashboard EPCI");

  // ✅ Récupérer les données des communes depuis l'élément JSON
  const communesDataElement = document.getElementById('communes-data-json');

  if (!communesDataElement) {
    console.warn('❌ Élément communes-data-json non trouvé dans le DOM');
    return;
  }

  try {
    // ✅ Parser les données JSON
    const data = JSON.parse(communesDataElement.textContent);
    console.log('📊 Données parsées:', data);

    // ✅ Validation des données
    if (!data || !data.communes || !Array.isArray(data.communes)) {
      console.error('❌ Structure de données invalide:', data);
      return;
    }

    const communes = data.communes;
    console.log(`✅ ${communes.length} communes trouvées pour la recherche`);

    // ✅ Validation que les communes ont les propriétés requises
    const validCommunes = communes.filter(commune => {
      return commune && commune.code && commune.name;
    });

    if (validCommunes.length !== communes.length) {
      console.warn(`⚠️ ${communes.length - validCommunes.length} communes ignorées (données manquantes)`);
    }

    // ✅ Initialiser la recherche de communes avec les données validées
    const searchInstance = initializeCommuneSearch(validCommunes);

    if (searchInstance) {
      console.log('✅ Recherche de communes initialisée avec succès');
    } else {
      console.error('❌ Échec de l\'initialisation de la recherche');
    }

  } catch (error) {
    console.error('❌ Erreur lors du parsing des données des communes:', error);
    console.error('Contenu de l\'élément:', communesDataElement.textContent.substring(0, 200) + '...');
  }

  // ✅ Initialiser le scroll des onglets
  try {
    initializeTabsScroll();
    console.log('✅ Scroll des onglets initialisé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du scroll des onglets:', error);
  }
}

// ✅ Initialiser au chargement du DOM et avec Turbo
document.addEventListener('DOMContentLoaded', initializeEpciDashboard);
document.addEventListener('turbo:load', initializeEpciDashboard);

// Export pour pouvoir être utilisé ailleurs si nécessaire
export { initializeEpciDashboard };
