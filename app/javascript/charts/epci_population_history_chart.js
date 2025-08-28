/**
 * Graphique d'évolution de la population historique de l'EPCI
 * Affiche un graphique linéaire avec area fill et points de données
 */
function initializeEpciPopulationHistoryChart() {
  const chartElement = document.getElementById("epci-population-history-chart");
  const dataElement = document.getElementById("epci-population-history-data");
  const epciNameElement = document.getElementById("epci-name-data");

  console.log("=== DEBUG EPCI POPULATION HISTORY ===");
  console.log("chartElement:", chartElement);
  console.log("dataElement:", dataElement);
  console.log("epciNameElement:", epciNameElement);

  if (!chartElement || !dataElement || typeof Chart === "undefined") {
    console.warn("Éléments nécessaires pour le graphique d'évolution de la population EPCI manquants");
    return;
  }

  // ✅ Vérifier si déjà initialisé et nettoyer si nécessaire
  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      console.log("Graphique d'évolution de la population EPCI déjà initialisé, destruction de l'ancien");
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  try {
    const populationData = JSON.parse(dataElement.textContent);

    // ✅ Récupérer le nom de l'EPCI depuis les données globales ou l'élément HTML
    let epciName = "Population EPCI"; // Valeur par défaut

    if (epciNameElement) {
      try {
        epciName = JSON.parse(epciNameElement.textContent);
      } catch (e) {
        console.warn("Erreur lors du parsing du nom EPCI:", e);
      }
    } else if (window.epciDashboardData && window.epciDashboardData.epci_name) {
      epciName = window.epciDashboardData.epci_name;
    } else if (window.territoryNames && window.territoryNames.epci) {
      epciName = window.territoryNames.epci;
    }

    console.log("Nom EPCI utilisé:", epciName);
    console.log("Données population:", populationData);

    // 🚀 CORRECTION CRITIQUE : Adapter le format des données
    let years = [];
    let populations = [];

    // Vérifier si les données sont dans le format attendu {years: [...], populations: [...]}
    if (populationData.years && populationData.populations) {
      years = populationData.years;
      populations = populationData.populations;
    }
    // Sinon, les données sont dans le format objet {"1968": 195613, "1975": 199420, ...}
    else if (typeof populationData === 'object' && populationData !== null) {
      // Convertir l'objet en tableaux triés par année
      const sortedEntries = Object.entries(populationData)
        .filter(([year, pop]) => !isNaN(year) && !isNaN(pop)) // Filtrer les entrées valides
        .sort(([a], [b]) => parseInt(a) - parseInt(b)); // Trier par année

      years = sortedEntries.map(([year]) => parseInt(year));
      populations = sortedEntries.map(([, pop]) => parseInt(pop));
    }

    console.log("Années traitées:", years);
    console.log("Populations traitées:", populations);

    if (years.length === 0 || populations.length === 0) {
      console.warn("Pas de données historiques valides disponibles");
      return;
    }

    // Calculer les variations pour enrichir les tooltips
    const variations = populations.map((pop, index) => {
      if (index === 0) return null;
      const previousPop = populations[index - 1];
      return ((pop - previousPop) / previousPop * 100);
    });

    const firstPop = populations[0];
    const lastPop = populations[populations.length - 1];

    const chart = new Chart(chartElement, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: `Population de ${epciName}`,
          data: populations,
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Population'
            },
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('fr-FR').format(value);
              }
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
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `Population: ${new Intl.NumberFormat('fr-FR').format(value)}`;
              },
              afterLabel: function(context) {
                const yearIndex = context.dataIndex;
                if (yearIndex > 0 && variations[yearIndex] !== null) {
                  const variation = variations[yearIndex];
                  const sign = variation >= 0 ? '+' : '';
                  const emoji = variation > 1 ? '📈' : variation < -1 ? '📉' : '📊';
                  return `${emoji} Variation: ${sign}${variation.toFixed(2)}%`;
                }
                return '';
              },
              footer: function(context) {
                const yearIndex = context[0].dataIndex;
                if (yearIndex === 0) {
                  return '🏁 Année de référence';
                } else if (yearIndex === populations.length - 1) {
                  const totalGrowth = ((populations[yearIndex] - firstPop) / firstPop * 100);
                  const emoji = totalGrowth > 0 ? '📈' : '📉';
                  return `${emoji} Évolution totale: ${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)}%`;
                }
                return '';
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
    window.chartInstances.set(chartElement.id, chart);

    // Ajouter des statistiques enrichies dans la console
    addEnhancedPopulationStats(populations, years, variations);

    console.log("✅ Graphique d'évolution de la population EPCI créé avec succès");
  } catch (e) {
    console.error("Erreur lors de la création du graphique d'évolution de la population EPCI:", e);
  }
}

// Fonction pour ajouter des statistiques enrichies
function addEnhancedPopulationStats(populations, years, variations) {
  const firstPop = populations[0];
  const lastPop = populations[populations.length - 1];
  const totalVariation = ((lastPop - firstPop) / firstPop * 100);

  let maxGrowth = -Infinity;
  let maxGrowthPeriod = '';
  let maxDecline = Infinity;
  let maxDeclinePeriod = '';

  variations.forEach((variation, index) => {
    if (variation !== null) {
      if (variation > maxGrowth) {
        maxGrowth = variation;
        maxGrowthPeriod = `${years[index-1]}-${years[index]}`;
      }
      if (variation < maxDecline) {
        maxDecline = variation;
        maxDeclinePeriod = `${years[index-1]}-${years[index]}`;
      }
    }
  });

  const avgAnnualGrowth = totalVariation / (years.length - 1);
  const recentYears = Math.min(5, years.length);
  const recentStart = populations[populations.length - recentYears];
  const recentVariation = ((lastPop - recentStart) / recentStart * 100);

  console.log(`📊 Statistiques détaillées population EPCI:
    - 📈 Variation totale (${years[0]}-${years[years.length-1]}): ${totalVariation.toFixed(2)}%
    - 📊 Variation moyenne annuelle: ${avgAnnualGrowth.toFixed(2)}%
    - 🚀 Plus forte croissance: ${maxGrowth.toFixed(2)}% (${maxGrowthPeriod})
    - 📉 Plus forte baisse: ${maxDecline.toFixed(2)}% (${maxDeclinePeriod})
    - 🕐 Tendance récente (${recentYears} ans): ${recentVariation.toFixed(2)}%
    - 👥 Population actuelle: ${new Intl.NumberFormat('fr-FR').format(lastPop)}
    - 🏘️ Population initiale: ${new Intl.NumberFormat('fr-FR').format(firstPop)}`);
}

// 🚀 AJOUT CRITIQUE : Exposer l'objet pour le système asynchrone
window.EpciPopulationHistoryChart = {
  init() {
    console.log('📊 EpciPopulationHistoryChart.init() appelée');
    initializeEpciPopulationHistoryChart();
  }
};

// ✅ SUPPRIMÉ : L'écouteur turbo:load car maintenant géré par le système asynchrone
// document.addEventListener("turbo:load", function() {
//   initializeEpciPopulationHistoryChart();
// });

// Exporter la fonction pour la rendre disponible
export { initializeEpciPopulationHistoryChart };
