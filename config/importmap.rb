pin "application"
pin "@hotwired/turbo", to: "https://cdn.jsdelivr.net/npm/@hotwired/turbo@7.3.0/dist/turbo.es2017-esm.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"

# ✅ Chart.js UMD + plugin (pas ESM, pas default)
pin "chart.js", to: "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"
pin "chartjs-plugin-datalabels", to: "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"

# ✅ AlpineJS via UMD (ne pas utiliser "default")
pin "alpinejs", to: "https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/module.esm.js"

pin "charts/historique_chart", to: "charts/historique_chart.js"
pin "charts/economic_charts", to: "charts/economic_charts.js"
pin "charts/births_chart", to: "charts/births_chart.js"


