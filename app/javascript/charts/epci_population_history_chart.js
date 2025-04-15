document.addEventListener("turbo:load", () => {
  const chartElement = document.getElementById("epci-population-history-chart");
  const dataElement = document.getElementById("epci-population-history-data");

  if (!chartElement || !dataElement || typeof Chart === "undefined") {
    console.warn("Chart.js ou données historiques EPCI manquantes");
    return;
  }

  try {
    const populationData = JSON.parse(dataElement.textContent);

    // Extraire les années et les valeurs
    const years = Object.keys(populationData);
    const populations = Object.values(populationData);

    new Chart(chartElement, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Population',
          data: populations,
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
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
                return `Population: ${new Intl.NumberFormat('fr-FR').format(context.raw)}`;
              }
            }
          }
        }
      }
    });

    console.log("✅ Graphique d'évolution de population EPCI créé avec succès");
  } catch (e) {
    console.error("Erreur lors de la création du graphique d'évolution de population EPCI:", e);
  }
});
