// Graphiques de l'onglet Familles (dashboard commune).
// Chaque <canvas data-families-chart="{...}"> porte sa configuration (générée par FamiliesHelper) :
//   type "line"    : évolution d'un taux sur les millésimes, une courbe par territoire
//   type "stacked" : barres horizontales empilées à 100 % (répartition par nombre d'enfants)

const pct = (v, digits = 1) =>
  v === null || v === undefined ? "–" : `${Number(v).toFixed(digits).replace(".", ",")} %`;

function lineChart(canvas, cfg) {
  return new Chart(canvas, {
    type: "line",
    data: {
      labels: cfg.labels,
      datasets: cfg.datasets.map((d) => ({
        label: d.label,
        data: d.data,
        borderColor: d.color,
        backgroundColor: d.color,
        borderWidth: d.main ? 3 : 1.5,
        pointRadius: d.main ? 4 : 3,
        pointHoverRadius: 6,
        spanGaps: true,
        tension: 0,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        datalabels: { display: false },
        legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label} : ${pct(ctx.parsed.y)}` } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { callback: (v) => pct(v, 0) }, grid: { color: "#f3f4f6" } },
      },
    },
  });
}

function stackedChart(canvas, cfg) {
  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: cfg.labels,
      datasets: cfg.datasets.map((d) => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.color,
        borderColor: "#ffffff",
        borderWidth: 1,
        barThickness: 26,
      })),
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: { display: false },
        legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label} : ${pct(ctx.parsed.x)}` } },
      },
      scales: {
        x: { stacked: true, min: 0, max: 100, ticks: { callback: (v) => `${v} %` }, grid: { color: "#f3f4f6" } },
        y: { stacked: true, grid: { display: false } },
      },
    },
  });
}

function initFamiliesCharts(root = document, attempt = 0) {
  const canvases = root.querySelectorAll("canvas[data-families-chart]");
  if (canvases.length === 0) return;

  if (typeof Chart === "undefined") {
    if (attempt < 50) setTimeout(() => initFamiliesCharts(root, attempt + 1), 100);
    return;
  }

  canvases.forEach((canvas) => {
    try {
      const cfg = JSON.parse(canvas.dataset.familiesChart);
      if (canvas._familiesChart) canvas._familiesChart.destroy();
      canvas._familiesChart = cfg.type === "stacked" ? stackedChart(canvas, cfg) : lineChart(canvas, cfg);
    } catch (error) {
      console.error("❌ Graphique familles :", error);
    }
  });
}

document.addEventListener("dashboard:sectionLoaded", (event) => {
  if (event.detail && event.detail.section === "families") {
    setTimeout(() => initFamiliesCharts(event.detail.container || document), 50);
  }
});
document.addEventListener("turbo:load", () => initFamiliesCharts());

window.initFamiliesCharts = initFamiliesCharts;
