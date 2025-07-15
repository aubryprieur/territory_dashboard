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
function createAgePyramidChart(data) {
  console.log("📊 Création de la pyramide des âges", data);

  const canvas = document.getElementById('age-pyramid-chart');
  if (!canvas) {
    console.warn("❌ Canvas age-pyramid-chart non trouvé");
    return;
  }

  const ctx = canvas.getContext('2d');

  // Détruire le graphique existant s'il y en a un
  if (window.agePyramidChart) {
    window.agePyramidChart.destroy();
  }

  // Vérifier que les données sont valides
  if (!data || !data.ageGroups || !data.maleData || !data.femaleData) {
    console.error("❌ Données pyramide des âges invalides:", data);
    return;
  }

  const labels = data.ageGroups || [];
  const maleData = (data.maleData || []).map(val => -Math.abs(val)); // Négatif pour aller à gauche
  const femaleData = data.femaleData || [];

  window.agePyramidChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hommes',
          data: maleData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        },
        {
          label: 'Femmes',
          data: femaleData,
          backgroundColor: 'rgba(236, 72, 153, 0.8)',
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return Math.abs(value);
            }
          }
        },
        y: {
          stacked: false,
          reverse: false
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
              const label = context.dataset.label || '';
              const value = Math.abs(context.parsed.x);
              return `${label}: ${value}`;
            }
          }
        }
      }
    }
  });

  console.log("✅ Pyramide des âges créée");
}

// ✅ GARDER SEULEMENT CETTE VERSION avec le debug
function prepareAgePyramidData(populationData) {
  if (!populationData || !Array.isArray(populationData) || populationData.length === 0) {
    console.warn("⚠️ Données population vides pour la pyramide");
    return { ageGroups: [], maleData: [], femaleData: [] };
  }

  // 🔍 DEBUG: Examiner le format des données
  console.log("🔍 DEBUG Population Data:", populationData.slice(0, 3));
  console.log("🔍 DEBUG Clés disponibles:", Object.keys(populationData[0] || {}));

  const ageGroups = [];
  const maleData = [];
  const femaleData = [];

  for (let age = 100; age >= 0; age--) {
    const ageStr = age.toString();

    // 🔍 DEBUG: Tester différents formats possibles
    const malesVariant1 = populationData.filter(item =>
      item["AGED100"] === ageStr && item["SEXE"] === "1"
    ).reduce((sum, item) => sum + parseFloat(item["NB"] || 0), 0);

    const malesVariant2 = populationData.filter(item =>
      item["AGED100"] === ageStr && item["SEXE"] === 1
    ).reduce((sum, item) => sum + parseFloat(item["NB"] || 0), 0);

    const malesVariant3 = populationData.filter(item =>
      parseInt(item["AGED100"]) === age && parseInt(item["SEXE"]) === 1
    ).reduce((sum, item) => sum + parseFloat(item["NB"] || 0), 0);

    // 🔍 DEBUG: Afficher les tests pour les 5 premiers âges
    if (age >= 96) {
      console.log(`🔍 Age ${age}:`, {
        variant1: malesVariant1,
        variant2: malesVariant2,
        variant3: malesVariant3,
        sampleData: populationData.filter(item => item["AGED100"] == ageStr).slice(0, 2)
      });
    }

    // Utiliser la variante qui fonctionne
    const males = malesVariant1 || malesVariant2 || malesVariant3;

    const females = populationData.filter(item =>
      item["AGED100"] == ageStr && item["SEXE"] == "2"
    ).reduce((sum, item) => sum + parseFloat(item["NB"] || 0), 0);

    ageGroups.push(age === 100 ? "100+" : age.toString());
    maleData.push(males);
    femaleData.push(females);
  }

  console.log("🔍 DEBUG Résultats:", {
    totalMales: maleData.reduce((a, b) => a + b, 0),
    totalFemales: femaleData.reduce((a, b) => a + b, 0),
    nonZeroMales: maleData.filter(x => x > 0).length,
    nonZeroFemales: femaleData.filter(x => x > 0).length
  });

  return { ageGroups, maleData, femaleData };
}

// Fonction pour créer le graphique historique
function createHistoricalChart(data) {
  console.log("📈 Création du graphique historique", data);

  const canvas = document.getElementById('historical-chart');
  if (!canvas) {
    console.warn("❌ Canvas historical-chart non trouvé");
    return;
  }

  const ctx = canvas.getContext('2d');

  // Détruire le graphique existant s'il y en a un
  if (window.historicalChart) {
    window.historicalChart.destroy();
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn("⚠️ Pas de données historiques disponibles");
    return;
  }

  // Préparer les données depuis l'objet API
  const labels = [];
  const populations = [];

  if (data[0].CODGEO) {
    // Format API avec D68_POP, D75_POP, etc.
    const item = data[0];
    const years = ['1968', '1975', '1982', '1990', '1999', '2010', '2015', '2021'];
    const popKeys = ['D68_POP', 'D75_POP', 'D82_POP', 'D90_POP', 'D99_POP', 'P10_POP', 'P15_POP', 'P21_POP'];

    years.forEach((year, index) => {
      const popValue = item[popKeys[index]];
      if (popValue) {
        labels.push(year);
        populations.push(parseInt(popValue));
      }
    });
  } else {
    // Format simple avec year/population
    labels = data.map(item => item.year || item.annee);
    populations = data.map(item => item.population || item.pop || 0);
  }

  window.historicalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Population',
        data: populations,
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
          beginAtZero: false
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  console.log("✅ Graphique historique créé");
}

// Fonction pour créer le graphique des naissances
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

// Écouter les événements pour créer les graphiques
document.addEventListener('charts:renderAgePyramid', async function(event) {
  console.log("🎯 Événement pyramide des âges reçu");
  await ensureChartJS();
  createAgePyramidChart(event.detail);
});

document.addEventListener('charts:renderHistorical', async function(event) {
  console.log("🎯 Événement historique reçu");
  await ensureChartJS();
  createHistoricalChart(event.detail.data);
  createBirthsChart(); // Créer aussi le graphique des naissances
});

// Écouter le chargement des sections
document.addEventListener('dashboard:sectionLoaded', async function(event) {
  if (event.detail.section === 'synthese') {
    console.log("🎯 Section synthèse chargée, initialisation des graphiques");
    await ensureChartJS();

    // Attendre un peu que le DOM soit prêt
    setTimeout(() => {
      // Déclencher les graphiques depuis les données dans le DOM
      const populationDataElement = document.getElementById('population-data-json');
      const historicalDataElement = document.getElementById('historical-data');

      if (populationDataElement) {
        try {
          const popData = JSON.parse(populationDataElement.textContent);
          console.log("📊 Données population récupérées:", popData.length, "entrées");

          // Préparer les données pour la pyramide
          const pyramidData = prepareAgePyramidData(popData);
          console.log("📊 Données pyramide préparées:", pyramidData);

          createAgePyramidChart(pyramidData);
        } catch (e) {
          console.error("❌ Erreur parsing données population:", e);
        }
      }

      if (historicalDataElement) {
        try {
          const histData = JSON.parse(historicalDataElement.textContent);
          console.log("📈 Données historiques récupérées:", histData);
          createHistoricalChart(histData);
          createBirthsChart();
        } catch (e) {
          console.error("❌ Erreur parsing données historiques:", e);
        }
      }
    }, 200);
  }
});

console.log("✅ Module graphiques dashboard initialisé");
