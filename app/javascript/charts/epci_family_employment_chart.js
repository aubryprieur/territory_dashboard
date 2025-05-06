// app/javascript/charts/epci_family_employment_chart.js
document.addEventListener('turbo:load', function() {
  // Initialiser le graphique pour les enfants de moins de 3 ans (EPCI)
  initEpciFamilyEmploymentChart('family-employment-under3-chart-epci', 'family-employment-under3-data-epci');

  // Initialiser le graphique pour les enfants de 3 à 5 ans (EPCI)
  initEpciFamilyEmploymentChart('family-employment-3to5-chart-epci', 'family-employment-3to5-data-epci');
});

function initEpciFamilyEmploymentChart(chartElementId, dataElementId) {
  const chartElement = document.getElementById(chartElementId);
  const dataElement = document.getElementById(dataElementId);

  if (!chartElement || !dataElement) {
    console.warn(`Éléments nécessaires non trouvés pour le graphique ${chartElementId}`);
    return;
  }

  try {
    // Récupérer les données JSON
    const chartData = JSON.parse(dataElement.textContent);

    // Vérifier si des données sont disponibles
    if (!chartData.categories || !chartData.categories.length) {
      console.warn(`Pas de catégories disponibles pour le graphique ${chartElementId}`);
      return;
    }

    // Nettoyer d'éventuels graphiques existants
    try {
      const existingChart = Chart.getChart(chartElement);
      if (existingChart) {
        existingChart.destroy();
      }
    } catch (e) {
      console.warn("Erreur lors du nettoyage du graphique existant:", e);
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
    if (chartData.department.data.some(val => val !== null)) {
      datasets.push({
        label: chartData.department.name,
        data: chartData.department.data,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1
      });
    }

    // Dataset pour la région si des données sont disponibles
    if (chartData.region.data.some(val => val !== null)) {
      datasets.push({
        label: chartData.region.name,
        data: chartData.region.data,
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1
      });
    }

    // Dataset pour la France si des données sont disponibles
    if (chartData.france.data.some(val => val !== null)) {
      datasets.push({
        label: chartData.france.name,
        data: chartData.france.data,
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 1
      });
    }

    // Créer le graphique avec des barres verticales et une configuration améliorée pour les labels
    new Chart(chartElement, {
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
              text: 'Pourcentage (%)'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
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
              }
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
        }
      },
      plugins: [ChartDataLabels]
    });

    console.log(`✅ Graphique ${chartElementId} créé avec succès`);
  } catch (e) {
    console.error(`Erreur lors de la création du graphique ${chartElementId}:`, e);
  }
}
