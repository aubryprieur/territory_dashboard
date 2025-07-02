import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["chart"]
  static values = {
    statistics: Object,
    responsesByDay: Object,
    comparisonData: Object
  }

  connect() {
    console.log("Survey results controller connected")
    console.log("Chart targets found:", this.chartTargets.length)

    this.chartInstances = new Map()

    // Attendre que Chart.js soit disponible
    this.ensureChartJS().then(() => {
      console.log("Chart.js available, initializing charts")
      this.initializeCharts()
    }).catch(error => {
      console.error('Erreur Chart.js:', error)
    })
  }

  ensureChartJS() {
    return new Promise((resolve, reject) => {
      // Si Chart.js est déjà disponible
      if (window.Chart) {
        console.log("Chart.js already available")
        resolve()
        return
      }

      // Attendre qu'il soit chargé via importmap
      let attempts = 0
      const maxAttempts = 50

      const checkChart = () => {
        attempts++
        if (window.Chart) {
          console.log("Chart.js loaded via importmap")
          resolve()
        } else if (attempts >= maxAttempts) {
          console.log("Timeout waiting for Chart.js, loading from CDN")
          this.loadFromCDN().then(resolve).catch(reject)
        } else {
          setTimeout(checkChart, 100)
        }
      }

      checkChart()
    })
  }

  loadFromCDN() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js?v=${Date.now()}`
      script.onload = () => {
        console.log('Chart.js loaded from CDN')
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  initializeCharts() {
    // Nettoyer d'abord
    this.destroyExistingCharts()

    // Configuration globale
    if (window.Chart) {
      Chart.defaults.font.family = 'Inter, system-ui, sans-serif'
    }

    // Créer tous les graphiques
    this.chartTargets.forEach((canvas, index) => {
      console.log(`Processing canvas ${index}:`, canvas.dataset)
      this.createChart(canvas)
    })
  }

  destroyExistingCharts() {
    this.chartInstances.forEach((chart) => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy()
      }
    })
    this.chartInstances.clear()
  }

  createChart(canvas) {
    if (!canvas.dataset.chartType) {
      console.warn("No chart type found for canvas")
      return
    }

    const chartType = canvas.dataset.chartType
    const chartData = this.parseChartData(canvas.dataset.chartData)

    console.log(`Creating ${chartType} chart with data:`, chartData)

    try {
      let chart
      switch (chartType) {
        case 'doughnut':
          chart = this.createDoughnutChart(canvas, chartData)
          break
        case 'bar':
          chart = this.createBarChart(canvas, chartData)
          break
        case 'horizontalBar':
          chart = this.createRankingChart(canvas, chartData)
          break
        case 'line':
          chart = this.createLineChart(canvas, chartData)
          break
        default:
          console.warn(`Unsupported chart type: ${chartType}`)
          return
      }

      if (chart) {
        this.chartInstances.set(canvas, chart)
        console.log(`Chart created successfully for ${chartType}`)
      }
    } catch (error) {
      console.error(`Error creating chart:`, error)
    }
  }

  parseChartData(dataString) {
    try {
      return JSON.parse(dataString || '{}')
    } catch (error) {
      console.error('Error parsing chart data:', error)
      return {}
    }
  }

  createDoughnutChart(canvas, data) {
    const ctx = canvas.getContext('2d')

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels || [],
        datasets: [{
          data: data.values || [],
          backgroundColor: [
            'rgba(79, 70, 229, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderWidth: 2,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              boxWidth: 15
            }
          }
        }
      }
    })
  }

  createRankingChart(canvas, data) {
    const ctx = canvas.getContext('2d')

    // Inverser l'ordre pour que le meilleur apparaisse en haut
    const reversedLabels = [...data.labels].reverse()
    const reversedValues = [...data.values].reverse()

    // Créer un gradient de couleur du vert au rouge
    const backgroundColors = reversedValues.map((value, index) => {
      const position = index / (reversedValues.length - 1)
      if (position <= 0.33) {
        return `rgba(34, 197, 94, 0.8)` // Vert pour les meilleurs
      } else if (position <= 0.66) {
        return `rgba(234, 179, 8, 0.8)` // Jaune pour les moyens
      } else {
        return `rgba(239, 68, 68, 0.8)` // Rouge pour les moins bons
      }
    })

    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'))

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: reversedLabels,
        datasets: [{
          label: 'Rang moyen',
          data: reversedValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Barres horizontales
        scales: {
          x: {
            title: {
              display: true,
              text: 'Rang moyen (1 = meilleur)',
              font: {
                weight: 'bold'
              }
            },
            min: 1,
            max: data.total_options,
            reverse: true, // 1 à gauche, max à droite
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Options',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const rank = context.parsed.x
                const position = reversedLabels.length - context.dataIndex
                let medal = ''
                if (position === 1) medal = '🥇 '
                else if (position === 2) medal = '🥈 '
                else if (position === 3) medal = '🥉 '

                return `${medal}Rang moyen: ${rank.toFixed(1)}`
              }
            }
          }
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10
          }
        }
      }
    })
  }

  createBarChart(canvas, data) {
    const ctx = canvas.getContext('2d')

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels || [],
        datasets: [{
          label: data.label || 'Réponses',
          data: data.values || [],
          backgroundColor: 'rgba(79, 70, 229, 0.8)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 2
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
    })
  }

  createLineChart(canvas, data) {
    const ctx = canvas.getContext('2d')

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: [{
          label: data.label || 'Évolution',
          data: data.values || [],
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'white',
          pointBorderColor: 'rgb(79, 70, 229)',
          pointBorderWidth: 2,
          pointRadius: 5
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
    })
  }

  disconnect() {
    console.log("Survey results controller disconnected")
    this.destroyExistingCharts()
  }
}
