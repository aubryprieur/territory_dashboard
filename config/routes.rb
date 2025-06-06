Rails.application.routes.draw do
  get "epci_dashboard/index"
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations'
  }

  namespace :admin do
    resources :users

    # Routes pour la gestion des enquêtes (super admin uniquement)
    resources :surveys do
      member do
        patch :publish
        patch :unpublish
        get :preview
        post :duplicate
        get :results
        get :export_results
        patch :reorder
      end

      resources :survey_sections, except: [:index, :show] do
        resources :questions, except: [:index, :show] do
          resources :question_options, except: [:index, :show]
        end
      end
    end
  end

  # Routes pour les enquêtes utilisateurs (communes/EPCI)
  resources :user_surveys do
    collection do
      get :available
      get :compare
    end
    member do
      get :results
      get :export_results
      patch :close
      post :duplicate
    end
  end

  # Routes publiques pour répondre aux enquêtes via token
  get 'survey/:token', to: 'public_surveys#show', as: :public_survey
  post 'survey/:token/submit', to: 'public_surveys#submit_section', as: :submit_section_public_survey
  get 'survey/:token/thank-you', to: 'public_surveys#thank_you', as: :thank_you_public_survey

  # Routes publiques pour répondre aux enquêtes (pour plus tard)
  resources :surveys, only: [:show] do
    member do
      get :participate
      post :submit_response
    end
    resources :survey_responses, only: [:create, :update]
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

  get 'api/communes_geometries/:epci_code', to: 'api/geometries#communes_by_epci'

  # Route par défaut
  root "home#index"
end
