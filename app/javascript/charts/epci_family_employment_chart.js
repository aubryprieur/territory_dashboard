// app/javascript/charts/epci_family_employment_chart.js
/**
 * Initialise les graphiques d'emploi des familles avec enfants pour l'EPCI
 * - Graphique pour les enfants de moins de 3 ans
 * - Graphique pour les enfants de 3 à 5 ans
 */

// Fonction principale d'initialisation
function initializeEpciFamilyEmploymentCharts() {
  // Initialiser le graphique pour les enfants de moins de 3 ans (EPCI)
  initEpciFamilyEmploymentChart('family-employment-under3-chart-epci', 'family-employment-under3-data-epci');

  // Initialiser le graphique pour les enfants de 3 à 5 ans (EPCI)
  initEpciFamilyEmploymentChart('family-employment-3to5-chart-epci', 'family-employment-3to5-data-epci');
}

function initEpciFamilyEmploymentChart(chartElementId, dataElementId) {
  const chartElement = document.getElementById(chartElementId);
  const dataElement = document.getElementById(dataElementId);

  if (!chartElement || !dataElement) {
    console.warn(`Éléments nécessaires non trouvés pour le graphique ${chartElementId}`);
    return;
  }

  // ✅ Vérifier si déjà initialisé et nettoyer si nécessaire
  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      console.log(`Graphique ${chartElementId} déjà initialisé, destruction de l'ancien`);
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  try {
    // Récupérer les données JSON
    const chartData = JSON.parse(dataElement.textContent);

    // Vérifier si des données sont disponibles
    if (!chartData.categories || !chartData.categories.length) {
      console.warn(`Pas de catégories disponibles pour le graphique ${chartElementId}`);
      return;
    }

    // Préparer les datasets
    const datasets = [];

    // Dataset pour l'EPCI (toujours présent)
    datasets.push({
      label: chartData.epci.name,
      data: chartData.epci.data,
      backgroundColor: 'rgba(79, 209, 197, 0.8)',
      borderColor: 'rgba(79, 209, 197, 1)',
      borderWidth: 1
    });

    // Dataset pour le département si des données sont disponibles
    if (chartData.department && chartData.department.data.some(val => val !== null)) {
      datasets.push({
        label: chartData.department.name,
        data: chartData.department.data,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1
      });
    }

    // Dataset pour la région si des données sont disponibles
    if (chartData.region && chartData.region.data.some(val => val !== null)) {
      datasets.push({
        label: chartData.region.name,
        data: chartData.region.data,
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1
      });
    }

    // Dataset pour la France si des données sont disponibles
    if (chartData.france && chartData.france.data.some(val => val !== null)) {
      datasets.push({
        label: chartData.france.name,
        data: chartData.france.data,
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 1
      });
    }

    // Créer le graphique avec des barres verticales et une configuration améliorée pour les labels
    const chart = new Chart(chartElement, {
      type: 'bar',
      data: {
        labels: chartData.categories,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            bottom: 20 // Plus d'espace en bas pour les labels
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 80,
            title: {
              display: true,
              text: 'Pourcentage (%)',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 0, // pour conserver les lignes horizontales
              minRotation: 0,
              font: {
                size: 10
              },
              padding: 5,
              callback: function(value) {
                const label = this.getLabelForValue(value);
                // Ajoute un retour à la ligne après chaque virgule ou tiret
                return label.split(/, | - /g);
              }
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              font: {
                size: 11 // Taille de police de la légende réduite
              },
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(79, 209, 197, 1)',
            borderWidth: 1,
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.raw}%`;
              }
            }
          },
          datalabels: {
            display: function(context) {
              // N'afficher les étiquettes que pour les valeurs significatives
              return context.dataset.data[context.dataIndex] > 1;
            },
            formatter: function(value) {
              return value.toFixed(1) + '%';
            },
            color: 'black',
            anchor: 'end',
            align: 'top',
            offset: 0,
            font: {
              size: 8, // Taille de police des datalabels réduite
              weight: 'bold'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      },
      plugins: [ChartDataLabels]
    });

    // ✅ Stocker l'instance de graphique
    if (!window.chartInstances) {
      window.chartInstances = new Map();
    }
    window.chartInstances.set(chartElement.id, chart);

    console.log(`✅ Graphique ${chartElementId} créé avec succès`);
  } catch (e) {
    console.error(`Erreur lors de la création du graphique ${chartElementId}:`, e);
  }
}

// ✅ Initialiser les graphiques au chargement de la page (une seule fois sur turbo:load)
document.addEventListener('turbo:load', function() {
  initializeEpciFamilyEmploymentCharts();
});

// Exporter les fonctions pour les rendre disponibles
export { initializeEpciFamilyEmploymentCharts, initEpciFamilyEmploymentChart };
