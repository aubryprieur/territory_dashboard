// Graphiques pour les données économiques

// ✅ CHARGEMENT INITIAL (pour les pages complètes)
document.addEventListener('turbo:load', function() {
  initEconomicCharts();
});

// ✅ CHARGEMENT ASYNCHRONE (pour les sections dashboard)
document.addEventListener('dashboard:sectionLoaded', function(event) {
  if (event.detail.section === 'economic_data') {
    console.log("🎯 Section economic_data chargée, initialisation des graphiques");

    // Attendre un peu que le DOM et le script soient prêts
    setTimeout(() => {
      initEconomicCharts();
    }, 200);
  }
});

// Fonction centralisée pour initialiser tous les graphiques économiques
function initEconomicCharts() {
  console.log("🎯 Initialisation des graphiques économiques");

  // ✅ AJOUT: Vérifier que les données sont disponibles avant de continuer
  if (!window.economicData) {
    console.warn("❌ window.economicData non disponible, tentative de relecture");

    // Essayer de relire les données depuis les éléments script dans le DOM
    tryToLoadEconomicDataFromDOM();

    // Si toujours pas disponible après tentative, abandonner
    if (!window.economicData) {
      console.error("❌ Impossible de charger window.economicData");
      return;
    }
  }

  initRevenueChart();
  initPovertyChart();
}

// ✅ NOUVELLE FONCTION: Essayer de charger les données depuis le DOM
function tryToLoadEconomicDataFromDOM() {
  console.log("🔄 Tentative de chargement des données économiques depuis le DOM");

  // Chercher le script qui contient les données
  const scriptElements = document.querySelectorAll('script');
  let foundData = false;

  for (let script of scriptElements) {
    const content = script.innerHTML;
    if (content.includes('window.economicData = {}')) {
      console.log("📄 Script de données économiques trouvé, exécution...");
      try {
        // Exécuter le contenu du script
        eval(content);
        foundData = true;
        console.log("✅ Données économiques chargées depuis le DOM");
        break;
      } catch (e) {
        console.error("❌ Erreur lors de l'exécution du script:", e);
      }
    }
  }

  if (!foundData) {
    console.warn("⚠️ Script de données économiques non trouvé dans le DOM");
  }
}

// Graphique évolution des revenus médians
function initRevenueChart() {
  console.log("Tentative d'initialisation du graphique des revenus");

  const chartElement = document.getElementById('revenue-chart');
  if (!chartElement) {
    console.warn("Élément canvas 'revenue-chart' non trouvé");
    return;
  }

  // Vérifier que les données sont disponibles
  if (!window.economicData) {
    console.warn("window.economicData non disponible pour les revenus");
    return;
  }

  console.log("🔍 Données économiques disponibles:", window.economicData);

  // Ces variables seront injectées par Ruby dans le code HTML généré
  const communeRevenueData = window.economicData?.communeRevenueData || {};
  const epciRevenueData = window.economicData?.epciRevenueData || {};
  const departmentRevenueData = window.economicData?.departmentRevenueData || {};
  const regionRevenueData = window.economicData?.regionRevenueData || {};
  const franceRevenueData = window.economicData?.franceRevenueData || {};

  const communeName = window.economicData?.communeName || "";
  const epciName = window.economicData?.epciName || "EPCI";
  const departmentName = window.economicData?.departmentName || "Département";
  const regionName = window.economicData?.regionName || "Région";

  console.log("🔍 Données revenus:", {
    commune: Object.keys(communeRevenueData).length,
    epci: Object.keys(epciRevenueData).length,
    department: Object.keys(departmentRevenueData).length,
    region: Object.keys(regionRevenueData).length,
    france: Object.keys(franceRevenueData).length
  });

  if (
    Object.keys(communeRevenueData).length === 0 &&
    Object.keys(epciRevenueData).length === 0 &&
    Object.keys(departmentRevenueData).length === 0 &&
    Object.keys(regionRevenueData).length === 0 &&
    Object.keys(franceRevenueData).length === 0
  ) {
    console.warn("Aucune donnée de revenus disponible");
    return;
  }

  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) existingChart.destroy();
  } catch (e) {
    console.warn("Erreur en vérifiant si un graphique de revenus existant:", e);
  }

  const allYears = new Set();
  [communeRevenueData, epciRevenueData, departmentRevenueData, regionRevenueData, franceRevenueData].forEach(data => {
    Object.keys(data).forEach(year => allYears.add(year));
  });
  const years = Array.from(allYears).sort();

  const colors = {
    commune: { line: 'rgba(79, 209, 197, 1)', fill: 'rgba(79, 209, 197, 0.2)' },
    epci: { line: 'rgba(59, 130, 246, 1)', fill: 'rgba(59, 130, 246, 0.2)' },
    department: { line: 'rgba(139, 92, 246, 1)', fill: 'rgba(139, 92, 246, 0.2)' },
    region: { line: 'rgba(249, 115, 22, 1)', fill: 'rgba(249, 115, 22, 0.2)' },
    france: { line: 'rgba(220, 38, 38, 1)', fill: 'rgba(220, 38, 38, 0.2)' }
  };

  const datasets = [];

  if (Object.keys(communeRevenueData).length > 0) {
    datasets.push({
      label: communeName,
      data: years.map(year => communeRevenueData[year] || null),
      backgroundColor: colors.commune.fill,
      borderColor: colors.commune.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.commune.line
    });
  }

  if (Object.keys(epciRevenueData).length > 0) {
    datasets.push({
      label: epciName,
      data: years.map(year => epciRevenueData[year] || null),
      backgroundColor: colors.epci.fill,
      borderColor: colors.epci.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.epci.line
    });
  }

  if (Object.keys(departmentRevenueData).length > 0) {
    datasets.push({
      label: departmentName,
      data: years.map(year => departmentRevenueData[year] || null),
      backgroundColor: colors.department.fill,
      borderColor: colors.department.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.department.line
    });
  }

  if (Object.keys(regionRevenueData).length > 0) {
    datasets.push({
      label: regionName,
      data: years.map(year => regionRevenueData[year] || null),
      backgroundColor: colors.region.fill,
      borderColor: colors.region.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.region.line
    });
  }

  if (Object.keys(franceRevenueData).length > 0) {
    datasets.push({
      label: 'France',
      data: years.map(year => franceRevenueData[year] || null),
      backgroundColor: colors.france.fill,
      borderColor: colors.france.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.france.line
    });
  }

  try {
    new Chart(chartElement, {
      type: 'line',
      data: {
        labels: years,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function (value) {
                return new Intl.NumberFormat('fr-FR').format(value) + ' €';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.dataset.label + ': ' + new Intl.NumberFormat('fr-FR').format(context.raw) + ' €';
              }
            }
          },
          datalabels: {
            display: false
          }
        }
      }
    });

    console.log("✅ Graphique des revenus créé avec succès");
  } catch (e) {
    console.error("❌ Erreur lors de la création du graphique des revenus:", e);
  }
}

// Graphique évolution du taux de pauvreté
function initPovertyChart() {
  console.log("Tentative d'initialisation du graphique des taux de pauvreté");

  // Vérifier si l'élément canvas existe
  const chartElement = document.getElementById('poverty-chart');
  if (!chartElement) {
    console.warn("Élément canvas 'poverty-chart' non trouvé");
    return;
  }

  // Vérifier que les données sont disponibles
  if (!window.economicData) {
    console.warn("window.economicData non disponible pour la pauvreté");
    return;
  }

  // Récupérer les données de taux de pauvreté pour tous les territoires
  const communePovertyData = window.economicData?.communePovertyData || {};
  const epciPovertyData = window.economicData?.epciPovertyData || {};
  const departmentPovertyData = window.economicData?.departmentPovertyData || {};
  const regionPovertyData = window.economicData?.regionPovertyData || {};
  const francePovertyData = window.economicData?.francePovertyData || {};

  // Récupérer les noms des territoires
  const communeName = window.economicData?.communeName || "";
  const epciName = window.economicData?.epciName || "EPCI";
  const departmentName = window.economicData?.departmentName || "Département";
  const regionName = window.economicData?.regionName || "Région";

  // Si aucune donnée n'est disponible pour aucun territoire
  if (Object.keys(communePovertyData).length === 0 &&
      Object.keys(epciPovertyData).length === 0 &&
      Object.keys(departmentPovertyData).length === 0 &&
      Object.keys(regionPovertyData).length === 0 &&
      Object.keys(francePovertyData).length === 0) {
    console.warn("Aucune donnée de taux de pauvreté disponible");
    return;
  }

  // Vérifier si un graphique existe déjà sur ce canvas
  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      existingChart.destroy();
    }
  } catch (e) {
    console.warn("Erreur en vérifiant si un graphique de pauvreté existant:", e);
  }

  // Collecter toutes les années disponibles dans tous les territoires
  const allYears = new Set();
  [communePovertyData, epciPovertyData, departmentPovertyData, regionPovertyData, francePovertyData].forEach(data => {
    Object.keys(data).forEach(year => allYears.add(year));
  });

  // Convertir en tableau et trier
  const years = Array.from(allYears).sort();

  // Définir des couleurs distinctes pour chaque territoire - on garde les mêmes que pour les revenus pour la cohérence
  const colors = {
    commune: { line: 'rgba(79, 209, 197, 1)', fill: 'rgba(79, 209, 197, 0.2)' },
    epci: { line: 'rgba(59, 130, 246, 1)', fill: 'rgba(59, 130, 246, 0.2)' },
    department: { line: 'rgba(139, 92, 246, 1)', fill: 'rgba(139, 92, 246, 0.2)' },
    region: { line: 'rgba(249, 115, 22, 1)', fill: 'rgba(249, 115, 22, 0.2)' },
    france: { line: 'rgba(220, 38, 38, 1)', fill: 'rgba(220, 38, 38, 0.2)' }
  };

  // Préparer les datasets pour le graphique
  const datasets = [];

  // Dataset pour la commune
  if (Object.keys(communePovertyData).length > 0) {
    datasets.push({
      label: communeName,
      data: years.map(year => communePovertyData[year] || null),
      backgroundColor: colors.commune.fill,
      borderColor: colors.commune.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.commune.line
    });
  }

  // Dataset pour l'EPCI
  if (Object.keys(epciPovertyData).length > 0) {
    datasets.push({
      label: epciName,
      data: years.map(year => epciPovertyData[year] || null),
      backgroundColor: colors.epci.fill,
      borderColor: colors.epci.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.epci.line
    });
  }

  // Dataset pour le département
  if (Object.keys(departmentPovertyData).length > 0) {
    datasets.push({
      label: departmentName,
      data: years.map(year => departmentPovertyData[year] || null),
      backgroundColor: colors.department.fill,
      borderColor: colors.department.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.department.line
    });
  }

  // Dataset pour la région
  if (Object.keys(regionPovertyData).length > 0) {
    datasets.push({
      label: regionName,
      data: years.map(year => regionPovertyData[year] || null),
      backgroundColor: colors.region.fill,
      borderColor: colors.region.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.region.line
    });
  }

  // Dataset pour la France
  if (Object.keys(francePovertyData).length > 0) {
    datasets.push({
      label: 'France',
      data: years.map(year => francePovertyData[year] || null),
      backgroundColor: colors.france.fill,
      borderColor: colors.france.line,
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: colors.france.line
    });
  }

  try {
    // Créer le graphique
    new Chart(chartElement, {
      type: 'line',
      data: {
        labels: years,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 40, // Plafond suggéré pour les taux de pauvreté
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.raw + '%';
              }
            }
          },
          datalabels: {
            display: false // Désactiver les étiquettes de données car il y a trop de séries
          }
        }
      }
    });

    console.log("✅ Graphique des taux de pauvreté créé avec succès");
  } catch (e) {
    console.error("❌ Erreur lors de la création du graphique des taux de pauvreté:", e);
  }
}
