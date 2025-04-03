document.addEventListener("turbo:load", () => {
  const chartElement = document.getElementById('domestic-violence-chart');
  if (!chartElement || typeof Chart === "undefined") {
    console.warn("Chart.js ou élément manquant pour le graphique des violences intrafamiliales");
    return;
  }

  // Récupérer les données depuis la variable globale
  const { years, communeData, departmentData, regionData, territoryNames } = window.domesticViolenceData || {};

  if (!years || !years.length) {
    console.warn("Données manquantes pour le graphique des violences intrafamiliales");
    return;
  }

  const datasets = [];

  if (communeData && communeData.some(val => val !== null)) {
    datasets.push({
      label: territoryNames.commune,
      data: communeData,
      borderColor: 'rgba(220, 38, 38, 1)',
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: false
    });
  }

  if (departmentData && departmentData.some(val => val !== null)) {
    datasets.push({
      label: territoryNames.department,
      data: departmentData,
      borderColor: 'rgba(79, 70, 229, 1)',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: false
    });
  }

  if (regionData && regionData.some(val => val !== null)) {
    datasets.push({
      label: territoryNames.region,
      data: regionData,
      borderColor: 'rgba(16, 185, 129, 1)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: false
    });
  }

  try {
    new Chart(chartElement, {
      type: 'line',
      data: {
        labels: years,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.raw.toFixed(2);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Taux pour 1000 habitants'
            }
          }
        }
      }
    });

    console.log("✅ Graphique des violences intrafamiliales créé avec succès");
  } catch (e) {
    console.error("Erreur lors de la création du graphique des violences intrafamiliales:", e);
  }
});
