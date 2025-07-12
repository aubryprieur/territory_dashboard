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

# ✅ Utils
pin "utils/initialization_guard", to: "utils/initialization_guard.js"
pin "maps/map_manager", to: "maps/map_manager.js"

# Commune Dashboard
pin "charts/historique_chart", to: "charts/historique_chart.js"
pin "charts/economic_charts", to: "charts/economic_charts.js"
pin "charts/births_chart", to: "charts/births_chart.js"
pin "charts/domestic_violence_chart", to: "charts/domestic_violence_chart.js"
pin "charts/family_employment_chart", to: "charts/family_employment_chart.js"
pin "charts/age_pyramid_chart", to: "charts/age_pyramid_chart.js"

# EPCI Dashboard

# Charts
pin "charts/epci_communes_chart", to: "charts/epci_communes_chart.js"
pin "charts/epci_age_pyramid_chart", to: "charts/epci_age_pyramid_chart.js"
pin "charts/epci_population_history_chart", to: "charts/epci_population_history_chart.js"
pin "charts/epci_family_employment_chart", to: "charts/epci_family_employment_chart.js"
pin "charts/epci_births_history_chart", to: "charts/epci_births_history_chart.js"
pin "charts/epci_domestic_violence_chart", to: "charts/epci_domestic_violence_chart.js"

# Maps
pin "maps/epci_domestic_violence_map", to: "maps/epci_domestic_violence_map.js"
pin "maps/epci_childcare_map", to: "maps/epci_childcare_map.js"
pin "maps/epci_births_map", to: "maps/epci_births_map.js"
pin "maps/epci_children_maps", to: "maps/epci_children_maps.js"
pin "maps/epci_economic_maps", to: "maps/epci_economic_maps.js"
pin "maps/epci_families_maps", to: "maps/epci_families_maps.js"
pin "maps/epci_schooling_maps", to: "maps/epci_schooling_maps.js"
pin "maps/epci_women_employment_maps", to: "maps/epci_women_employment_maps.js"

# EPCI Dashboard
pin "epci/dashboard_init", to: "epci/dashboard_init.js"
pin "epci/commune_search", to: "epci/commune_search.js"
pin "epci/tabs_scroll", to: "epci/tabs_scroll.js"

# Dashboard communes
pin "dashboard/dashboard_init", to: "dashboard/dashboard_init.js"

# Contrôleurs pour les enquêtes
pin "controllers/survey_tabs_controller", to: "controllers/survey_tabs_controller.js"
pin "controllers/survey_results_controller", to: "controllers/survey_results_controller.js"
pin "controllers/accordion_controller", to: "controllers/accordion_controller.js"
