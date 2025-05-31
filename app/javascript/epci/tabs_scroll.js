// app/javascript/epci/tabs_scroll.js

class TabsScroll {
  constructor() {
    this.tabsContainer = document.getElementById('tabs-container');
    this.scrollLeftBtn = document.getElementById('scroll-left');
    this.scrollRightBtn = document.getElementById('scroll-right');
    this.gradientLeft = document.getElementById('gradient-left');
    this.gradientRight = document.getElementById('gradient-right');

    if (!this.tabsContainer || !this.scrollLeftBtn || !this.scrollRightBtn) {
      console.warn('Éléments de scroll des onglets non trouvés');
      return;
    }

    this.init();
  }

  init() {
    // Event listeners
    this.scrollLeftBtn.addEventListener('click', this.scrollLeft.bind(this));
    this.scrollRightBtn.addEventListener('click', this.scrollRight.bind(this));
    this.tabsContainer.addEventListener('scroll', this.checkScroll.bind(this));
    window.addEventListener('resize', this.checkScroll.bind(this));

    // Vérification initiale après un délai pour s'assurer que le DOM est prêt
    setTimeout(() => this.checkScroll(), 100);
  }

  scrollLeft() {
    this.tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight() {
    this.tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });
  }

  checkScroll() {
    const scrollLeft = this.tabsContainer.scrollLeft;
    const scrollWidth = this.tabsContainer.scrollWidth;
    const clientWidth = this.tabsContainer.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    // Afficher/masquer la flèche gauche
    if (scrollLeft > 10) {
      this.scrollLeftBtn.classList.remove('opacity-0');
      this.scrollLeftBtn.classList.add('opacity-100');
      this.gradientLeft.classList.remove('opacity-0');
      this.gradientLeft.classList.add('opacity-100');
    } else {
      this.scrollLeftBtn.classList.remove('opacity-100');
      this.scrollLeftBtn.classList.add('opacity-0');
      this.gradientLeft.classList.remove('opacity-100');
      this.gradientLeft.classList.add('opacity-0');
    }

    // Afficher/masquer la flèche droite
    if (scrollLeft < maxScroll - 10) {
      this.scrollRightBtn.classList.remove('opacity-0');
      this.scrollRightBtn.classList.add('opacity-100');
      this.gradientRight.classList.remove('opacity-0');
      this.gradientRight.classList.add('opacity-100');
    } else {
      this.scrollRightBtn.classList.remove('opacity-100');
      this.scrollRightBtn.classList.add('opacity-0');
      this.gradientRight.classList.remove('opacity-100');
      this.gradientRight.classList.add('opacity-0');
    }
  }
}

// Fonction d'initialisation exportée
export function initializeTabsScroll() {
  return new TabsScroll();
}
