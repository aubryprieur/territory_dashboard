import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tab", "panel"]
  static values = { defaultTab: String }

  connect() {
    console.log("🚀 Dashboard tabs controller connecté")

    // Restaurer l'onglet sauvegardé ou utiliser l'onglet par défaut
    const storedTab = this.getStoredActiveTab()
    const defaultTabId = storedTab || this.defaultTabValue || this.tabTargets[0]?.dataset.tabId

    if (defaultTabId) {
      this.showTab(defaultTabId)
    }

    // Initialiser le système de défilement des onglets
    this.initializeTabsScroll()
  }

  disconnect() {
    console.log("🔌 Dashboard tabs controller déconnecté")
  }

  switch(event) {
    event.preventDefault()
    const tabId = event.currentTarget.dataset.tabId
    console.log(`🔄 Changement d'onglet vers: ${tabId}`)
    this.showTab(tabId)
  }

  switchFromSelect(event) {
    const tabId = event.target.value
    this.showTab(tabId)
  }

  showTab(tabId) {
    console.log(`📋 Affichage de l'onglet: ${tabId}`)

    // Désactiver tous les onglets
    this.tabTargets.forEach(tab => {
      // Retirer la classe d'état actif personnalisée
      tab.classList.remove("tab-active");
      // Ajouter les classes d'état inactif
      tab.classList.add("text-gray-500", "border-transparent");
    });

    // Masquer tous les panneaux
    this.panelTargets.forEach(panel => {
      panel.classList.add("hidden");
    });

    // Activer l'onglet sélectionné
    const activeTab = this.tabTargets.find(tab => tab.dataset.tabId === tabId);
    if (activeTab) {
      // Retirer les classes d'état inactif
      activeTab.classList.remove("text-gray-500", "border-transparent");
      // Ajouter la classe d'état actif personnalisée
      activeTab.classList.add("tab-active");
    }

    // Afficher le panneau correspondant
    const activePanel = this.panelTargets.find(panel => panel.dataset.tabId === tabId);
    if (activePanel) {
      activePanel.classList.remove("hidden");

      // Redimensionner les cartes et graphiques après affichage
      setTimeout(() => {
        this.resizeChartsAndMaps();
      }, 100);
    }

    // Sauvegarder l'onglet actif dans le localStorage
    localStorage.setItem('dashboard-active-tab', tabId);
  }

  resizeChartsAndMaps() {
    console.log("🔄 Redimensionnement des cartes et graphiques")

    // Redimensionner les cartes Leaflet
    if (window.leafletMaps) {
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
    if (window.chartInstances) {
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

  // Restaurer l'onglet actif depuis le localStorage
  getStoredActiveTab() {
    return localStorage.getItem('dashboard-active-tab')
  }

  // Initialiser le système de défilement des onglets
  initializeTabsScroll() {
    const tabsContainer = document.getElementById('dashboard-tabs-container');
    const scrollLeftButton = document.getElementById('dashboard-scroll-left');
    const scrollRightButton = document.getElementById('dashboard-scroll-right');
    const gradientLeft = document.getElementById('dashboard-gradient-left');
    const gradientRight = document.getElementById('dashboard-gradient-right');

    if (!tabsContainer || !scrollLeftButton || !scrollRightButton) {
      console.warn("⚠️ Éléments de scroll des onglets non trouvés");
      return;
    }

    // Fonction pour mettre à jour la visibilité des boutons
    const updateScrollButtons = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;

      // Bouton gauche
      if (scrollLeft <= 5) {
        scrollLeftButton.style.opacity = '0';
        scrollLeftButton.style.pointerEvents = 'none';
        if (gradientLeft) gradientLeft.style.opacity = '0';
      } else {
        scrollLeftButton.style.opacity = '1';
        scrollLeftButton.style.pointerEvents = 'auto';
        if (gradientLeft) gradientLeft.style.opacity = '1';
      }

      // Bouton droite
      if (scrollLeft >= scrollWidth - clientWidth - 5) {
        scrollRightButton.style.opacity = '0';
        scrollRightButton.style.pointerEvents = 'none';
        if (gradientRight) gradientRight.style.opacity = '0';
      } else {
        scrollRightButton.style.opacity = '1';
        scrollRightButton.style.pointerEvents = 'auto';
        if (gradientRight) gradientRight.style.opacity = '1';
      }
    };

    // Événements de scroll
    scrollLeftButton.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
    });

    scrollRightButton.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });
    });

    // Mettre à jour les boutons lors du scroll
    tabsContainer.addEventListener('scroll', updateScrollButtons);

    // Mettre à jour les boutons lors du redimensionnement
    window.addEventListener('resize', updateScrollButtons);

    // Initialisation
    updateScrollButtons();

    console.log("✅ Système de scroll des onglets initialisé");
  }
}
