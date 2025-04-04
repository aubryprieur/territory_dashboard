document.addEventListener("turbo:load", () => {
  const chartElement = document.getElementById("age-pyramid-chart");
  const dataElement = document.getElementById("age-pyramid-data");

  if (!chartElement || !dataElement || typeof Chart === "undefined") {
    console.warn("Chart.js ou données pour la pyramide des âges manquantes");
    return;
  }

  try {
    const pyramidData = JSON.parse(dataElement.textContent);

    // Créer des tableaux par groupe d'âge et par sexe
    const ageGroups = pyramidData.ageGroups;
    const maleData = pyramidData.maleData.map(value => -value); // Valeurs négatives pour les hommes
    const femaleData = pyramidData.femaleData;

    new Chart(chartElement, {
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

    console.log("✅ Pyramide des âges créée avec succès");
  } catch (e) {
    console.error("Erreur lors de la création de la pyramide des âges:", e);
  }
});
