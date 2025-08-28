// app/javascript/charts/epci_domestic_violence_chart.js
/**
 * Graphique des violences intrafamiliales pour l'EPCI
 * Affiche l'évolution des taux par commune, département et région
 */

// Fonction principale d'initialisation
function initializeEpciDomesticViolenceChart() {
  console.log('📊 Initialisation du graphique violences domestiques EPCI');

  // Trouver le conteneur avec le code EPCI
  const container = document.querySelector('[data-epci-code]');
  if (!container) {
    console.warn('❌ Conteneur EPCI non trouvé');
    return;
  }

  const epciCode = container.getAttribute('data-epci-code');
  if (!epciCode) {
    console.warn('❌ Code EPCI manquant');
    return;
  }

  initDomesticViolenceChart(epciCode);
}

// Fonction d'initialisation du graphique
function initDomesticViolenceChart(epciCode) {
  console.log("Initializing domestic violence chart for EPCI", epciCode);

  // Utiliser l'ID spécifique à l'EPCI pour garantir que nous travaillons avec le bon canvas
  const chartId = `domestic-violence-chart-${epciCode}`;
  const ctx = document.getElementById(chartId);
  if (!ctx) {
    console.warn(`Canvas with ID ${chartId} not found`);
    return;
  }

  // Vérifier si déjà initialisé et nettoyer si nécessaire
  try {
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      console.log("Graphique des violences intrafamiliales déjà initialisé, destruction de l'ancien");
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  // NOUVEAU : Lire les données depuis l'élément data-*
  const dataElement = document.getElementById('domestic-violence-data');
  if (!dataElement) {
    console.error("❌ Élément domestic-violence-data non trouvé");
    return;
  }

  console.log("🔍 Données trouvées dans l'élément:", dataElement);

  // Extraire et parser les données
  let data;
  try {
    data = {
      epci_name: dataElement.getAttribute('data-epci-name'),
      epci_code: dataElement.getAttribute('data-epci-code'),
      communes: JSON.parse(dataElement.getAttribute('data-communes') || '[]'),
      yearly_rates: JSON.parse(dataElement.getAttribute('data-yearly-rates') || '{}'),
      department_data: {
        yearly_rates: JSON.parse(dataElement.getAttribute('data-department-rates') || '{}')
      },
      region_data: {
        yearly_rates: JSON.parse(dataElement.getAttribute('data-region-rates') || '{}')
      },
      territoryNames: {
        department: dataElement.getAttribute('data-department-name'),
        region: dataElement.getAttribute('data-region-name')
      }
    };

    console.log("✅ Données parsées avec succès:", data);

    // Vérifier la structure des données
    console.log(`📊 ${data.communes.length} communes trouvées`);
    console.log('📊 Yearly rates EPCI:', Object.keys(data.yearly_rates).length, 'années');
    console.log('📊 Département rates:', Object.keys(data.department_data.yearly_rates).length, 'années');
    console.log('📊 Région rates:', Object.keys(data.region_data.yearly_rates).length, 'années');

  } catch (error) {
    console.error("❌ Erreur lors du parsing des données:", error);
    return;
  }

  // Fonction pour décoder les entités HTML
  function decodeHTMLEntities(text) {
    if (!text) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Fonction pour générer une couleur aléatoire mais consistante basée sur un nom de commune
  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 60%)`;
  }

  // Années à afficher
  const years = ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];
  const allDatasets = [];

  // Décoder les noms de territoires
  const deptName = decodeHTMLEntities(data.territoryNames.department);
  const regionName = decodeHTMLEntities(data.territoryNames.region);

  // Traiter les communes
  if (data.communes && Array.isArray(data.communes) && data.communes.length > 0) {
    console.log(`📊 Traitement de ${data.communes.length} communes`);

    const communesWithData = [];

    data.communes.forEach(commune => {
      if (!commune.yearly_data || !Array.isArray(commune.yearly_data)) {
        console.warn(`Commune ${commune.name} sans données yearly_data`);
        return;
      }

      const communeData = years.map(year => {
        // Chercher les données pour cette année (format "16", "17", etc.)
        const shortYear = year.substring(2); // "2016" -> "16"
        const yearData = commune.yearly_data.find(yd => yd.year.toString() === shortYear);
        return yearData ? yearData.rate : null;
      });

      // Vérifier si les données ne sont pas toutes nulles avant d'ajouter
      if (communeData.some(val => val !== null && val !== undefined)) {
        // Calculer la moyenne (en ignorant les valeurs nulles)
        const validValues = communeData.filter(val => val !== null && val !== undefined);
        const avgRate = validValues.length > 0
          ? validValues.reduce((a, b) => a + b, 0) / validValues.length
          : 0;

        communesWithData.push({
          name: decodeHTMLEntities(commune.name),
          data: communeData,
          avgRate: avgRate,
          color: stringToColor(commune.name)
        });
      }
    });

    console.log(`📊 ${communesWithData.length} communes avec des données valides`);

    // Trier les communes par taux moyen
    communesWithData.sort((a, b) => b.avgRate - a.avgRate);

    // Créer les datasets pour toutes les communes
    communesWithData.forEach(commune => {
      allDatasets.push({
        label: commune.name,
        data: commune.data,
        borderColor: commune.color,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 1.5,
        pointRadius: 2,
        pointHoverRadius: 5,
        hidden: true, // Toutes cachées par défaut
        fill: false
      });
    });
  }

  // Département
  if (data.department_data && data.department_data.yearly_rates) {
    const deptData = years.map(year => data.department_data.yearly_rates[year] || null);

    console.log("📊 Données département:", deptData);

    allDatasets.push({
      label: deptName || 'Département',
      data: deptData,
      borderColor: '#4F46E5',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 3,
      borderDash: [5, 5],
      pointRadius: 4,
      hidden: false,
      fill: false
    });
  }

  // Région
  if (data.region_data && data.region_data.yearly_rates) {
    const regionData = years.map(year => data.region_data.yearly_rates[year] || null);

    console.log("📊 Données région:", regionData);

    allDatasets.push({
      label: regionName || 'Région',
      data: regionData,
      borderColor: '#10B981',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 3,
      borderDash: [5, 5],
      pointRadius: 4,
      hidden: false,
      fill: false
    });
  }

  console.log(`📊 Création du graphique avec ${allDatasets.length} datasets`);

  if (allDatasets.length === 0) {
    console.error("❌ Aucun dataset à afficher");
    return;
  }

  // Créer le graphique
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: allDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
      },
      plugins: {
        legend: {
          position: 'bottom',
          display: true,
          labels: {
            boxWidth: 10,
            padding: 10,
            font: {
              size: 9
            }
          },
          onClick: function(e, legendItem, legend) {
            // Comportement par défaut de Chart.js (toggle visibility)
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            const meta = ci.getDatasetMeta(index);

            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
            ci.update();
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.raw === null || context.raw === undefined) return 'Donnée non disponible';
              return context.dataset.label + ': ' + parseFloat(context.raw).toFixed(2) + '‰';
            }
          }
        }
      }
    }
  });

  // Stocker l'instance de graphique
  if (!window.chartInstances) {
    window.chartInstances = new Map();
  }
  window.chartInstances.set(ctx.id, chart);

  // Configurer les contrôles pour le graphique
  setupChartControls(epciCode, chart, allDatasets, years, deptName, regionName);

  console.log('✅ Graphique violences domestiques créé avec succès');
}

// Fonction pour paramétrer les contrôles du graphique
function setupChartControls(epciCode, chart, allDatasets, years, deptName, regionName) {
  const controlsId = `chart-controls-${epciCode}`;
  const controlsContainer = document.getElementById(controlsId);

  if (!controlsContainer) {
    console.warn(`Controls container with ID ${controlsId} not found`);
    return;
  }

  // Vider le conteneur des contrôles
  controlsContainer.innerHTML = '';

  // Créer les boutons de contrôle
  const showAllButton = document.createElement('button');
  showAllButton.className = 'px-3 py-2 bg-gray-200 text-gray-800 text-xs font-medium rounded hover:bg-gray-300';
  showAllButton.textContent = 'Afficher toutes les communes';

  const showHighRateButton = document.createElement('button');
  showHighRateButton.className = 'px-3 py-2 bg-red-100 text-red-800 text-xs font-medium rounded hover:bg-red-200';
  showHighRateButton.textContent = 'Communes > moyenne départementale/régionale';

  const hideAllButton = document.createElement('button');
  hideAllButton.className = 'px-3 py-2 bg-gray-200 text-gray-800 text-xs font-medium rounded hover:bg-gray-300';
  hideAllButton.textContent = 'Masquer toutes les communes';

  // Ajouter les boutons au conteneur
  controlsContainer.appendChild(showAllButton);
  controlsContainer.appendChild(showHighRateButton);
  controlsContainer.appendChild(hideAllButton);

  // Événements des boutons
  showAllButton.addEventListener('click', function() {
    allDatasets.forEach((dataset, index) => {
      const isAverage = dataset.label.includes('Moyenne') ||
        dataset.label.includes('Département') ||
        dataset.label.includes('Région') ||
        (deptName && dataset.label.includes(deptName)) ||
        (regionName && dataset.label.includes(regionName));

      if (!isAverage) {
        chart.setDatasetVisibility(index, true);
      }
    });
    chart.update();
  });

  hideAllButton.addEventListener('click', function() {
    allDatasets.forEach((dataset, index) => {
      const isAverage = dataset.label.includes('Moyenne') ||
        dataset.label.includes('Département') ||
        dataset.label.includes('Région') ||
        (deptName && dataset.label.includes(deptName)) ||
        (regionName && dataset.label.includes(regionName));

      if (!isAverage) {
        chart.setDatasetVisibility(index, false);
      }
    });
    chart.update();
  });

  showHighRateButton.addEventListener('click', function() {
    // Masquer toutes les communes d'abord
    allDatasets.forEach((dataset, index) => {
      const isAverage = dataset.label.includes('Moyenne') ||
        dataset.label.includes('Département') ||
        dataset.label.includes('Région') ||
        (deptName && dataset.label.includes(deptName)) ||
        (regionName && dataset.label.includes(regionName));

      if (!isAverage) {
        chart.setDatasetVisibility(index, false);
      }
    });

    // Logique pour afficher les communes au-dessus de la moyenne
    let lastYearIndex = years.length - 1;
    while (lastYearIndex >= 0) {
      const deptDataset = allDatasets.find(d =>
        (deptName && d.label.includes(deptName)) || d.label.includes('Département')
      );
      const regionDataset = allDatasets.find(d =>
        (regionName && d.label.includes(regionName)) || d.label.includes('Région')
      );

      const deptValue = deptDataset ? deptDataset.data[lastYearIndex] : null;
      const regionValue = regionDataset ? regionDataset.data[lastYearIndex] : null;

      if (deptValue !== null || regionValue !== null) {
        break;
      }
      lastYearIndex--;
    }

    if (lastYearIndex >= 0) {
      const deptDataset = allDatasets.find(d =>
        (deptName && d.label.includes(deptName)) || d.label.includes('Département')
      );
      const regionDataset = allDatasets.find(d =>
        (regionName && d.label.includes(regionName)) || d.label.includes('Région')
      );

      const deptValue = deptDataset ? deptDataset.data[lastYearIndex] : -Infinity;
      const regionValue = regionDataset ? regionDataset.data[lastYearIndex] : -Infinity;

      const threshold = Math.max(
        deptValue !== null ? deptValue : -Infinity,
        regionValue !== null ? regionValue : -Infinity
      );

      allDatasets.forEach((dataset, index) => {
        const isAverage = dataset.label.includes('Moyenne') ||
          dataset.label.includes('Département') ||
          dataset.label.includes('Région') ||
          (deptName && dataset.label.includes(deptName)) ||
          (regionName && dataset.label.includes(regionName));

        if (!isAverage) {
          const communeValue = dataset.data[lastYearIndex];
          if (communeValue !== null && communeValue > threshold) {
            chart.setDatasetVisibility(index, true);
          }
        }
      });
    }

    chart.update();
  });
}

// Exposer les fonctions pour le système asynchrone
window.EpciDomesticViolenceChart = {
  init() {
    console.log('📊 EpciDomesticViolenceChart.init() appelée');
    initializeEpciDomesticViolenceChart();
  }
};

// Exposer aussi les fonctions directement pour le fallback
window.initializeDomesticViolenceChart = initializeEpciDomesticViolenceChart;
window.initDomesticViolenceChart = initDomesticViolenceChart;

// Exporter les fonctions pour les rendre disponibles
export { initializeEpciDomesticViolenceChart, initDomesticViolenceChart, setupChartControls };
