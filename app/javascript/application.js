// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import * as Turbo from "@hotwired/turbo"
window.Turbo = Turbo

import "controllers"

import Alpine from "alpinejs"
window.Alpine = Alpine
Alpine.start()

import * as Chart from "chart.js";
import * as ChartDataLabels from "chartjs-plugin-datalabels";
