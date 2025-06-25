/**
 * Graphique d'évolution de la population historique de l'EPCI
 * Affiche un graphique linéaire avec area fill et points de données
 */
function initializeEpciPopulationHistoryChart() {
  const chartElement = document.getElementById("epci-population-history-chart");
  const dataElement = document.getElementById("epci-population-history-data");
  const epciNameElement = document.getElementById("epci-name-data");

  console.log("=== DEBUG EPCI NAME ===");
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

    // ✅ Debug - Récupérer le nom de l'EPCI depuis les données HTML
    let epciName = "Population EPCI"; // Valeur par défaut

    console.log("epciNameElement présent:", !!epciNameElement);

    if (epciNameElement) {
      console.log("Contenu brut de epciNameElement:", epciNameElement.textContent);
      try {
        epciName = JSON.parse(epciNameElement.textContent);
        console.log("✅ Nom EPCI récupéré avec succès:", epciName);
      } catch (e) {
        console.warn("❌ Erreur lors du parsing JSON du nom EPCI:", e);
        console.log("Contenu qui a causé l'erreur:", epciNameElement.textContent);
      }
    } else {
      console.warn("❌ Élément #epci-name-data non trouvé dans le DOM");
      // Essayons de voir tous les éléments script
      const allScripts = document.querySelectorAll('script[type="application/json"]');
      console.log("Tous les scripts JSON trouvés:", allScripts);
      allScripts.forEach((script, index) => {
        console.log(`Script ${index}: id="${script.id}", contenu="${script.textContent.substring(0, 100)}..."`);
      });
    }

    // Extraire les années et les valeurs
    const years = Object.keys(populationData).sort();
    const populations = years.map(year => populationData[year]);

    // Calculer les variations pour enrichir les tooltips
    const variations = populations.map((pop, index) => {
      if (index === 0) return null;
      const prevPop = populations[index - 1];
      return ((pop - prevPop) / prevPop * 100);
    });

    // Déterminer la tendance générale
    const firstPop = populations[0];
    const lastPop = populations[populations.length - 1];
    const overallGrowth = ((lastPop - firstPop) / firstPop * 100);
    const isGrowing = overallGrowth > 0;

    console.log("📊 Nom final utilisé pour la légende:", epciName);

    const chart = new Chart(chartElement, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: epciName, // ✅ Utilisation du vrai nom de l'EPCI
          data: populations,
          borderColor: isGrowing ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)',
          backgroundColor: isGrowing ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: isGrowing ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Population',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: '#374151'
            },
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('fr-FR').format(value);
              },
              color: '#6B7280'
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)',
              borderColor: '#D1D5DB'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Année',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: '#374151'
            },
            ticks: {
              color: '#6B7280'
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)',
              borderColor: '#D1D5DB'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 20,
              padding: 20,
              font: {
                size: 14,
                weight: '500'
              },
              color: '#374151'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#F9FAFB',
            bodyColor: '#F9FAFB',
            borderColor: isGrowing ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)',
            borderWidth: 2,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function(context) {
                return `📅 Année ${context[0].label}`;
              },
              label: function(context) {
                const population = context.raw;
                const yearIndex = context.dataIndex;

                let tooltip = [`👥 Population: ${new Intl.NumberFormat('fr-FR').format(population)}`];

                if (yearIndex > 0 && variations[yearIndex] !== null) {
                  const variation = variations[yearIndex];
                  const sign = variation >= 0 ? '+' : '';
                  const emoji = variation > 1 ? '📈' : variation < -1 ? '📉' : '📊';
                  tooltip.push(`${emoji} Variation: ${sign}${variation.toFixed(2)}%`);
                }

                return tooltip;
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
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          line: {
            tension: 0.3
          },
          point: {
            hoverRadius: 8
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

    console.log("✅ Graphique d'évolution de la population EPCI initialisé avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation du graphique d'évolution de la population EPCI:", e);
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

document.addEventListener("turbo:load", function() {
  initializeEpciPopulationHistoryChart();
});

export { initializeEpciPopulationHistoryChart };
