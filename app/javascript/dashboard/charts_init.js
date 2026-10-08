// app/javascript/dashboard/charts_init.js
console.log("🎯 Chargement du module de graphiques dashboard");

// S'assurer que Chart.js est disponible
function ensureChartJS() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      console.log("Chart.js déjà disponible");
      resolve();
      return;
    }

    // Attendre le chargement via importmap
    let attempts = 0;
    const maxAttempts = 50;

    const checkChart = () => {
      attempts++;
      if (window.Chart) {
        console.log("Chart.js chargé via importmap");
        resolve();
      } else if (attempts >= maxAttempts) {
        console.log("Timeout, chargement Chart.js depuis CDN");
        loadChartFromCDN().then(resolve).catch(reject);
      } else {
        setTimeout(checkChart, 100);
      }
    };

    checkChart();
  });
}

function loadChartFromCDN() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
    script.onload = () => {
      console.log('Chart.js chargé depuis CDN');
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Fonction pour créer la pyramide des âges
function createBirthsChart() {
  console.log("👶 Création du graphique des naissances");

  const canvas = document.getElementById('births-chart');
  if (!canvas) {
    console.warn("❌ Canvas births-chart non trouvé");
    return;
  }

  // Récupérer les données depuis le script JSON
  const dataElement = document.getElementById('births-data-filtered');
  if (!dataElement) {
    console.warn("❌ Données births-data-filtered non trouvées");
    return;
  }

  let birthsData;
  try {
    birthsData = JSON.parse(dataElement.textContent);
  } catch (e) {
    console.error("❌ Erreur parsing données naissances:", e);
    return;
  }

  const ctx = canvas.getContext('2d');

  // Détruire le graphique existant s'il y en a un
  if (window.birthsChart) {
    window.birthsChart.destroy();
  }

  if (!birthsData || birthsData.length === 0) {
    console.warn("⚠️ Pas de données de naissances disponibles");
    return;
  }

  const labels = birthsData.map(item => item.time_period || item.year || item.annee || item.ANNEE);
  const births = birthsData.map(item => item.obs_value || item.naissances || item.births || item.NAISS || 0);

  window.birthsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Naissances',
        data: births,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  console.log("✅ Graphique des naissances créé");
}

// Écouter le chargement des sections
document.addEventListener('dashboard:sectionLoaded', async function(event) {
  if (event.detail.section === 'synthese') {
    console.log("🎯 Section synthèse chargée, initialisation des graphiques");
    await ensureChartJS();

    // Attendre un peu que le DOM soit prêt
    setTimeout(() => {
      // Pyramide et évolution de la population : graphiques génériques (charts/families_charts.js)
      if (document.getElementById('births-data-filtered')) {
        createBirthsChart();
        initializeBirthsProjectionChart();
      }
    }, 200);
  }
});

console.log("✅ Module graphiques dashboard initialisé");
console.log("Fonction initializeBirthsProjectionChart existe ?", typeof initializeBirthsProjectionChart);
