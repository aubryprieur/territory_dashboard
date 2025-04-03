import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu"]

  toggle() {
    console.log("Menu toggle triggered") // ← TEST
    this.menuTarget.classList.toggle("hidden")
  }
}
