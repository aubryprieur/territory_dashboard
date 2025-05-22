/**
 * Graphique horizontal des taux d'enfants de moins de 3 ans par commune dans l'EPCI
 * Affiche un graphique en barres horizontales avec code couleur selon les taux
 */
function initializeEpciCommunesChart() {
  const chartElement = document.getElementById("epci-communes-chart");
  const dataElement = document.getElementById("communes-children-data");

  if (!chartElement || !dataElement || typeof Chart === "undefined") {
    console.warn("Chart.js ou données EPCI communes manquantes");
    return;
  }

  // ✅ Vérifier si déjà initialisé et nettoyer si nécessaire
  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      console.log("Graphique communes EPCI déjà initialisé, destruction de l'ancien");
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  try {
    const chartData = JSON.parse(dataElement.textContent);

    // Créer un dégradé de couleurs basé sur les valeurs
    const backgroundColors = chartData.under3_rates.map(rate => {
      // Rouge pour les valeurs hautes, jaune pour les moyennes, vert pour les basses
      if (rate > 4.5) return 'rgba(220, 38, 38, 0.7)'; // Rouge
      if (rate > 3.5) return 'rgba(245, 158, 11, 0.7)'; // Orange
      if (rate > 2.5) return 'rgba(252, 211, 77, 0.7)'; // Jaune
      return 'rgba(16, 185, 129, 0.7)'; // Vert
    });

    // Couleurs de bordure correspondantes
    const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

    // Créer des tooltip labels personnalisés avec le nombre d'enfants
    const tooltipLabels = chartData.commune_names.map((name, index) => {
      const pop = chartData.commune_populations[index].toLocaleString('fr-FR');
      const childrenCount = chartData.children_under3_counts[index].toLocaleString('fr-FR');
      return `${name} - Population: ${pop} - Enfants <3 ans: ${childrenCount}`;
    });

    // Trier les données par taux décroissant pour un meilleur affichage
    const sortedData = chartData.commune_names.map((name, index) => ({
      name,
      rate: chartData.under3_rates[index],
      population: chartData.commune_populations[index],
      childrenCount: chartData.children_under3_counts[index],
      backgroundColor: backgroundColors[index],
      borderColor: borderColors[index],
      tooltipLabel: tooltipLabels[index]
    })).sort((a, b) => b.rate - a.rate);

    const chart = new Chart(chartElement, {
      type: 'bar',
      data: {
        labels: sortedData.map(item => item.name),
        datasets: [{
          label: 'Taux d\'enfants -3 ans (%)',
          data: sortedData.map(item => item.rate),
          backgroundColor: sortedData.map(item => item.backgroundColor),
          borderColor: sortedData.map(item => item.borderColor),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Barres horizontales
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            right: 20 // Espace pour les labels de données
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            callbacks: {
              title: function(tooltipItems) {
                const idx = tooltipItems[0].dataIndex;
                return sortedData[idx].tooltipLabel;
              },
              label: function(context) {
                return `Taux: ${context.raw.toFixed(2)}%`;
              },
              afterLabel: function(context) {
                const idx = context.dataIndex;
                const childrenCount = sortedData[idx].childrenCount;
                return `Nombre d'enfants <3 ans: ${childrenCount.toLocaleString('fr-FR')}`;
              }
            }
          },
          datalabels: {
            color: '#000',
            font: {
              weight: 'bold',
              size: 10
            },
            formatter: (value, context) => {
              const idx = context.dataIndex;
              const childrenCount = sortedData[idx].childrenCount;
              return `${value.toFixed(2)}% (${childrenCount})`;
            },
            anchor: 'end',
            align: 'end',
            offset: 4,
            display: function(context) {
              // N'afficher que pour les communes avec plus de 10 enfants pour éviter l'encombrement
              const idx = context.dataIndex;
              return sortedData[idx].childrenCount > 10;
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Pourcentage d\'enfants de moins de 3 ans (%)',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              },
              callback: function(value) {
                const label = this.getLabelForValue(value);
                // Tronquer les noms trop longs
                return label.length > 20 ? label.substring(0, 17) + '...' : label;
              }
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

    // Ajouter des statistiques dans la console
    const avgRate = sortedData.reduce((sum, item) => sum + item.rate, 0) / sortedData.length;
    const maxRate = Math.max(...sortedData.map(item => item.rate));
    const minRate = Math.min(...sortedData.map(item => item.rate));

    console.log(`📊 Statistiques communes EPCI:
      - Taux moyen: ${avgRate.toFixed(2)}%
      - Taux max: ${maxRate.toFixed(2)}% (${sortedData[0].name})
      - Taux min: ${minRate.toFixed(2)}% (${sortedData[sortedData.length-1].name})
      - Écart: ${(maxRate - minRate).toFixed(2)} points`);

    console.log("✅ Graphique EPCI enfants -3 ans créé avec succès");
  } catch (e) {
    console.error("Erreur graphique EPCI enfants:", e);
  }
}

// ✅ Initialiser le graphique au chargement de la page (une seule fois sur turbo:load)
document.addEventListener("turbo:load", function() {
  initializeEpciCommunesChart();
});

// Exporter la fonction pour la rendre disponible
export { initializeEpciCommunesChart };
