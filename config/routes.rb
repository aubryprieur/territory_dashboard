Rails.application.routes.draw do
  get "epci_dashboard/index"
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations'
  }

  namespace :admin do
    resources :users
  end

  # Route pour l'autocomplétion des territoires
  get 'territories/autocomplete', to: 'territories#autocomplete'
  # Route pour l'autocomplétion des EPCI
  get 'epcis/autocomplete', to: 'epcis#autocomplete'

  # Routes pour les dashboards
  get 'dashboard', to: 'dashboard#index'
  get 'epci_dashboard', to: 'epci_dashboard#index'

  # Redirection conditionnelle selon le type d'utilisateur
  authenticated :user do
    root to: "application#dashboard_router", as: :authenticated_root
  end

  # Route par défaut
  root "home#index"
end
