document.addEventListener("turbo:load", () => {
  const chartElement = document.getElementById("historical-chart");
  const dataScript = document.getElementById("historical-data");

  if (!chartElement || !dataScript || typeof Chart === "undefined") {
    console.warn("Chart.js ou données manquantes");
    return;
  }

  try {
    const data = JSON.parse(dataScript.textContent);

    const years = ['1968', '1975', '1982', '1990', '1999', '2010', '2015', '2021'];
    const keyMap = {
      "1968": "D68_POP", "1975": "D75_POP", "1982": "D82_POP", "1990": "D90_POP",
      "1999": "D99_POP", "2010": "P10_POP", "2015": "P15_POP", "2021": "P21_POP"
    };

    const datasets = data.map(entry => ({
      label: entry.name || "Territoire",
      data: years.map(y => entry[keyMap[y]] || 0),
      borderColor: "rgba(79, 70, 229, 1)",
      backgroundColor: "rgba(79, 70, 229, 0.2)",
      borderWidth: 2,
      tension: 0.1,
      pointBackgroundColor: "rgba(79, 70, 229, 1)"
    }));

    new Chart(chartElement, {
      type: "line",
      data: { labels: years, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: "end",
            align: "top",
            font: { size: 10, weight: "bold" },
            color: "#4F46E5",
            formatter: val => new Intl.NumberFormat("fr-FR").format(val)
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label} : ${new Intl.NumberFormat("fr-FR").format(ctx.raw)}`
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: val => new Intl.NumberFormat("fr-FR").format(val)
            }
          }
        }
      },
      plugins: [ChartDataLabels] // ✅ Ajout clé
    });

    console.log("✅ Graphique historique créé");
  } catch (e) {
    console.error("Erreur graphique historique :", e);
  }
});
