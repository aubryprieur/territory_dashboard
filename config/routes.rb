Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations'
  }

  namespace :admin do
    resources :users
  end

  # Route pour l'autocomplétion des territoires
  get 'territories/autocomplete', to: 'territories#autocomplete'

  # Routes pour le dashboard
  get 'dashboard', to: 'dashboard#index'

  # Rediriger les utilisateurs connectés vers leur dashboard
  authenticated :user do
    root 'dashboard#index', as: :authenticated_root
  end

  root "home#index"
end
