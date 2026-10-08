// Graphiques de comparaison territoriale (onglets Familles, Ménages, ...).
// Chaque <canvas data-families-chart="{...}"> porte sa configuration
// (générée par FamiliesHelper / TerritoryComparisonHelper) :
//   type "line"    : évolution d'un indicateur sur les millésimes, une courbe par territoire
//   type "stacked" : barres horizontales empilées à 100 % (répartitions)
//   type "bars"    : barres verticales groupées (catégories x territoires)
//   type "components" : barres empilées positives / négatives + courbe du total (composantes d'une variation)
//   type "pyramid" : pyramide des âges (hommes à gauche, femmes à droite, référence en contour)
//   type "positions" : établissements placés sur les déciles nationaux d'un indicateur (IPS, éloignement)

const pct = (v, digits = 1) =>
  v === null || v === undefined ? "–" : `${Number(v).toFixed(digits).replace(".", ",")} %`;

// Formatage selon l'unité de la configuration ("%" par défaut, "" pour une valeur décimale)
const fmt = (unit, digits) => (v) =>
  unit === "€" ? (v === null || v === undefined ? "–" : `${Math.round(Number(v)).toLocaleString("fr-FR")} €`)
  : unit === "%" || unit === undefined ? pct(v, digits)
    : v === null || v === undefined ? "–" : `${Number(v).toFixed(digits).replace(".", ",")}${unit ? " " + unit : ""}`;

function lineChart(canvas, cfg) {
  const isPct = cfg.unit === "%" || cfg.unit === undefined;
  const tip = fmt(cfg.unit, cfg.digits ?? (isPct ? 1 : 2));
  const tick = fmt(cfg.unit, isPct ? 0 : Math.min(cfg.digits ?? 1, 1));
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
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label} : ${tip(ctx.parsed.y)}` } },
      },
      scales: {
        x: { grid: { display: false } },
        // graduations non entières (ex. 6,5 %) : une décimale pour éviter « 7 %, 7 % »
        y: { ticks: { callback: (v) => (Number.isInteger(v) ? tick(v) : tip(v)) }, grid: { color: "#f3f4f6" } },
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

function groupedBarChart(canvas, cfg) {
  const tip = fmt(cfg.unit, 1);
  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: cfg.labels,
      datasets: cfg.datasets.map((d) => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.color,
        borderRadius: 2,
        maxBarThickness: 18,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        datalabels: { display: false },
        legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label} : ${tip(ctx.parsed.y)}` } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: (v) => fmt(cfg.unit, 0)(v) }, grid: { color: "#f3f4f6" } },
      },
    },
  });
}

function componentsChart(canvas, cfg) {
  const digits = cfg.digits ?? 2;
  const tip = fmt(cfg.unit, digits);
  const suffix = cfg.suffix ?? " par an";
  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: cfg.labels,
      datasets: cfg.datasets.map((d) =>
        d.line
          ? { type: "line", label: d.label, data: d.data, borderColor: d.color, backgroundColor: d.color,
              borderWidth: 2, pointRadius: 4, tension: 0, order: 0 }
          : { label: d.label, data: d.data, backgroundColor: d.color, stack: "components", maxBarThickness: 36, order: 1 }
      ),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        datalabels: { display: false },
        legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label} : ${tip(ctx.parsed.y)}${suffix}` } },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, ticks: { callback: (v) => fmt(cfg.unit, Math.min(digits, 1))(v) }, grid: { color: "#f3f4f6" } },
      },
    },
  });
}

function pyramidChart(canvas, cfg) {
  const neg = (arr) => arr.map((v) => (v === null || v === undefined ? null : -v));
  const datasets = [
    { label: `Hommes — ${cfg.main.name}`, data: neg(cfg.main.men), backgroundColor: "#3b82f6", order: 2 },
    { label: `Femmes — ${cfg.main.name}`, data: cfg.main.women, backgroundColor: "#f472b6", order: 2 },
  ];
  if (cfg.reference) {
    const ref = { backgroundColor: "rgba(0,0,0,0)", borderColor: "#111827", borderWidth: 1.5, grouped: false, order: 1 };
    datasets.push({ ...ref, label: `${cfg.reference.name} (hommes)`, data: neg(cfg.reference.men) });
    datasets.push({ ...ref, label: `${cfg.reference.name} (femmes)`, data: cfg.reference.women });
  }
  return new Chart(canvas, {
    type: "bar",
    data: { labels: cfg.labels, datasets: datasets.map((d) => ({ barPercentage: 1, categoryPercentage: 0.9, ...d })) },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        datalabels: { display: false },
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10, boxHeight: 10, font: { size: 11 },
            // une seule entrée pour la référence
            filter: (item) => !item.text.endsWith("(femmes)"),
            generateLabels: (chart) =>
              Chart.defaults.plugins.legend.labels.generateLabels(chart).map((l) =>
                l.text.endsWith("(hommes)") ? { ...l, text: l.text.replace(" (hommes)", " (contour)") } : l),
          },
        },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label} : ${pct(Math.abs(ctx.parsed.x), 2)}` } },
      },
      scales: {
        x: { stacked: false, ticks: { callback: (v) => pct(Math.abs(v), 1) }, grid: { color: "#f3f4f6" } },
        y: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
      },
    },
  });
}

// type "positions" : une ligne par type d'établissement, bandes des 10 déciles nationaux,
// un point par établissement (commune en couleur, autres établissements de l'EPCI en gris)
function positionsChart(canvas, cfg) {
  const digits = cfg.digits ?? 1;
  const num = (v) => Number(v).toFixed(digits).replace(".", ",");
  const bandsPlugin = {
    id: "decileBands",
    beforeDatasetsDraw(chart) {
      const { ctx, scales: { x, y } } = chart;
      const h = 16;
      ctx.save();
      (cfg.bands || []).forEach((band, row) => {
        if (!band) return;
        const yc = y.getPixelForValue(row);
        const edges = [x.min, ...band, x.max];
        for (let k = 0; k < 10; k += 1) {
          const a = Math.max(edges[k], x.min);
          const b = Math.min(edges[k + 1], x.max);
          if (b <= a) continue;
          const x0 = x.getPixelForValue(a);
          const x1 = x.getPixelForValue(b);
          ctx.fillStyle = k % 2 === 0 ? "#e0e7ff" : "#eef2ff";
          ctx.fillRect(x0, yc - h / 2, x1 - x0, h);
          if (x1 - x0 > 16) {
            ctx.fillStyle = "#6b7280";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`D${k + 1}`, (x0 + x1) / 2, yc + h / 2 + 11);
          }
        }
        // médiane nationale
        const xm = x.getPixelForValue(band[4]);
        ctx.strokeStyle = "#4338ca";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xm, yc - h / 2 - 3);
        ctx.lineTo(xm, yc + h / 2 + 3);
        ctx.stroke();
      });
      ctx.restore();
    },
  };
  return new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: cfg.datasets.map((d) => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.color,
        borderColor: d.main ? "#ffffff" : d.color,
        borderWidth: d.main ? 2 : 0,
        pointRadius: d.main ? 7 : 4,
        pointHoverRadius: d.main ? 9 : 6,
        order: d.main ? 0 : 1,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: { display: false },
        legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            title: (items) => items.map((i) => i.raw.label).join(" ; "),
            label: (ctx) => {
              const r = ctx.raw;
              const decile = r.decile ? ` — ${r.decile === 1 ? "1er" : `${r.decile}e`} décile national` : "";
              return `${r.commune ? `${r.commune} : ` : ""}${num(r.x)}${cfg.unit ? ` ${cfg.unit}` : ""}${decile}`;
            },
          },
        },
      },
      scales: {
        x: { min: cfg.min, max: cfg.max, grid: { color: "#f3f4f6" }, ticks: { callback: (v) => num(v).replace(/,0+$/, "") } },
        y: {
          min: -0.7, max: cfg.rows.length - 0.3, reverse: true,
          grid: { display: false },
          afterBuildTicks: (axis) => { axis.ticks = cfg.rows.map((_, i) => ({ value: i })); },
          ticks: { callback: (v) => cfg.rows[v] ?? "", font: { size: 11 } },
        },
      },
    },
    plugins: [bandsPlugin],
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
      const build = { stacked: stackedChart, bars: groupedBarChart, components: componentsChart,
                      pyramid: pyramidChart, positions: positionsChart }[cfg.type] || lineChart;
      canvas._familiesChart = build(canvas, cfg);
    } catch (error) {
      console.error("❌ Graphique familles :", error);
    }
  });
}

// Toute section chargée en asynchrone peut contenir ces graphiques (familles, ménages, ...)
document.addEventListener("dashboard:sectionLoaded", (event) => {
  setTimeout(() => initFamiliesCharts((event.detail && event.detail.container) || document), 50);
});
document.addEventListener("turbo:load", () => initFamiliesCharts());

window.initFamiliesCharts = initFamiliesCharts;
