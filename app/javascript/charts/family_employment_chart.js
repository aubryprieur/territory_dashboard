// Graphiques pour l'emploi des familles

// ✅ CHARGEMENT INITIAL (pour les pages complètes)
document.addEventListener('turbo:load', function() {
  initFamilyEmploymentCharts();
});

// ✅ CHARGEMENT ASYNCHRONE (pour les sections dashboard)
document.addEventListener('dashboard:sectionLoaded', function(event) {
  if (event.detail.section === 'family_employment') {
    console.log("🎯 Section family_employment chargée, initialisation des graphiques");

    // Attendre un peu que le DOM soit prêt
    setTimeout(() => {
      initFamilyEmploymentCharts();
    }, 200);
  }
});

// Fonction centralisée pour initialiser tous les graphiques d'emploi familial
function initFamilyEmploymentCharts() {
  console.log("🎯 Initialisation des graphiques d'emploi familial");

  // Initialiser le graphique pour les enfants de moins de 3 ans
  initFamilyEmploymentChart('family-employment-under3-chart', 'family-employment-under3-data');

  // Initialiser le graphique pour les enfants de 3 à 5 ans
  initFamilyEmploymentChart('family-employment-3to5-chart', 'family-employment-3to5-data');
}

function initFamilyEmploymentChart(chartElementId, dataElementId) {
  console.log(`🔍 Tentative d'initialisation du graphique ${chartElementId}`);

  const chartElement = document.getElementById(chartElementId);
  const dataElement = document.getElementById(dataElementId);

  if (!chartElement) {
    console.warn(`❌ Élément canvas '${chartElementId}' non trouvé`);
    return;
  }

  if (!dataElement) {
    console.warn(`❌ Élément données '${dataElementId}' non trouvé`);
    return;
  }

  try {
    // Récupérer les données JSON
    const chartData = JSON.parse(dataElement.textContent);
    console.log(`📊 Données récupérées pour ${chartElementId}:`, chartData);

    // Vérifier si des données sont disponibles
    if (!chartData.categories || !chartData.categories.length) {
      console.warn(`⚠️ Pas de catégories disponibles pour le graphique ${chartElementId}`);
      return;
    }

    // Nettoyer d'éventuels graphiques existants
    try {
      const existingChart = Chart.getChart(chartElement);
      if (existingChart) {
        console.log(`🧹 Destruction du graphique existant pour ${chartElementId}`);
        existingChart.destroy();
      }
    } catch (e) {
      console.warn("Erreur lors du nettoyage du graphique existant:", e);
    }

    // Préparer les datasets
    const datasets = [];

    // Dataset pour la commune (toujours présent)
    if (chartData.commune && chartData.commune.data) {
      datasets.push({
        label: chartData.commune.name,
        data: chartData.commune.data,
        backgroundColor: 'rgba(79, 209, 197, 0.8)',
        borderColor: 'rgba(79, 209, 197, 1)',
        borderWidth: 1
      });
    }

    // Dataset pour l'EPCI si des données sont disponibles
    if (chartData.epci && chartData.epci.data && chartData.epci.data.some(val => val !== null && val !== undefined)) {
      datasets.push({
        label: chartData.epci.name,
        data: chartData.epci.data,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      });
    }

    // Dataset pour le département si des données sont disponibles
    if (chartData.department && chartData.department.data && chartData.department.data.some(val => val !== null && val !== undefined)) {
      datasets.push({
        label: chartData.department.name,
        data: chartData.department.data,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1
      });
    }

    // Dataset pour la région si des données sont disponibles
    if (chartData.region && chartData.region.data && chartData.region.data.some(val => val !== null && val !== undefined)) {
      datasets.push({
        label: chartData.region.name,
        data: chartData.region.data,
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1
      });
    }

    // Dataset pour la France si des données sont disponibles
    if (chartData.france && chartData.france.data && chartData.france.data.some(val => val !== null && val !== undefined)) {
      datasets.push({
        label: chartData.france.name,
        data: chartData.france.data,
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 1
      });
    }

    console.log(`📊 Datasets préparés pour ${chartElementId}:`, datasets.length, "datasets");

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

    // ✅ Stocker l'instance du graphique globalement pour la gestion du redimensionnement
    if (!window.chartInstances) {
      window.chartInstances = new Map();
    }
    window.chartInstances.set(chartElementId, chart);

    console.log(`✅ Graphique ${chartElementId} créé avec succès`);
  } catch (e) {
    console.error(`❌ Erreur lors de la création du graphique ${chartElementId}:`, e);
  }
}
