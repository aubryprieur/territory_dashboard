/**
 * Initialise la pyramide des âges pour l'EPCI
 */
function initializeEpciAgePyramidChart() {
  const chartElement = document.getElementById("epci-age-pyramid-chart");
  const dataElement = document.getElementById("epci-age-pyramid-data");

  if (!chartElement || !dataElement || typeof Chart === "undefined") {
    console.warn("Chart.js ou données pour la pyramide des âges EPCI manquantes");
    return;
  }

  // ✅ Vérifier si déjà initialisé et nettoyer si nécessaire
  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      console.log("Pyramide des âges EPCI déjà initialisée, destruction de l'ancienne");
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  try {
    const pyramidData = JSON.parse(dataElement.textContent);

    // Créer des tableaux par groupe d'âge et par sexe
    const ageGroups = pyramidData.ageGroups;
    const maleData = pyramidData.maleData.map(value => -value); // Valeurs négatives pour les hommes
    const femaleData = pyramidData.femaleData;

    const chart = new Chart(chartElement, {
      type: 'bar',
      data: {
        labels: ageGroups,
        datasets: [
          {
            label: 'Hommes',
            data: maleData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Femmes',
            data: femaleData,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: false,
            ticks: {
              callback: function(value) {
                return Math.abs(value);
              }
            },
            title: {
              display: true,
              text: 'Population'
            }
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Groupes d\'âge'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = Math.abs(context.raw);
                return `${context.dataset.label}: ${new Intl.NumberFormat('fr-FR').format(value)}`;
              }
            }
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    // ✅ Stocker l'instance de graphique
    if (!window.chartInstances) {
      window.chartInstances = new Map();
    }
    window.chartInstances.set(chartElement.id, chart);

    console.log("✅ Pyramide des âges EPCI créée avec succès");
  } catch (e) {
    console.error("Erreur lors de la création de la pyramide des âges EPCI:", e);
  }
}

// 🚀 AJOUT CRITIQUE : Exposer l'objet pour le système asynchrone
window.EpciAgePyramidChart = {
  init() {
    console.log('📊 EpciAgePyramidChart.init() appelée');
    initializeEpciAgePyramidChart();
  }
};

// ✅ SUPPRIMÉ : L'écouteur turbo:load car maintenant géré par le système asynchrone
// document.addEventListener("turbo:load", function() {
//   initializeEpciAgePyramidChart();
// });

// Exporter la fonction pour la rendre disponible
export { initializeEpciAgePyramidChart };
