// Fonction d'initialisation principale du dashboard communes
function initializeDashboard() {
  console.log("🚀 Initialisation du dashboard communes");

  // Vérifier que nous sommes sur la page dashboard
  const dashboardElement = document.querySelector('[data-controller="dashboard-tabs"]');
  if (!dashboardElement) {
    console.log('ℹ️ Dashboard communes non détecté sur cette page');
    return;
  }

  try {
    // Initialiser le redimensionnement des graphiques et cartes
    initializeResizeHandlers();
    console.log('✅ Gestionnaires de redimensionnement initialisés');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des gestionnaires de redimensionnement:', error);
  }

  try {
    // Initialiser les interactions spécifiques au dashboard
    initializeDashboardInteractions();
    console.log('✅ Interactions du dashboard initialisées');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des interactions:', error);
  }
}

// Initialiser les gestionnaires de redimensionnement pour les graphiques et cartes
function initializeResizeHandlers() {
  // Créer les objets globaux pour stocker les instances si ils n'existent pas
  if (!window.leafletMaps) {
    window.leafletMaps = new Map();
  }

  if (!window.chartInstances) {
    window.chartInstances = new Map();
  }

  if (!window.mapBounds) {
    window.mapBounds = new Map();
  }

  // Gérer le redimensionnement de la fenêtre
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeAllChartsAndMaps();
    }, 250);
  });
}

// Fonction pour redimensionner tous les graphiques et cartes visibles
function resizeAllChartsAndMaps() {
  console.log("🔄 Redimensionnement global des éléments visuels");

  // Redimensionner les cartes Leaflet
  if (window.leafletMaps && window.leafletMaps.size > 0) {
    window.leafletMaps.forEach((map, elementId) => {
      const element = document.getElementById(elementId);
      if (element && !element.closest('.hidden') && map && map.invalidateSize) {
        try {
          map.invalidateSize(true);

          // Repositionner avec les bounds stockés
          if (window.mapBounds && window.mapBounds.has(elementId)) {
            const bounds = window.mapBounds.get(elementId);
            if (bounds && bounds.isValid()) {
              map.fitBounds(bounds);
            }
          }

          console.log(`✅ Carte redimensionnée: ${elementId}`);
        } catch (error) {
          console.warn(`⚠️ Erreur redimensionnement carte ${elementId}:`, error);
        }
      }
    });
  }

  // Redimensionner les graphiques Chart.js
  if (window.chartInstances && window.chartInstances.size > 0) {
    window.chartInstances.forEach((chart, elementId) => {
      const element = document.getElementById(elementId);
      if (element && !element.closest('.hidden') && chart && chart.resize) {
        try {
          chart.resize();
          console.log(`✅ Graphique redimensionné: ${elementId}`);
        } catch (error) {
          console.warn(`⚠️ Erreur redimensionnement graphique ${elementId}:`, error);
        }
      }
    });
  }
}

// Initialiser les interactions spécifiques au dashboard
function initializeDashboardInteractions() {
  // Ajouter des gestionnaires d'événements pour les éléments interactifs

  // Gérer les tooltips dynamiques
  initializeTooltips();

  // Gérer les animations au scroll
  initializeScrollAnimations();

  // Gérer les boutons d'export (si présents)
  initializeExportButtons();
}

// Initialiser les tooltips
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
  });
}

// Afficher un tooltip
function showTooltip(event) {
  const tooltip = event.target.getAttribute('data-tooltip');
  if (!tooltip) return;

  // Créer l'élément tooltip
  const tooltipElement = document.createElement('div');
  tooltipElement.className = 'absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none';
  tooltipElement.textContent = tooltip;
  tooltipElement.id = 'dynamic-tooltip';

  // Positionner le tooltip
  document.body.appendChild(tooltipElement);

  const rect = event.target.getBoundingClientRect();
  tooltipElement.style.left = rect.left + (rect.width / 2) - (tooltipElement.offsetWidth / 2) + 'px';
  tooltipElement.style.top = rect.top - tooltipElement.offsetHeight - 5 + 'px';
}

// Masquer un tooltip
function hideTooltip() {
  const tooltip = document.getElementById('dynamic-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

// Initialiser les animations au scroll
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeIn');
      }
    });
  }, observerOptions);

  // Observer les cartes et graphiques
  const animatedElements = document.querySelectorAll('.dashboard-panel > div > div');
  animatedElements.forEach(element => {
    observer.observe(element);
  });
}

// Initialiser les boutons d'export
function initializeExportButtons() {
  const exportButtons = document.querySelectorAll('[data-export]');

  exportButtons.forEach(button => {
    button.addEventListener('click', handleExport);
  });
}

// Gérer l'export de données
function handleExport(event) {
  const exportType = event.target.getAttribute('data-export');
  const exportTarget = event.target.getAttribute('data-export-target');

  console.log(`📊 Export demandé: ${exportType} pour ${exportTarget}`);

  // Ici vous pouvez ajouter la logique d'export spécifique
  // selon le type (PDF, CSV, PNG, etc.)
}

// Fonction utilitaire pour debugger les onglets
function debugTabsState() {
  console.log("🔍 État actuel des onglets:");

  const tabs = document.querySelectorAll('[data-dashboard-tabs-target="tab"]');
  const panels = document.querySelectorAll('[data-dashboard-tabs-target="panel"]');

  console.log("Onglets:", tabs.length);
  tabs.forEach((tab, index) => {
    console.log(`  - Onglet ${index}: ${tab.dataset.tabId}, actif: ${tab.classList.contains('tab-active')}`);
  });

  console.log("Panneaux:", panels.length);
  panels.forEach((panel, index) => {
    console.log(`  - Panneau ${index}: ${panel.dataset.tabId}, visible: ${!panel.classList.contains('hidden')}`);
  });
}

// Fonction pour changer d'onglet depuis le console (utile pour debug)
function switchToTab(tabId) {
  const controller = document.querySelector('[data-controller="dashboard-tabs"]');
  if (controller && controller.controller) {
    controller.controller.showTab(tabId);
  } else {
    console.warn(`⚠️ Contrôleur d'onglets non trouvé`);
  }
}

// Exposer les fonctions utiles globalement pour le debug
window.dashboardDebug = {
  debugTabsState,
  switchToTab,
  resizeAllChartsAndMaps
};

// ✅ Initialiser au chargement du DOM et avec Turbo
document.addEventListener('DOMContentLoaded', initializeDashboard);
document.addEventListener('turbo:load', initializeDashboard);

// Export pour pouvoir être utilisé ailleurs si nécessaire
export { initializeDashboard, resizeAllChartsAndMaps };
