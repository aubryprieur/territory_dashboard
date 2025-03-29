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

  root "home#index"
end
