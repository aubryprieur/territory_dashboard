/**
 * Initialise le graphique d'évolution des naissances dans l'EPCI
 * Affiche un graphique linéaire de l'évolution des naissances sur plusieurs années
 */
function initializeBirthsHistoryChart() {
  const chartElement = document.getElementById("epci-births-history-chart");
  const dataElement = document.getElementById("epci-births-history-data");

  if (!chartElement || !dataElement || typeof Chart === "undefined") {
    console.warn("Éléments nécessaires pour le graphique d'évolution des naissances manquants");
    return;
  }

  // ✅ Vérifier si déjà initialisé et nettoyer si nécessaire
  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      console.log("Graphique des naissances déjà initialisé, destruction de l'ancien");
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  try {
    const data = JSON.parse(dataElement.textContent);
    const years = data.years;
    const birthCounts = data.values;

    const chart = new Chart(chartElement, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Naissances',
          data: birthCounts,
          borderColor: 'rgba(246, 114, 128, 1)',
          backgroundColor: 'rgba(246, 114, 128, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Nombre de naissances'
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
                return `Naissances: ${context.raw.toLocaleString('fr-FR')}`;
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

    console.log("✅ Graphique d'évolution des naissances initialisé avec succès");
  } catch (e) {
    console.error("Erreur lors de l'initialisation du graphique d'évolution des naissances:", e);
  }
}

// Initialiser le graphique au chargement de la page
document.addEventListener("turbo:load", function() {
  initializeBirthsHistoryChart();
});

// Exporter la fonction pour la rendre disponible
export { initializeBirthsHistoryChart };
