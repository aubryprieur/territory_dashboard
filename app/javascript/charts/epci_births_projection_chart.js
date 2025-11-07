/**
 * Initialise le graphique de projection des naissances (historique + projection 2035)
 * Affiche les naissances observées et la projection avec bande d'incertitude (ICF 1,5 à 1,7)
 */
function initializeBirthsProjectionChart() {
  const chartElement = document.getElementById("epci-births-projection-chart");
  const dataElement = document.getElementById("epci-births-projection-data");

  if (!chartElement || !dataElement || typeof Chart === "undefined") {
    console.warn("Éléments nécessaires pour le graphique de projection manquants");
    return;
  }

  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      console.log("Graphique de projection des naissances déjà initialisé, destruction de l'ancien");
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  try {
    const data = JSON.parse(dataElement.textContent);
    const historicalYears = data.historical_years || [];
    const historicalValues = data.historical_values || [];
    const projectionYears = data.projection_years || [];
    const projectionValuesLow = data.projection_values_low || [];      // ICF 1,5
    const projectionValuesCentral = data.projection_values_central || []; // ICF 1,6
    const projectionValuesHigh = data.projection_values_high || [];    // ICF 1,7

    console.log("📊 Données historiques:", { years: historicalYears, values: historicalValues });
    console.log("📈 Scénario bas (ICF 1,5):", projectionValuesLow);
    console.log("📈 Scénario central (ICF 1,6):", projectionValuesCentral);
    console.log("📈 Scénario haut (ICF 1,7):", projectionValuesHigh);

    if (!historicalYears.length || !projectionYears.length) {
      console.warn("⚠️ Données de projection vides ou invalides");
      return;
    }

    const chart = new Chart(chartElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          // 🆕 SCÉNARIO BAS (ICF 1,5) - Min de la bande
          {
            label: 'Scénario bas (ICF 1,5)',
            data: projectionYears.map((year, index) => ({
              x: year,
              y: projectionValuesLow[index]
            })),
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 0
          },
          // 🆕 SCÉNARIO HAUT (ICF 1,7) - Max de la bande AVEC FILL
          {
            label: 'Scénario haut (ICF 1,7)',
            data: projectionYears.map((year, index) => ({
              x: year,
              y: projectionValuesHigh[index]
            })),
            borderColor: 'rgba(107, 114, 128, 0.4)',
            backgroundColor: 'rgba(107, 114, 128, 0.12)',  // Gris très transparent
            fill: '-1',  // Remplit jusqu'au dataset bas (min)
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 1,
            borderDash: [2, 2]
          },
          // SCÉNARIO CENTRAL (ICF 1,6) - Courbe du milieu
          {
            label: 'Projection centrale (ICF 1,6)',
            data: projectionYears.map((year, index) => ({
              x: year,
              y: projectionValuesCentral[index]
            })),
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: 'rgba(168, 85, 247, 0)',
            fill: false,
            tension: 0.4,
            borderDash: [5, 5],  // Pointillé
            pointRadius: 3,
            pointBackgroundColor: 'rgba(168, 85, 247, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1
          },
          // COURBE HISTORIQUE
          {
            label: 'Naissances observées',
            data: historicalYears.map((year, index) => ({
              x: year,
              y: historicalValues[index]
            })),
            borderColor: 'rgba(246, 114, 128, 1)',
            backgroundColor: 'rgba(246, 114, 128, 0.2)',
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: 'rgba(246, 114, 128, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Année',
              font: {
                weight: 'bold'
              }
            },
            min: Math.min(...historicalYears, ...projectionYears) - 1,
            max: 2036,
            ticks: {
              stepSize: 2
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Nombre de naissances',
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              callback: function(value) {
                return value.toLocaleString('fr-FR');
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 12,
            titleFont: {
              size: 13,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            callbacks: {
              title: function(context) {
                return 'Année ' + context[0].raw.x;
              },
              label: function(context) {
                const value = context.raw.y || context.raw;
                const label = context.dataset.label || '';

                if (label.includes('Scénario bas') || label.includes('Scénario haut')) {
                  return null;
                }

                return label + ': ' + value.toLocaleString('fr-FR') + ' naissances';
              },
              filter: function(context) {
                return !context.dataset.label.includes('Scénario bas') && !context.dataset.label.includes('Scénario haut');
              }
            }
          }
        }
      }
    });

    if (!window.chartInstances) {
      window.chartInstances = new Map();
    }
    window.chartInstances.set(chartElement.id, chart);

    console.log("✅ Graphique de projection des naissances initialisé (ICF 1,5 à 1,7)");
  } catch (e) {
    console.error("Erreur lors de l'initialisation du graphique de projection:", e);
  }
}

window.EpciBirthsProjectionChart = {
  init() {
    console.log('📊 EpciBirthsProjectionChart.init() appelée');
    initializeBirthsProjectionChart();
  }
};

export { initializeBirthsProjectionChart };
