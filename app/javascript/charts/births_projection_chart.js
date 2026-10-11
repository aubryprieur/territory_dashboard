/**
 * Initialise le graphique de projection des naissances (historique + projection 2035)
 * Commune Dashboard
 * Affiche deux scénarios : Stable et -10% avec zone d'incertitude entre les deux
 */

// Rendre la fonction globalement disponible
window.initializeBirthsProjectionChart = function() {
  console.log("✅ births_projection_chart.js chargé - Fonction disponible");

  const chartElement = document.getElementById("commune-births-projection-chart");
  const dataElement = document.getElementById("commune-births-projection-data");

  console.log("🔍 Tentative d'initialisation du graphique de projection");
  console.log("Canvas element:", chartElement);
  console.log("Data element:", dataElement);
  console.log("Chart.js disponible ?", typeof Chart !== "undefined");

  // Bloc de projection retiré de l'onglet Population (à repenser) : rien à dessiner
  if (!chartElement || !dataElement || typeof Chart === "undefined") return;

  try {
    const existingChart = Chart.getChart(chartElement);
    if (existingChart) {
      console.log("Graphique de projection des naissances déjà initialisé, destruction de l'ancien");
      existingChart.destroy();
    }
  } catch (error) {
    console.warn("Erreur lors de la vérification du graphique existant:", error);
  }

  try {
    const data = JSON.parse(dataElement.textContent);
    const historicalYears = data.historical_years || [];
    const historicalValues = data.historical_values || [];
    const projectionYears = data.projection_years || [];
    const projectionValuesStable = data.projection_values_stable || [];
    const projectionValuesMinus10 = data.projection_values_minus_10 || [];

    console.log("📊 Données historiques:", { years: historicalYears, values: historicalValues });
    console.log("📈 Scénario Stable:", projectionValuesStable);
    console.log("📈 Scénario -10%:", projectionValuesMinus10);

    if (!historicalYears.length || !projectionYears.length) {
      console.warn("Données insuffisantes pour le graphique de projection");
      return;
    }

    // Déterminer l'année de transition (dernière année historique)
    const lastHistoricalYear = Math.max(...historicalYears);

    // Construire les datasets
    // 1. Ligne historique (épaisse, noir)
    const historicalDataset = {
      label: "Historique observé",
      data: historicalYears.map((year, idx) => ({
        x: year,
        y: historicalValues[idx]
      })),
      borderColor: "#10b981",  // Vert émeraude
      backgroundColor: "rgba(16, 185, 129, 0.08)",
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 6,  // Grossir les points au survol
      pointBackgroundColor: "#10b981",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointHoverBorderWidth: 3,
      tension: 0.3,
      fill: false,
      hoverBorderWidth: 3.5,
      hoverBorderColor: "#059669",
      tooltip: {
        enabled: false
      }
    };

    // 2. Scénario -10% (rouge, tirets) - EN PREMIER pour que la zone grisée se remplisse correctement
    const minus10Dataset = {
      label: "Scénario -10% (déclin progressif)",
      data: projectionYears.map((year, idx) => ({
        x: year,
        y: projectionValuesMinus10[idx]
      })),
      borderColor: "#ef4444",
      backgroundColor: "rgba(239, 68, 68, 0.05)",
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0,
      fill: false,
      pointBackgroundColor: "#ef4444"
    };

    // 3. Zone grisée entre les deux scénarios (fill between)
    const fillBetweenDataset = {
      label: "Zone d'incertitude",
      data: projectionYears.map((year, idx) => ({
        x: year,
        y: projectionValuesStable[idx]
      })),
      borderWidth: 0,
      backgroundColor: "rgba(156, 163, 175, 0.25)",
      borderColor: "transparent",
      fill: '-1',  // Remplit entre ce dataset et le +1 (le dataset -10%)
      pointRadius: 0,
      tension: 0,
      pointHoverRadius: 0,
      hoverBackgroundColor: "transparent"
    };

    // 4. Scénario Stable (bleu, tirets)
    const stableDataset = {
      label: "Scénario Stable (taux constant)",
      data: projectionYears.map((year, idx) => ({
        x: year,
        y: projectionValuesStable[idx]
      })),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.05)",
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0,
      fill: false,
      pointBackgroundColor: "#3b82f6"
    };

    // Créer le graphique
    const chart = new Chart(chartElement, {
      type: "line",
      data: {
        datasets: [
          historicalDataset,
          minus10Dataset,
          fillBetweenDataset,
          stableDataset
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { size: 12, weight: 500 },
              usePointStyle: true,
              padding: 15,
              color: "#374151"
            },
            onClick: null  // Désactiver le click sur la légende
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13, weight: "bold" },
            bodyFont: { size: 12 },
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            displayColors: true,
            filter: function(tooltipItem) {
              // Afficher SEULEMENT les deux scénarios de projection
              return tooltipItem.dataset.label === "Scénario Stable (taux constant)" ||
                     tooltipItem.dataset.label === "Scénario -10% (déclin progressif)";
            },
            callbacks: {
              title: function(context) {
                if (context.length > 0) {
                  const year = Math.round(context[0].parsed.x);
                  return "Année " + year;
                }
                return '';
              },
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += Math.round(context.parsed.y) + ' naissances';
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            type: "linear",
            min: Math.min(...historicalYears) - 1,
            max: 2035,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return Math.round(value);
              },
              font: { size: 11 }
            },
            title: {
              display: true,
              text: "Année",
              font: { size: 12, weight: "bold" }
            },
            grid: {
              drawBorder: true,
              color: "rgba(0, 0, 0, 0.05)"
            }
          },
          y: {
            title: {
              display: true,
              text: "Nombre de naissances",
              font: { size: 12, weight: "bold" }
            },
            ticks: {
              font: { size: 11 }
            },
            grid: {
              drawBorder: true,
              color: "rgba(0, 0, 0, 0.05)"
            }
          }
        }
      }
    });

    console.log("✅ Graphique de projection des naissances créé avec succès");

  } catch (error) {
    console.error("Erreur lors de l'initialisation du graphique de projection des naissances:", error);
  }
};

// Initialiser le graphique dès que le DOM est prêt
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOMContentLoaded - Initialisation births projection chart");
  if (typeof window.initializeBirthsProjectionChart === "function") {
    window.initializeBirthsProjectionChart();
  }
});

// Réinitialiser aussi quand le contenu est chargé dynamiquement (stimulus/turbo)
document.addEventListener("turbo:load", function() {
  console.log("turbo:load - Initialisation births projection chart");
  if (typeof window.initializeBirthsProjectionChart === "function") {
    window.initializeBirthsProjectionChart();
  }
});

console.log("✅ Module births_projection_chart.js chargé");
