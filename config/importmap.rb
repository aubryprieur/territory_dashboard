pin "application"
pin "@hotwired/turbo", to: "https://cdn.jsdelivr.net/npm/@hotwired/turbo@7.3.0/dist/turbo.es2017-esm.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"

# ✅ Chart.js UMD + plugin
pin "chart.js", to: "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"
pin "chartjs-plugin-datalabels", to: "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"

# ✅ AlpineJS via UMD
pin "alpinejs", to: "https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/module.esm.js"

# Simple-Statistics pour les discrétisations
pin "simple-statistics", to: "https://cdn.jsdelivr.net/npm/simple-statistics@7.8.3/dist/simple-statistics.min.js"

# leaflet
pin "leaflet", to: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
# Export Excel (SheetJS), chargé seulement au clic sur « Télécharger » (import dynamique)
pin "xlsx", to: "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs"

# ✅ Utils
pin "utils/initialization_guard", to: "utils/initialization_guard.js"
pin "maps/map_manager", to: "maps/map_manager.js"

# Commune Dashboard
pin "charts/births_chart", to: "charts/births_chart.js"
pin "charts/families_charts", to: "charts/families_charts.js"
pin "charts/family_employment_chart", to: "charts/family_employment_chart.js"
pin "charts/births_projection_chart", to: "charts/births_projection_chart.js"

# EPCI Dashboard
# EPCI Charts


# EPCI Maps

# EPCI Dashboard - Système asynchrone
pin "epci/commune_search", to: "epci/commune_search.js"

# Dashboard communes
pin "dashboard/dashboard_init", to: "dashboard/dashboard_init.js"
pin "dashboard/charts_init", to: "dashboard/charts_init.js"

# Contrôleurs pour les enquêtes
pin "controllers/survey_tabs_controller", to: "controllers/survey_tabs_controller.js"
pin "controllers/survey_results_controller", to: "controllers/survey_results_controller.js"
pin "controllers/accordion_controller", to: "controllers/accordion_controller.js"
