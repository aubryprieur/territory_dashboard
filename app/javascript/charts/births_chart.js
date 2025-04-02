// Dans app/javascript/charts/births_chart.js
document.addEventListener("turbo:load", () => {
  const chartElement = document.getElementById("births-chart");
  const dataScript = document.getElementById("births-data");

  if (!chartElement || !dataScript || typeof Chart === "undefined") {
    console.warn("Chart.js ou données des naissances manquantes");
    return;
  }

  try {
    const birthsData = JSON.parse(dataScript.textContent);

    // Organiser les données par année
    const birthsByYear = {};
    birthsData.forEach(item => {
      if (item.geo_object === "COM") {
        birthsByYear[item.time_period] = item.obs_value;
      }
    });

    // Trier les années
    const years = Object.keys(birthsByYear).sort();
    const birthValues = years.map(year => birthsByYear[year]);

    // Convertir les années en nombres pour la régression
    const yearsNumeric = years.map(year => parseInt(year));

    // Fonction pour calculer la régression polynomiale
    function polynomialRegression(x, y, order = 3) {
      // Normaliser les x pour éviter des problèmes numériques
      const xMin = Math.min(...x);
      const xMax = Math.max(...x);
      const xNorm = x.map(val => (val - xMin) / (xMax - xMin) * 2 - 1);

      // Construire la matrice de Vandermonde
      const vandermonde = [];
      for (let i = 0; i < xNorm.length; i++) {
        const row = [];
        for (let j = 0; j <= order; j++) {
          row.push(Math.pow(xNorm[i], j));
        }
        vandermonde.push(row);
      }

      // Résoudre le système linéaire avec la méthode des moindres carrés
      const coefficients = solveLinearSystem(vandermonde, y);

      // Fonction pour évaluer le polynôme à un point donné
      function evaluate(x) {
        // Normaliser x
        const xn = (x - xMin) / (xMax - xMin) * 2 - 1;
        let result = 0;
        for (let i = 0; i <= order; i++) {
          result += coefficients[i] * Math.pow(xn, i);
        }
        return result;
      }

      // Calculer les points de la courbe
      const curve = x.map(evaluate);

      return curve;
    }

    // Résoudre un système linéaire Ax = b avec la méthode des moindres carrés
    function solveLinearSystem(A, b) {
      // Transposer A
      const AT = transposeMatrix(A);

      // Calculer AT * A
      const ATA = multiplyMatrices(AT, A);

      // Calculer AT * b
      const ATb = multiplyMatrixVector(AT, b);

      // Résoudre le système (AT * A) * x = AT * b
      const x = solveEquation(ATA, ATb);

      return x;
    }

    // Transposer une matrice
    function transposeMatrix(matrix) {
      const rows = matrix.length;
      const cols = matrix[0].length;
      const result = [];

      for (let j = 0; j < cols; j++) {
        const row = [];
        for (let i = 0; i < rows; i++) {
          row.push(matrix[i][j]);
        }
        result.push(row);
      }

      return result;
    }

    // Multiplier deux matrices
    function multiplyMatrices(A, B) {
      const rowsA = A.length;
      const colsA = A[0].length;
      const colsB = B[0].length;
      const result = [];

      for (let i = 0; i < rowsA; i++) {
        const row = [];
        for (let j = 0; j < colsB; j++) {
          let sum = 0;
          for (let k = 0; k < colsA; k++) {
            sum += A[i][k] * B[k][j];
          }
          row.push(sum);
        }
        result.push(row);
      }

      return result;
    }

    // Multiplier une matrice par un vecteur
    function multiplyMatrixVector(A, v) {
      const rows = A.length;
      const cols = A[0].length;
      const result = [];

      for (let i = 0; i < rows; i++) {
        let sum = 0;
        for (let j = 0; j < cols; j++) {
          sum += A[i][j] * v[j];
        }
        result.push(sum);
      }

      return result;
    }

    // Résoudre un système d'équations par la méthode de Gauss-Jordan
    function solveEquation(A, b) {
      const n = A.length;
      const augmentedMatrix = [];

      // Créer la matrice augmentée [A|b]
      for (let i = 0; i < n; i++) {
        const row = [...A[i], b[i]];
        augmentedMatrix.push(row);
      }

      // Elimination de Gauss
      for (let i = 0; i < n; i++) {
        // Trouver le pivot maximum
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(augmentedMatrix[j][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
            maxRow = j;
          }
        }

        // Échanger les lignes
        const temp = augmentedMatrix[i];
        augmentedMatrix[i] = augmentedMatrix[maxRow];
        augmentedMatrix[maxRow] = temp;

        // Faire la ligne pivot
        const pivot = augmentedMatrix[i][i];
        for (let j = i; j <= n; j++) {
          augmentedMatrix[i][j] /= pivot;
        }

        // Éliminer les autres lignes
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            const factor = augmentedMatrix[j][i];
            for (let k = i; k <= n; k++) {
              augmentedMatrix[j][k] -= factor * augmentedMatrix[i][k];
            }
          }
        }
      }

      // Extraire la solution
      const solution = [];
      for (let i = 0; i < n; i++) {
        solution.push(augmentedMatrix[i][n]);
      }

      return solution;
    }

    // Déterminer l'ordre de la régression polynomiale en fonction du nombre de points
    // Utiliser un ordre plus bas si peu de points pour éviter l'overfitting
    const regressionOrder = Math.min(3, Math.max(2, Math.floor(years.length / 3)));

    // Calculer la courbe de tendance polynomiale
    const trendlineData = polynomialRegression(yearsNumeric, birthValues, regressionOrder);

    // Vérifier si le plugin ChartDataLabels est disponible
    if (!window.ChartDataLabels) {
      console.warn("ChartDataLabels n'est pas disponible");
    }

    // Configuration du graphique
    new Chart(chartElement, {
      type: "bar",
      data: {
        labels: years,
        datasets: [
          {
            label: "Naissances",
            data: birthValues,
            backgroundColor: "rgba(217, 119, 6, 0.2)",
            borderColor: "rgba(217, 119, 6, 1)",
            borderWidth: 1
          },
          {
            label: "Tendance",
            data: trendlineData,
            type: 'line',
            fill: false,
            borderColor: "rgba(153, 27, 27, 1)",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4, // Augmenter la tension pour une courbe plus lisse
            datalabels: {
              display: false
            }
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                if (ctx.datasetIndex === 0) {
                  return `Naissances : ${ctx.raw}`;
                } else {
                  return `Tendance : ${ctx.raw.toFixed(1)}`;
                }
              }
            }
          },
          datalabels: {
            color: '#444',
            font: {
              weight: 'bold'
            },
            formatter: (value) => {
              return Math.round(value);
            },
            anchor: 'end',
            align: 'top',
            offset: 0
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: value => value
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });

    console.log(`✅ Graphique des naissances créé avec régression polynomiale d'ordre ${regressionOrder}`);
  } catch (e) {
    console.error("Erreur graphique naissances :", e);
  }
});
