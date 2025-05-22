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

  // ✅ Vérifier si déjà initialisé et nettoyer si nécessaire
  try {
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      console.log("Graphique des violences intrafamiliales déjà initialisé, destruction de l'ancien");
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  // Fonction pour décoder les entités HTML
  function decodeHTMLEntities(text) {
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

  // Récupérer les données depuis la variable globale
  const data = window.domesticViolenceData || {};

  if (data.communes && data.communes.length > 0) {
    const communesWithData = [];

    data.communes.forEach(commune => {
      const communeData = commune.yearly_data.map(yd => {
        const yearIndex = years.indexOf("20" + yd.year);
        return yearIndex >= 0 ? yd.rate : null;
      });

      // Vérifier si les données ne sont pas toutes nulles avant d'ajouter
      if (communeData.some(val => val !== null)) {
        // Calculer la moyenne (en ignorant les valeurs nulles)
        const validValues = communeData.filter(val => val !== null);
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
        hidden: true // Toutes cachées par défaut
      });
    });
  }

  // Ajouter moyenne EPCI
  if (data.yearly_rates) {
    const epciData = years.map(year => data.yearly_rates[year] || null);

    allDatasets.push({
      label: "Moyenne EPCI " + data.epci_name,
      data: epciData,
      borderColor: '#000000',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      hidden: false
    });
  }

  // Département
  if (data.department_data && data.department_data.yearly_rates) {
    const deptData = years.map(year => data.department_data.yearly_rates[year] || null);

    allDatasets.push({
      label: decodeHTMLEntities(data.territoryNames.department),
      data: deptData,
      borderColor: '#4F46E5',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 3,
      borderDash: [5, 5],
      pointRadius: 4,
      hidden: false
    });
  }

  // Région
  if (data.region_data && data.region_data.yearly_rates) {
    const regionData = years.map(year => data.region_data.yearly_rates[year] || null);

    allDatasets.push({
      label: decodeHTMLEntities(data.territoryNames.region),
      data: regionData,
      borderColor: '#10B981',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 3,
      borderDash: [5, 5],
      pointRadius: 4,
      hidden: false
    });
  }

  console.log("Creating chart with " + allDatasets.length + " datasets");

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
              if (context.raw === null) return 'Donnée non disponible';
              return context.dataset.label + ': ' + context.raw.toFixed(2) + '‰';
            }
          }
        }
      }
    }
  });

  // ✅ Stocker l'instance de graphique
  if (!window.chartInstances) {
    window.chartInstances = new Map();
  }
  window.chartInstances.set(ctx.id, chart);

  // Configurer les contrôles pour le graphique
  setupChartControls(epciCode, chart, allDatasets, years);
}

// Fonction pour paramétrer les contrôles du graphique
function setupChartControls(epciCode, chart, allDatasets, years) {
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

  // Ajouter les événements sur les boutons
  showAllButton.addEventListener('click', function() {
    // Afficher toutes les communes
    allDatasets.forEach((dataset, index) => {
      if (!dataset.label.includes('Moyenne') &&
          !dataset.label.includes('Département') &&
          !dataset.label.includes('Région')) {
        chart.setDatasetVisibility(index, true);
      }
    });
    chart.update();
  });

  showHighRateButton.addEventListener('click', function() {
    // D'abord masquer toutes les communes
    allDatasets.forEach((dataset, index) => {
      if (!dataset.label.includes('Moyenne') &&
          !dataset.label.includes('Département') &&
          !dataset.label.includes('Région')) {
        chart.setDatasetVisibility(index, false);
      }
    });

    // Trouver l'index de la dernière année avec des données
    let lastYearIndex = years.length - 1;
    while (lastYearIndex >= 0) {
      // Vérifier si les données départementales ou régionales existent pour cette année
      const deptDataset = allDatasets.find(d => d.label.includes('Département'));
      const regionDataset = allDatasets.find(d => d.label.includes('Région'));

      const deptValue = deptDataset ? deptDataset.data[lastYearIndex] : null;
      const regionValue = regionDataset ? regionDataset.data[lastYearIndex] : null;

      if (deptValue !== null || regionValue !== null) {
        break;
      }

      lastYearIndex--;
    }

    if (lastYearIndex >= 0) {
      // Déterminer le seuil (max entre département et région)
      const deptDataset = allDatasets.find(d => d.label.includes('Département'));
      const regionDataset = allDatasets.find(d => d.label.includes('Région'));

      const deptValue = deptDataset ? deptDataset.data[lastYearIndex] : -Infinity;
      const regionValue = regionDataset ? regionDataset.data[lastYearIndex] : -Infinity;

      const threshold = Math.max(
        deptValue !== null ? deptValue : -Infinity,
        regionValue !== null ? regionValue : -Infinity
      );

      // Afficher les communes dont la valeur pour la dernière année dépasse le seuil
      allDatasets.forEach((dataset, index) => {
        if (!dataset.label.includes('Moyenne') &&
            !dataset.label.includes('Département') &&
            !dataset.label.includes('Région')) {

          const communeValue = dataset.data[lastYearIndex];
          if (communeValue !== null && communeValue > threshold) {
            chart.setDatasetVisibility(index, true);
          }
        }
      });

      // Indiquer le seuil utilisé
      const yearLabel = years[lastYearIndex];
      const thresholdText = threshold.toFixed(2);
      const referenceText = deptValue >= regionValue ? "départementale" : "régionale";

      // Supprimer toute alerte précédente
      const existingAlert = document.querySelector(`.threshold-alert-${epciCode}`);
      if (existingAlert) {
        existingAlert.remove();
      }

      // Afficher une alerte temporaire pour indiquer le seuil utilisé
      const alertDiv = document.createElement('div');
      alertDiv.className = `mt-2 p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded threshold-alert-${epciCode}`;
      alertDiv.textContent = `Affichage des communes avec un taux supérieur à la moyenne ${referenceText} (${thresholdText}‰) pour l'année ${yearLabel}`;
      controlsContainer.parentNode.insertBefore(alertDiv, controlsContainer.nextSibling);

      // Supprimer l'alerte après 5 secondes
      setTimeout(() => {
        alertDiv.remove();
      }, 5000);
    }

    chart.update();
  });

  hideAllButton.addEventListener('click', function() {
    // Masquer toutes les communes mais garder les moyennes
    allDatasets.forEach((dataset, index) => {
      if (!dataset.label.includes('Moyenne') &&
          !dataset.label.includes('Département') &&
          !dataset.label.includes('Région')) {
        chart.setDatasetVisibility(index, false);
      }
    });
    chart.update();
  });
}

// Fonction pour initialiser les graphiques pour tous les EPCI dans la page
function initAllDomesticViolenceCharts() {
  // Trouver tous les conteneurs de violences domestiques dans la page
  const containers = document.querySelectorAll('[data-epci-code]');

  containers.forEach(container => {
    const epciCode = container.getAttribute('data-epci-code');
    if (epciCode) {
      initDomesticViolenceChart(epciCode);
    }
  });
}

// ✅ Initialiser au chargement via Turbo (une seule fois)
document.addEventListener('turbo:load', initAllDomesticViolenceCharts);

// Exporter les fonctions pour les rendre disponibles
export { initDomesticViolenceChart, setupChartControls, initAllDomesticViolenceCharts };
