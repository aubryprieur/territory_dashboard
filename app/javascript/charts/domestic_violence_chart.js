// Graphiques pour les violences intrafamiliales

// ✅ CHARGEMENT INITIAL (pour les pages complètes)
document.addEventListener('turbo:load', function() {
  initDomesticViolenceChart();
});

// ✅ CHARGEMENT ASYNCHRONE (pour les sections dashboard)
document.addEventListener('dashboard:sectionLoaded', function(event) {
  if (event.detail.section === 'domestic_violence') {
    console.log("🎯 Section domestic_violence chargée, initialisation du graphique");

    // Attendre un peu que le DOM et les données soient prêts
    setTimeout(() => {
      initDomesticViolenceChart();
    }, 200);
  }
});

// Fonction centralisée pour initialiser le graphique des violences intrafamiliales
function initDomesticViolenceChart() {
  console.log("🎯 Initialisation du graphique des violences intrafamiliales");

  const chartElement = document.getElementById('domestic-violence-chart');
  if (!chartElement) {
    console.warn("❌ Élément canvas 'domestic-violence-chart' non trouvé");
    return;
  }

  if (typeof Chart === "undefined") {
    console.warn("❌ Chart.js non disponible");
    return;
  }

  // ✅ VÉRIFIER QUE LES DONNÉES SONT DISPONIBLES
  if (!window.domesticViolenceData) {
    console.warn("❌ window.domesticViolenceData non disponible, tentative de relecture");

    // Essayer de relire les données depuis le DOM
    tryToLoadDomesticViolenceDataFromDOM();

    // Si toujours pas disponible après tentative, abandonner
    if (!window.domesticViolenceData) {
      console.error("❌ Impossible de charger window.domesticViolenceData");
      return;
    }
  }

  // Récupérer les données depuis la variable globale
  const { years, communeData, departmentData, regionData, territoryNames } = window.domesticViolenceData;

  console.log("🔍 Données violences intrafamiliales:", {
    years: years?.length || 0,
    commune: communeData?.length || 0,
    department: departmentData?.length || 0,
    region: regionData?.length || 0
  });

  if (!years || !years.length) {
    console.warn("⚠️ Données manquantes pour le graphique des violences intrafamiliales");
    return;
  }

  // Nettoyer d'éventuels graphiques existants
  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      console.log("🧹 Destruction du graphique existant");
      existingChart.destroy();
    }
  } catch (e) {
    console.warn("Erreur lors du nettoyage du graphique existant:", e);
  }

  const datasets = [];

  // Dataset pour la commune
  if (communeData && communeData.some(val => val !== null && val !== undefined)) {
    datasets.push({
      label: territoryNames.commune,
      data: communeData,
      borderColor: 'rgba(220, 38, 38, 1)',
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointBackgroundColor: 'rgba(220, 38, 38, 1)'
    });
  }

  // Dataset pour le département
  if (departmentData && departmentData.some(val => val !== null && val !== undefined)) {
    datasets.push({
      label: territoryNames.department,
      data: departmentData,
      borderColor: 'rgba(79, 70, 229, 1)',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointBackgroundColor: 'rgba(79, 70, 229, 1)'
    });
  }

  // Dataset pour la région
  if (regionData && regionData.some(val => val !== null && val !== undefined)) {
    datasets.push({
      label: territoryNames.region,
      data: regionData,
      borderColor: 'rgba(16, 185, 129, 1)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointBackgroundColor: 'rgba(16, 185, 129, 1)'
    });
  }

  console.log(`📊 Datasets préparés:`, datasets.length, "datasets");

  try {
    const chart = new Chart(chartElement, {
      type: 'line',
      data: {
        labels: years,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.raw.toFixed(2) + ' pour 1000 hab.';
              }
            }
          },
          datalabels: {
            display: false // Désactiver les étiquettes de données pour ce graphique
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Taux pour 1000 habitants'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Année'
            }
          }
        }
      }
    });

    // ✅ Stocker l'instance du graphique globalement pour la gestion du redimensionnement
    if (!window.chartInstances) {
      window.chartInstances = new Map();
    }
    window.chartInstances.set('domestic-violence-chart', chart);

    console.log("✅ Graphique des violences intrafamiliales créé avec succès");
  } catch (e) {
    console.error("❌ Erreur lors de la création du graphique des violences intrafamiliales:", e);
  }
}

// ✅ NOUVELLE FONCTION: Essayer de charger les données depuis le DOM
function tryToLoadDomesticViolenceDataFromDOM() {
  console.log("🔄 Tentative de chargement des données violences depuis le DOM");

  // Chercher le script qui contient les données
  const scriptElements = document.querySelectorAll('script');
  let foundData = false;

  for (let script of scriptElements) {
    const content = script.innerHTML;
    if (content.includes('window.domesticViolenceData')) {
      console.log("📄 Script de données violences trouvé, exécution...");
      try {
        // Exécuter le contenu du script
        eval(content);
        foundData = true;
        console.log("✅ Données violences chargées depuis le DOM");
        break;
      } catch (e) {
        console.error("❌ Erreur lors de l'exécution du script:", e);
      }
    }
  }

  if (!foundData) {
    console.warn("⚠️ Script de données violences non trouvé dans le DOM");
  }
}
