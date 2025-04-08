// app/javascript/charts/epci_communes_chart.js
document.addEventListener("turbo:load", () => {
  const chartElement = document.getElementById("epci-communes-chart");
  const dataElement = document.getElementById("communes-children-data");

  if (!chartElement || !dataElement || typeof Chart === "undefined") {
    console.warn("Chart.js ou données EPCI manquantes");
    return;
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

    // Créer des tooltip labels personnalisés avec le nombre d'enfants
    const tooltipLabels = chartData.commune_names.map((name, index) => {
      const pop = chartData.commune_populations[index].toLocaleString('fr-FR');
      const childrenCount = chartData.children_under3_counts[index].toLocaleString('fr-FR');
      return `${name} - Population: ${pop} - Enfants <3 ans: ${childrenCount}`;
    });

    new Chart(chartElement, {
      type: 'bar',
      data: {
        labels: chartData.commune_names,
        datasets: [{
          label: 'Taux d\'enfants -3 ans (%)',
          data: chartData.under3_rates,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Barres horizontales
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                const idx = tooltipItems[0].dataIndex;
                return tooltipLabels[idx];
              },
              label: function(context) {
                return `Taux: ${context.raw.toFixed(2)}%`;
              },
              afterLabel: function(context) {
                const idx = context.dataIndex;
                const childrenCount = chartData.children_under3_counts[idx];
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
              const childrenCount = chartData.children_under3_counts[idx];
              return `${value.toFixed(2)}% (${childrenCount})`;
            },
            anchor: 'end',
            align: 'end',
            offset: 4
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Pourcentage d\'enfants de moins de 3 ans (%)'
            },
            grid: {
              display: true
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });

    console.log("✅ Graphique EPCI enfants -3 ans créé avec succès");
  } catch (e) {
    console.error("Erreur graphique EPCI enfants:", e);
  }
});
